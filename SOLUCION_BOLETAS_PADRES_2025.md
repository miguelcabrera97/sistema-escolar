# 🔍 Solución: Padres No Pueden Ver Boletas

## El Problema
Los padres no pueden ver las boletas que el directivo sube para sus hijos.

## 🎯 Diagnóstico Rápido

Ejecuta este script en Supabase SQL Editor:

```sql
-- Diagnóstico rápido
SELECT
  'Políticas RLS en boletas' as verificacion,
  COUNT(*)::text as resultado
FROM pg_policies
WHERE tablename = 'boletas'

UNION ALL

SELECT
  'Relaciones padre-alumno',
  COUNT(*)::text
FROM padre_alumno

UNION ALL

SELECT
  'Boletas subidas',
  COUNT(*)::text
FROM boletas

UNION ALL

SELECT
  'Padres sin hijos asignados',
  COUNT(*)::text
FROM padres p
LEFT JOIN padre_alumno pa ON p.id = pa.padre_id
WHERE pa.alumno_id IS NULL;
```

### Resultados Esperados:
- **Políticas RLS**: Debe ser >= 3
- **Relaciones padre-alumno**: Debe ser > 0 (si tienes padres con hijos)
- **Boletas subidas**: Debe ser > 0
- **Padres sin hijos**: Debe ser 0 (o la cantidad de padres que realmente no tienen hijos)

---

## ✅ Solución en 4 Pasos

### PASO 1: Aplicar Fix de Políticas RLS

1. Abre tu Dashboard de Supabase
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `APLICAR_FIX_BOLETAS_PADRES.sql`
4. Ejecuta todo el script
5. Verifica que se crearon 3 políticas:
   - "Padres pueden ver boletas de sus hijos"
   - "Directivos tienen acceso completo a boletas"
   - "Alumnos pueden ver sus propias boletas"

### PASO 2: Verificar Bucket de Storage es Público

1. En Supabase Dashboard, ve a **Storage**
2. Busca el bucket **`boletas`**
3. Haz clic en el bucket `boletas`
4. Haz clic en **Settings** (⚙️ icono arriba a la derecha)
5. **MARCA** la opción "Public bucket" ✅
6. Guarda los cambios

**¿Por qué?** Si el bucket no es público, los PDFs no se pueden descargar.

### PASO 3: Verificar Relaciones Padre-Alumno

Ejecuta esta consulta:

```sql
SELECT
  prof_padre.email as padre_email,
  prof_padre.nombre as padre_nombre,
  prof_alumno.nombre as alumno_nombre,
  prof_alumno.apellidos as alumno_apellidos,
  a.matricula
FROM padre_alumno pa
INNER JOIN padres p ON pa.padre_id = p.id
INNER JOIN profiles prof_padre ON p.user_id = prof_padre.id
INNER JOIN alumnos a ON pa.alumno_id = a.id
INNER JOIN profiles prof_alumno ON a.user_id = prof_alumno.id
ORDER BY padre_email;
```

**¿Qué buscar?**
- ✅ Debes ver cada padre con su(s) hijo(s)
- ❌ Si la tabla está vacía = **NO hay relaciones padre-alumno**
- ❌ Si falta un padre específico = **Ese padre no tiene hijos asignados**

**Si falta alguna relación:**

**Opción A: Desde la Aplicación (Recomendado)**
1. Inicia sesión como **Directivo**
2. Ve a **Usuarios** > Tab **Alumnos**
3. Busca al alumno
4. Haz clic en **Editar** (✏️)
5. En el campo **"Padre/Tutor"** selecciona el padre
6. Guarda

**Opción B: Desde SQL (Avanzado)**
```sql
-- 1. Obtener ID del padre
SELECT p.id, prof.email, prof.nombre
FROM padres p
INNER JOIN profiles prof ON p.user_id = prof.id
WHERE prof.email = 'padre@ejemplo.com';
-- Anota el ID del padre

-- 2. Obtener ID del alumno
SELECT a.id, a.matricula, prof.nombre
FROM alumnos a
INNER JOIN profiles prof ON a.user_id = prof.id
WHERE a.matricula = 'A01-SEC-2025';
-- Anota el ID del alumno

-- 3. Crear la relación
INSERT INTO padre_alumno (padre_id, alumno_id)
VALUES ('ID_PADRE', 'ID_ALUMNO');
```

### PASO 4: Verificar que Hay Boletas Subidas

```sql
SELECT
  b.periodo,
  b.ciclo_escolar,
  a.matricula,
  prof.nombre as alumno_nombre,
  b.fecha_subida,
  (SELECT COUNT(*) FROM padre_alumno WHERE alumno_id = b.alumno_id) as tiene_padres
FROM boletas b
INNER JOIN alumnos a ON b.alumno_id = a.id
INNER JOIN profiles prof ON a.user_id = prof.id
ORDER BY b.fecha_subida DESC;
```

