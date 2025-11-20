# Fix: Asignación de Padre a Alumno

## 🔍 Problemas Identificados

1. **Falta política RLS (Row Level Security)** en la tabla `padre_alumno`
   - La tabla solo tenía políticas para SELECT
   - Faltaban políticas para INSERT, UPDATE y DELETE
   - Esto bloqueaba todas las inserciones/actualizaciones

2. **El formulario no cargaba el padre actual del alumno**
   - Al editar un alumno, el campo "Padre Asignado" aparecía vacío
   - La función `obtenerAlumnos()` no incluía la información del padre
   - El componente `FormularioAlumno` no cargaba el padre asignado

## ✅ Soluciones Implementadas

### 1. Políticas RLS agregadas ✓

He creado la migración y un script SQL para aplicar. **Debes ejecutar este script primero:**

**Archivo:** `APLICAR_FIX_PADRE_ALUMNO.sql`

**Instrucciones:**
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com)
2. Ve a **SQL Editor**
3. Abre el archivo `APLICAR_FIX_PADRE_ALUMNO.sql`
4. Copia todo el contenido
5. Pégalo en el SQL Editor
6. Haz clic en **Run**

**Políticas agregadas:**
- ✅ INSERT: Permite a directivos crear relaciones padre-alumno
- ✅ UPDATE: Permite a directivos actualizar relaciones
- ✅ DELETE: Permite a directivos eliminar relaciones

### 2. Backend actualizado ✓

**Archivo modificado:** `app/actions/usuarios-actions.ts`

**Cambio realizado:**
- La función `obtenerAlumnos()` ahora incluye la relación padre-alumno con toda la información del padre asignado

### 3. Frontend actualizado ✓

**Archivo modificado:** `app/directivo/usuarios/FormularioAlumno.tsx`

**Cambios realizados:**
- Interfaz `FormularioAlumnoProps` actualizada para incluir `padre_alumno`
- useEffect actualizado para cargar el padre asignado actual cuando se edita un alumno
- Ahora el campo "Padre Asignado" muestra correctamente el padre actual

## 🚀 Pasos para Probar

1. **Aplicar la migración SQL** (paso más importante)
   - Ejecuta el script `APLICAR_FIX_PADRE_ALUMNO.sql` en Supabase

2. **Reiniciar el servidor de desarrollo** (opcional pero recomendado)
   ```bash
   npm run dev
   ```

3. **Probar la asignación de padre**
   - Ve a la sección de usuarios (alumnos)
   - Edita un alumno
   - Selecciona un padre en el campo "Padre Asignado"
   - Guarda los cambios
   - Recarga la página
   - Edita el mismo alumno nuevamente
   - ✅ Deberías ver el padre asignado seleccionado en el campo

4. **Probar desde relaciones padre-alumno**
   - Ve a la sección "Relaciones Padre-Alumno"
   - Haz clic en "Asignar Alumno a Padre"
   - Selecciona un padre y un alumno
   - Crea la relación
   - ✅ La relación debe crearse exitosamente

## 📋 Verificación

### Verificar en Supabase Dashboard:
1. Ve a **SQL Editor**
2. Ejecuta:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'padre_alumno';
   ```
3. Deberías ver 5 políticas:
   - 2 políticas SELECT (padres y directivos)
   - 1 política INSERT (directivos)
   - 1 política UPDATE (directivos)
   - 1 política DELETE (directivos)

### Verificar datos en la tabla:
```sql
SELECT
  pa.id,
  pa.parentesco,
  p_padre.nombre as padre_nombre,
  p_padre.apellidos as padre_apellidos,
  p_alumno.nombre as alumno_nombre,
  p_alumno.apellidos as alumno_apellidos
FROM padre_alumno pa
JOIN padres padre ON pa.padre_id = padre.id
JOIN profiles p_padre ON padre.user_id = p_padre.id
JOIN alumnos alumno ON pa.alumno_id = alumno.id
JOIN profiles p_alumno ON alumno.user_id = p_alumno.id;
```

## ⚠️ Importante

**DEBES APLICAR EL SCRIPT SQL PRIMERO** antes de que funcione. Sin las políticas RLS, Supabase bloqueará todas las operaciones de INSERT, UPDATE y DELETE en la tabla `padre_alumno`.

## 📁 Archivos Modificados

1. ✅ `supabase/migrations/20250115_fix_padre_alumno_rls.sql` (nuevo)
2. ✅ `APLICAR_FIX_PADRE_ALUMNO.sql` (nuevo - script rápido)
3. ✅ `app/actions/usuarios-actions.ts` (modificado)
4. ✅ `app/directivo/usuarios/FormularioAlumno.tsx` (modificado)

## 🎯 Resultado Esperado

Después de aplicar estos cambios:
- ✅ Podrás asignar padres a alumnos desde el formulario de edición
- ✅ Podrás asignar alumnos a padres desde "Relaciones Padre-Alumno"
- ✅ El padre asignado se guardará correctamente en la base de datos
- ✅ Al editar un alumno, verás el padre actualmente asignado
- ✅ Los cambios persistirán después de recargar la página
