# Solución: No puedo cambiar el estado de alumnos y maestros

## Problema Identificado

El sistema no puede cambiar el estado de usuarios (activar/desactivar) porque **falta el campo `activo` en la tabla `profiles` de Supabase**.

## Causa Raíz

Las funciones `desactivarAlumno()`, `reactivarAlumno()`, `desactivarMaestro()` y `reactivarMaestro()` intentan actualizar el campo `activo` en la tabla `profiles`, pero esta columna no existe en la base de datos.

```typescript
// Código en usuarios-actions.ts línea 642-645
const { error: profileError } = await supabase
  .from('profiles')
  .update({ activo: false })  // ❌ Campo 'activo' no existe
  .eq('id', existingAlumno.user_id)
```

## Solución

### Paso 1: Agregar el campo `activo` a la tabla `profiles`

**Método 1: Usando Supabase SQL Editor (Recomendado)**

1. Ve a tu proyecto en Supabase Dashboard
2. Abre el **SQL Editor** (icono de base de datos en el menú lateral)
3. Crea una nueva query
4. Copia y pega el siguiente SQL:

```sql
-- Agregar campo activo a la tabla profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true NOT NULL;

-- Actualizar todos los registros existentes a activo = true
UPDATE profiles
SET activo = true
WHERE activo IS NULL;

-- Crear índice para mejorar rendimiento en consultas por estado
CREATE INDEX IF NOT EXISTS idx_profiles_activo ON profiles(activo);

-- Verificar que se agregó correctamente
SELECT id, nombre, apellidos, email, role, activo
FROM profiles
LIMIT 5;
```

5. Haz clic en **RUN** para ejecutar el SQL
6. Verifica que la última consulta muestre los usuarios con el campo `activo = true`

**Método 2: Usando el Table Editor**

1. Ve a **Table Editor** en Supabase Dashboard
2. Selecciona la tabla `profiles`
3. Haz clic en el botón **+ New Column**
4. Configura:
   - **Name:** `activo`
   - **Type:** `bool` (boolean)
   - **Default Value:** `true`
   - **Is Nullable:** Desmarcado (NOT NULL)
5. Haz clic en **Save**
6. Ejecuta este UPDATE para asegurar que todos los registros existentes tengan `activo = true`:

```sql
UPDATE profiles SET activo = true WHERE activo IS NULL;
```

### Paso 2: Verificar que el código esté actualizado

Ya actualicé el archivo `app/actions/usuarios-actions.ts` para incluir el campo `activo` en las consultas. Específicamente en la línea 271:

```typescript
const { data: alumnos, error } = await supabase
  .from('alumnos')
  .select(`
    *,
    profiles (
      nombre,
      apellidos,
      email,
      telefono,
      activo    // ✅ Campo agregado
    )
  `)
  .order('matricula')
```

### Paso 3: Reiniciar el servidor de desarrollo

Después de aplicar los cambios en la base de datos:

```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar
npm run dev
```

### Paso 4: Probar la funcionalidad

1. Abre http://localhost:3001
2. Inicia sesión como **directivo**
3. Ve a **Gestionar Usuarios**
4. Prueba las siguientes acciones:

   **Para Alumnos:**
   - Haz clic en el botón de eliminar (🗑️) de un alumno activo
   - Confirma la desactivación en el diálogo
   - Verifica que:
     - El badge cambie a "Inactivo"
     - La fila tenga opacidad reducida
     - El botón de eliminar cambie a botón de reactivar (🔄)
     - El botón de editar se deshabilite

   - Haz clic en el botón de reactivar (🔄) de un alumno inactivo
   - Verifica que:
     - El badge cambie a "Activo"
     - La fila recupere opacidad normal
     - El botón de reactivar cambie a botón de eliminar
     - El botón de editar se habilite

   **Para Maestros:**
   - Repite las mismas pruebas con maestros

## Verificación de la Solución

### 1. Verificar campo en base de datos

En Supabase SQL Editor, ejecuta:

```sql
-- Ver la estructura de la tabla profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'activo';
```

Deberías ver:

