# 🔧 Solucionar Acceso de Padres a Boletas

## Problema
Los padres no pueden ver las boletas que el directivo sube para sus hijos.

## ✅ Solución Paso a Paso

### Paso 1: Verificar Storage Bucket (Supabase Dashboard)

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Storage** en el menú lateral
4. Busca el bucket llamado **`boletas`**

**Si NO existe el bucket:**
- Créalo: Clic en "New bucket"
- Nombre: `boletas`
- Marca como **Public bucket** ✅
- Clic en "Create bucket"

**Si YA existe el bucket:**
- Haz clic en él
- Ve a **Settings** (⚙️ arriba a la derecha)
- Asegúrate de que esté marcado **"Public bucket"** ✅
- Guarda los cambios

---

### Paso 2: Configurar Políticas de la Tabla `boletas`

Ejecuta el siguiente SQL en el **SQL Editor** de Supabase:

```sql
-- 1. Eliminar políticas antiguas que puedan causar conflicto
DROP POLICY IF EXISTS "Los padres pueden ver boletas de sus hijos" ON boletas;
DROP POLICY IF EXISTS "Padres pueden ver boletas de sus hijos" ON boletas;
DROP POLICY IF EXISTS "padres_read_boletas" ON boletas;
DROP POLICY IF EXISTS "Directivos tienen acceso completo a boletas" ON boletas;
DROP POLICY IF EXISTS "Alumnos pueden ver sus propias boletas" ON boletas;

-- 2. Crear política para PADRES (ver boletas de sus hijos)
CREATE POLICY "Padres pueden ver boletas de sus hijos"
ON boletas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM padres p
    INNER JOIN padre_alumno pa ON p.id = pa.padre_id
    WHERE p.user_id = auth.uid()
    AND pa.alumno_id = boletas.alumno_id
  )
);

-- 3. Crear política para DIRECTIVOS (acceso completo)
CREATE POLICY "Directivos tienen acceso completo a boletas"
ON boletas
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'directivo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'directivo'
  )
);

-- 4. Crear política para ALUMNOS (ver sus propias boletas)
CREATE POLICY "Alumnos pueden ver sus propias boletas"
ON boletas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM alumnos
    WHERE user_id = auth.uid()
    AND id = boletas.alumno_id
  )
);
```

---

### Paso 3: Verificar Relaciones Padre-Alumno

Ejecuta este SQL para ver si los padres están correctamente relacionados con sus hijos:

```sql
SELECT
  prof.email as padre_email,
  prof.nombre as padre_nombre,
  prof.apellidos as padre_apellidos,
  prof_alumno.nombre as alumno_nombre,
  prof_alumno.apellidos as alumno_apellidos,
  a.matricula as alumno_matricula
FROM padres p
INNER JOIN profiles prof ON p.user_id = prof.id
INNER JOIN padre_alumno pa ON p.id = pa.padre_id
INNER JOIN alumnos a ON pa.alumno_id = a.id
INNER JOIN profiles prof_alumno ON a.user_id = prof_alumno.id
WHERE prof.role = 'padre'
ORDER BY padre_nombre, alumno_nombre;
```

**Si no aparecen relaciones**, necesitas crear las relaciones padre-alumno:
- Ve a la página de **Directivo > Usuarios**
- En la sección de Alumnos, edita el alumno
- Asigna el padre correspondiente

---

### Paso 4: Verificar que Existan Boletas

Ejecuta este SQL para ver las boletas existentes:

```sql
SELECT
  b.id,
  b.periodo,
  b.ciclo_escolar,
  a.matricula,
  prof.nombre as alumno_nombre,
  prof.apellidos as alumno_apellidos,
  b.archivo_url,
  b.fecha_subida
FROM boletas b
INNER JOIN alumnos a ON b.alumno_id = a.id
INNER JOIN profiles prof ON a.user_id = prof.id
ORDER BY b.fecha_subida DESC;
```

**Si no hay boletas:**
- Ve a **Directivo > Boletas**
- Sube una boleta para el alumno

---

### Paso 5: Probar el Acceso

1. **Cierra sesión** en el sistema
2. **Inicia sesión como padre** (ejemplo: `jorge.perez@padre.com` / `123456`)
3. Ve a **Padre > Calificaciones**
4. Deberías ver:
   - Tus hijos en el selector
   - Las boletas disponibles para cada hijo
   - El botón "Descargar PDF" funcional

---

## 🐛 Si Aún No Funciona

### Opción A: Revisar Consola del Navegador

1. Abre las **Herramientas de Desarrollo** (F12)
2. Ve a la pestaña **Console**
3. Busca errores en rojo
4. Comparte el error para ayudarte mejor

### Opción B: Verificar Relación Padre-Hijo

```sql
-- Para un padre específico (reemplaza el email)
SELECT
  p.id as padre_id,
  pa.alumno_id,
  a.matricula
FROM padres p
INNER JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN padre_alumno pa ON p.id = pa.padre_id
LEFT JOIN alumnos a ON pa.alumno_id = a.id
WHERE prof.email = 'jorge.perez@padre.com';
```

Si `alumno_id` es `NULL`, significa que el padre no está relacionado con ningún alumno.

### Opción C: Usar URLs Firmadas (Más Seguro)

Si prefieres que el bucket NO sea público y usar URLs firmadas temporales:

1. **NO marques el bucket como público**

2. **Modifica el componente** `app/padre/calificaciones/page.tsx`:

Busca la línea 331 y reemplázala:

```typescript
// ANTES (línea ~331):
<Button
  size="lg"
  onClick={() => window.open(boleta.archivo_url, '_blank')}
  className="ml-4"
>

// DESPUÉS:
<Button
  size="lg"
  onClick={async () => {
    const result = await obtenerUrlDescargaBoleta(boleta.id)
    if (result.success && result.data?.url) {
      window.open(result.data.url, '_blank')
    } else {
      alert('Error al obtener el enlace de descarga')
    }
  }}
  className="ml-4"
>
```

3. **Agrega el import** al inicio del archivo:

```typescript
import { obtenerBoletasAlumno, obtenerUrlDescargaBoleta } from '@/app/actions/boletas-actions'
```

---

## 📋 Checklist de Verificación

- [ ] El bucket `boletas` existe en Supabase Storage
- [ ] El bucket está marcado como **Public** (o usas URLs firmadas)
- [ ] Las políticas RLS están configuradas correctamente
- [ ] El padre tiene relación con el alumno en `padre_alumno`
- [ ] Existe al menos una boleta para el alumno
- [ ] Al probar como padre, aparecen las boletas

---

## 🎯 Resultado Esperado

Cuando todo esté configurado correctamente:

1. El padre inicia sesión
2. Va a **Calificaciones**
3. Selecciona a su hijo del dropdown
4. Ve la lista de boletas disponibles
5. Hace clic en "Descargar PDF"
6. Se abre el PDF de la boleta en una nueva pestaña

---

## 📞 Ayuda Adicional

Si después de seguir todos estos pasos aún no funciona:

1. Ejecuta el script `FIX_BOLETAS_PADRES.sql` completo
2. Verifica los resultados de las consultas de verificación
3. Comparte los errores de la consola del navegador
4. Verifica que el usuario padre tenga `role = 'padre'` en la tabla `profiles`

---

**Última actualización**: Enero 2025
