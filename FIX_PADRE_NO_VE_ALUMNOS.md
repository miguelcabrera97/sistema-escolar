# Fix: Padre no ve alumnos asignados

## 🔍 Problema
El usuario jorge.perez@padre.com no ve sus alumnos asignados cuando inicia sesión.

## ✅ Causas Identificadas y Solucionadas

### 1. Nombres de campos incorrectos en la consulta ✓
**Problema:** El código usaba nombres de campos antiguos que no coinciden con la base de datos.

**Campos incorrectos:**
- `concepto` → Debería ser `concepto_nombre`
- `status` → Debería ser `estado`
- `fecha_entrega` → Debería ser `fecha_vencimiento`

**Archivo corregido:** `app/padre/page.tsx`

### 2. Falta de políticas RLS (más probable) ⚠️
**Problema:** Si las políticas RLS no están aplicadas, la consulta falla silenciosamente y no retorna datos.

**Solución:** Debes ejecutar el script SQL en Supabase.

### 3. Padre no existe en tabla `padres`
**Problema:** Es posible que jorge.perez@padre.com no tenga un registro en la tabla `padres`.

**Solución:** Ejecutar la migración de padres.

## 🚀 PASOS PARA RESOLVER (en orden)

### PASO 1: Aplicar políticas RLS (MUY IMPORTANTE) ⚠️

1. Ve a [Supabase Dashboard](https://supabase.com)
2. Abre **SQL Editor**
3. Copia y ejecuta este script:

```sql
-- Políticas RLS para padre_alumno
DROP POLICY IF EXISTS "Directivos pueden crear relaciones padre-alumno" ON padre_alumno;
CREATE POLICY "Directivos pueden crear relaciones padre-alumno"
  ON padre_alumno FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

DROP POLICY IF EXISTS "Directivos pueden actualizar relaciones padre-alumno" ON padre_alumno;
CREATE POLICY "Directivos pueden actualizar relaciones padre-alumno"
  ON padre_alumno FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

DROP POLICY IF EXISTS "Directivos pueden eliminar relaciones padre-alumno" ON padre_alumno;
CREATE POLICY "Directivos pueden eliminar relaciones padre-alumno"
  ON padre_alumno FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );
```

### PASO 2: Verificar que jorge.perez@padre.com exista en la tabla padres

Ejecuta en SQL Editor:

```sql
-- Verificar si existe en profiles
SELECT id, nombre, apellidos, email, role
FROM profiles
WHERE email = 'jorge.perez@padre.com';

-- Verificar si existe en tabla padres
SELECT padre.id, p.email, p.nombre, p.apellidos
FROM padres padre
JOIN profiles p ON padre.user_id = p.id
WHERE p.email = 'jorge.perez@padre.com';
```

**Si NO aparece en la tabla padres:**

```sql
-- Migrar padre a la tabla padres
INSERT INTO padres (user_id)
SELECT id FROM profiles
WHERE email = 'jorge.perez@padre.com'
  AND role = 'padre'
  AND NOT EXISTS (
    SELECT 1 FROM padres WHERE user_id = profiles.id
  );
```

### PASO 3: Verificar si jorge.perez tiene alumnos asignados

```sql
-- Primero, verificar la estructura de la tabla
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'padre_alumno'
ORDER BY ordinal_position;

-- Luego, consultar los alumnos de jorge.perez
SELECT
  pa.padre_id,
  pa.alumno_id,
  pa.parentesco,
  p_padre.email as padre_email,
  a.matricula,
  p_alumno.nombre as alumno_nombre,
  p_alumno.apellidos as alumno_apellidos
FROM padre_alumno pa
JOIN padres padre ON pa.padre_id = padre.id
JOIN profiles p_padre ON padre.user_id = p_padre.id
JOIN alumnos a ON pa.alumno_id = a.id
JOIN profiles p_alumno ON a.user_id = p_alumno.id
WHERE p_padre.email = 'jorge.perez@padre.com';
```

**Si NO tiene alumnos asignados:**

Tienes dos opciones:

**Opción A:** Desde la interfaz
1. Inicia sesión como directivo
2. Ve a "Relaciones Padre-Alumno"
3. Haz clic en "Asignar Alumno a Padre"
4. Selecciona a jorge.perez@padre.com
5. Selecciona el/los alumno(s)
6. Guarda

**Opción B:** Desde SQL (más rápido)
```sql
-- Primero obtén los IDs
SELECT padre.id as padre_id FROM padres padre
JOIN profiles p ON padre.user_id = p.id
WHERE p.email = 'jorge.perez@padre.com';

SELECT id as alumno_id, matricula, grado, grupo
FROM alumnos
ORDER BY matricula;

-- Luego inserta la relación (reemplaza los IDs)
INSERT INTO padre_alumno (padre_id, alumno_id, parentesco)
VALUES (
  'PADRE_ID_AQUI',
  'ALUMNO_ID_AQUI',
  'Padre'
);
```

### PASO 4: Probar

1. Cierra sesión de jorge.perez@padre.com
2. Vuelve a iniciar sesión
3. Ahora deberías ver los alumnos asignados

## 📁 Archivos Modificados

1. ✅ `app/padre/page.tsx` - Corregidos nombres de campos
2. ✅ `supabase/migrations/20250115_fix_padre_alumno_rls.sql` - Políticas RLS

## 🔍 Herramientas de Diagnóstico

He creado estos archivos para ayudarte a diagnosticar:

1. **DIAGNOSTICO_PADRE_JORGE.sql** - Script completo para diagnosticar el estado de jorge.perez@padre.com
2. **CONSULTAS_PADRE_ALUMNO.sql** - Consultas útiles para ver relaciones padre-alumno
3. **APLICAR_FIX_PADRE_ALUMNO.sql** - Script para aplicar las políticas RLS

## ⚠️ Lo MÁS IMPORTANTE

**DEBES ejecutar el script de políticas RLS primero** (PASO 1). Sin esto, las consultas fallarán silenciosamente y los padres no verán a sus hijos.

## 📊 Verificación Final

Después de hacer todos los pasos, ejecuta esto para verificar:

```sql
-- Resumen completo de jorge.perez@padre.com
SELECT
  p.email as padre_email,
  p.nombre as padre_nombre,
  COUNT(pa.alumno_id) as total_alumnos,
  STRING_AGG(
    p_alumno.nombre || ' ' || p_alumno.apellidos || ' (' || a.matricula || ')',
    ', '
  ) as alumnos
FROM profiles p
JOIN padres padre ON p.id = padre.user_id
LEFT JOIN padre_alumno pa ON padre.id = pa.padre_id
LEFT JOIN alumnos a ON pa.alumno_id = a.id
LEFT JOIN profiles p_alumno ON a.user_id = p_alumno.id
WHERE p.email = 'jorge.perez@padre.com'
GROUP BY p.email, p.nombre;
```

**Resultado esperado:**
- `total_alumnos` > 0
- `alumnos` lista los nombres y matrículas

Si `total_alumnos` = 0, entonces jorge.perez no tiene alumnos asignados (ir al PASO 3).