```
column_name | data_type | is_nullable | column_default
------------|-----------|-------------|---------------
activo      | boolean   | NO          | true
```

### 2. Verificar valores actuales

```sql
-- Ver cuántos usuarios están activos vs inactivos
SELECT
  role,
  activo,
  COUNT(*) as total
FROM profiles
GROUP BY role, activo
ORDER BY role, activo;
```

### 3. Probar manualmente una desactivación

```sql
-- Desactivar un usuario específico
UPDATE profiles
SET activo = false
WHERE email = 'usuario@ejemplo.com';

-- Verificar el cambio
SELECT nombre, apellidos, email, role, activo
FROM profiles
WHERE email = 'usuario@ejemplo.com';
```

## Troubleshooting

### Error: "column 'activo' does not exist"

**Causa:** El campo no se agregó correctamente a la tabla.

**Solución:** Ejecuta nuevamente el SQL del Paso 1.

### Error: "null value in column 'activo' violates not-null constraint"

**Causa:** Intentas insertar un registro sin especificar el valor de `activo`.

**Solución:** El campo tiene `DEFAULT true`, así que debería funcionar automáticamente. Si persiste, modifica las funciones de crear usuario para incluir explícitamente:

```typescript
await supabase
  .from('profiles')
  .insert({
    // ... otros campos
    activo: true  // Agregar explícitamente
  })
```

### Los cambios de estado no se reflejan en la UI

**Causa:** La caché de Next.js no se está actualizando.

**Solución:**
1. Verifica que las funciones de Server Actions incluyan `revalidatePath()` (ya lo tienen)
2. Haz un hard refresh en el navegador (Ctrl + Shift + R)
3. Reinicia el servidor de desarrollo

### No veo el campo `activo` en las listas

**Causa:** El código no está incluyendo el campo en la consulta.

**Solución:** Ya actualicé `obtenerAlumnos()` para incluir `activo` en el select. Para maestros, ya está incluido con `select('*')`.

## Archivos Modificados

### 1. `app/actions/usuarios-actions.ts`

**Línea 271:** Agregado campo `activo` en `obtenerAlumnos()`

```typescript
profiles (
  nombre,
  apellidos,
  email,
  telefono,
  activo  // ✅ Agregado
)
```

**Líneas 609-730:** Funciones de desactivar/reactivar ya implementadas:
- `desactivarAlumno()`
- `reactivarAlumno()`
- `desactivarMaestro()`
- `reactivarMaestro()`

### 2. `app/directivo/usuarios/ListaAlumnos.tsx`

Ya incluye:
- Estado para manejar eliminación/reactivación
- Handlers para las acciones
- UI con badges dinámicos
- Botones condicionales
- Diálogo de confirmación

### 3. `app/directivo/usuarios/ListaMaestros.tsx`

Ya incluye:
- Estado para manejar eliminación/reactivación
- Handlers para las acciones
- UI con badges dinámicos
- Botones condicionales
- Diálogo de confirmación

## Políticas RLS Recomendadas

Si tienes políticas RLS habilitadas, asegúrate de que permitan actualizar el campo `activo`:

```sql
-- Permitir a directivos actualizar el campo activo
CREATE POLICY "Directivos pueden actualizar activo"
ON profiles
FOR UPDATE
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
```

## Estado Después de la Solución

Una vez completados todos los pasos:

✅ Campo `activo` existe en tabla `profiles`
✅ Todos los usuarios existentes tienen `activo = true`
✅ Índice creado para optimizar consultas
✅ Código actualizado para incluir campo `activo`
✅ Server Actions funcionando correctamente
✅ UI mostrando estados correctamente
✅ Botones de activar/desactivar operativos

## Siguiente Paso Recomendado

Después de verificar que funciona:

1. Haz commit de los cambios:
```bash
git add .
git commit -m "Add activo field to profiles and implement soft delete functionality"
git push
```

2. Documenta en Supabase la migración creada para referencia futura

3. Considera crear un script de migración para otros ambientes (staging, producción)

---

**Archivo creado:** 18 de Octubre, 2025
**Problema:** Campo `activo` faltante en tabla `profiles`
**Solución:** Migración SQL + actualización de código