**Verifica:**
- ✅ `tiene_padres` > 0 = El alumno SÍ tiene padre asignado
- ❌ `tiene_padres` = 0 = El alumno NO tiene padre asignado

---

## 🧪 Probar que Funciona

1. **Cierra sesión** en tu aplicación
2. **Inicia sesión como padre**
3. Ve a **Calificaciones**
4. Deberías ver:
   - Selector con tus hijos
   - Boletas disponibles para cada hijo
   - Botón "Descargar PDF" funcional

---

## 🐛 Problemas Comunes

### Problema 1: "No hay boletas disponibles aún"

**Posibles causas:**

**A) No hay relación padre-alumno**
```sql
-- Verificar
SELECT * FROM padre_alumno pa
INNER JOIN padres p ON pa.padre_id = p.id
INNER JOIN profiles prof ON p.user_id = prof.id
WHERE prof.email = 'EMAIL_DEL_PADRE';
```
- Si está vacío → Asignar hijo al padre (Paso 3)

**B) No hay boletas para ese alumno**
```sql
-- Verificar
SELECT * FROM boletas b
INNER JOIN alumnos a ON b.alumno_id = a.id
INNER JOIN padre_alumno pa ON pa.alumno_id = a.id
INNER JOIN padres p ON pa.padre_id = p.id
INNER JOIN profiles prof ON p.user_id = prof.id
WHERE prof.email = 'EMAIL_DEL_PADRE';
```
- Si está vacío → El directivo debe subir boletas

**C) Políticas RLS bloqueando acceso**
- Re-ejecutar `APLICAR_FIX_BOLETAS_PADRES.sql`

### Problema 2: Error 403 al descargar PDF

**Causa:** Bucket no es público

**Solución:**
1. Storage > boletas > Settings
2. Marca "Public bucket"
3. Guarda

### Problema 3: Padre ve selector de hijos vacío

**Causa:** El padre no está en la tabla `padres` o no tiene hijos asignados

**Verificar:**
```sql
SELECT
  p.id,
  prof.email,
  prof.nombre,
  COUNT(pa.alumno_id) as num_hijos
FROM profiles prof
LEFT JOIN padres p ON p.user_id = prof.id
LEFT JOIN padre_alumno pa ON pa.padre_id = p.id
WHERE prof.email = 'EMAIL_DEL_PADRE'
GROUP BY p.id, prof.email, prof.nombre;
```

Si `num_hijos = 0` → Asignar hijos (Paso 3)

### Problema 4: "No autorizado para ver estas boletas"

**Causa:** La función `obtenerBoletasAlumno` no encuentra la relación

**Verificar paso a paso:**
```sql
-- 1. Usuario padre existe
SELECT * FROM profiles WHERE email = 'EMAIL_DEL_PADRE';

-- 2. Está en tabla padres
SELECT * FROM padres p
INNER JOIN profiles prof ON p.user_id = prof.id
WHERE prof.email = 'EMAIL_DEL_PADRE';

-- 3. Tiene relación con alumno
SELECT * FROM padre_alumno pa
INNER JOIN padres p ON pa.padre_id = p.id
INNER JOIN profiles prof ON p.user_id = prof.id
WHERE prof.email = 'EMAIL_DEL_PADRE';
```

---

## 📋 Checklist Final

Antes de dar por resuelto:

- [ ] Ejecuté `APLICAR_FIX_BOLETAS_PADRES.sql` sin errores
- [ ] Las 3 políticas RLS están creadas (verificado con query)
- [ ] El bucket `boletas` está marcado como público
- [ ] El padre tiene al menos 1 hijo asignado en `padre_alumno`
- [ ] Hay al menos 1 boleta subida para el hijo
- [ ] Al probar como padre, veo la lista de hijos
- [ ] Al seleccionar un hijo, veo las boletas
- [ ] Puedo descargar el PDF sin error 403

---

## 🔬 Script de Diagnóstico Completo

Para un diagnóstico más detallado, ejecuta:

```bash
DIAGNOSTICO_COMPLETO_BOLETAS_PADRES.sql
```

Este script ejecutará 11 consultas que identificarán exactamente dónde está el problema.

---

## 📞 Necesitas Ayuda

Si después de seguir todos los pasos el problema persiste:

1. Ejecuta `DIAGNOSTICO_COMPLETO_BOLETAS_PADRES.sql`
2. Captura los resultados de las consultas
3. Abre la consola del navegador (F12) cuando estés como padre
4. Ve a la pestaña "Console" y busca errores en rojo
5. Comparte:
   - Resultados del diagnóstico
   - Errores de la consola
   - Email del padre afectado (para verificar en la BD)

---

**Última actualización**: Enero 2025
