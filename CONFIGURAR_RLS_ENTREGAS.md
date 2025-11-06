# Configurar RLS para Entregas de Tareas

El error "new row violates row-level security policy" significa que las políticas de seguridad están bloqueando la inserción de entregas por parte de los alumnos.

## Solución

Ejecuta el siguiente SQL en **SQL Editor** de Supabase:

```sql
-- Habilitar RLS en la tabla entregas (si no está habilitado)
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes que puedan estar causando conflictos (opcional)
DROP POLICY IF EXISTS "Alumnos pueden insertar sus entregas" ON entregas;
DROP POLICY IF EXISTS "Alumnos pueden ver sus entregas" ON entregas;
DROP POLICY IF EXISTS "Alumnos pueden actualizar sus entregas" ON entregas;
DROP POLICY IF EXISTS "Maestros pueden ver entregas de sus cursos" ON entregas;
DROP POLICY IF EXISTS "Maestros pueden actualizar entregas de sus cursos" ON entregas;

-- 1. Permitir que alumnos inserten (creen) sus propias entregas
CREATE POLICY "Alumnos pueden insertar sus entregas"
ON entregas FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM alumnos
    WHERE alumnos.user_id = auth.uid()
    AND alumnos.id = entregas.alumno_id
  )
);

-- 2. Permitir que alumnos vean sus propias entregas
CREATE POLICY "Alumnos pueden ver sus entregas"
ON entregas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM alumnos
    WHERE alumnos.user_id = auth.uid()
    AND alumnos.id = entregas.alumno_id
  )
  OR
  -- Maestros pueden ver entregas de sus cursos
  EXISTS (
    SELECT 1 FROM tareas
    INNER JOIN cursos ON tareas.curso_id = cursos.id
    WHERE tareas.id = entregas.tarea_id
    AND cursos.maestro_id = auth.uid()
  )
  OR
  -- Directivos pueden ver todas las entregas
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
);

-- 3. Permitir que alumnos actualicen sus entregas (solo si están pendientes)
CREATE POLICY "Alumnos pueden actualizar sus entregas pendientes"
ON entregas FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM alumnos
    WHERE alumnos.user_id = auth.uid()
    AND alumnos.id = entregas.alumno_id
  )
  AND entregas.status = 'pendiente'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM alumnos
    WHERE alumnos.user_id = auth.uid()
    AND alumnos.id = entregas.alumno_id
  )
);

-- 4. Permitir que maestros actualicen entregas de sus cursos (para calificar)
CREATE POLICY "Maestros pueden actualizar entregas de sus cursos"
ON entregas FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tareas
    INNER JOIN cursos ON tareas.curso_id = cursos.id
    WHERE tareas.id = entregas.tarea_id
    AND cursos.maestro_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM tareas
    INNER JOIN cursos ON tareas.curso_id = cursos.id
    WHERE tareas.id = entregas.tarea_id
    AND cursos.maestro_id = auth.uid()
  )
);

-- 5. Permitir que alumnos eliminen sus entregas (solo si están pendientes)
CREATE POLICY "Alumnos pueden eliminar sus entregas pendientes"
ON entregas FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM alumnos
    WHERE alumnos.user_id = auth.uid()
    AND alumnos.id = entregas.alumno_id
  )
  AND entregas.status = 'pendiente'
);
```

## Políticas para el Storage de Entregas

Si los alumnos también necesitan subir archivos, ejecuta este SQL adicional:

```sql
-- Permitir que alumnos suban archivos de entregas
CREATE POLICY "Alumnos pueden subir archivos de entregas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tareas' AND
  (storage.foldername(name))[1] = 'entregas' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'alumno'
  )
);

-- Permitir que alumnos lean archivos de entregas
CREATE POLICY "Usuarios autenticados pueden leer archivos de entregas"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tareas' AND
  (storage.foldername(name))[1] = 'entregas'
);

-- Permitir que alumnos eliminen sus propios archivos de entregas
CREATE POLICY "Alumnos pueden eliminar sus archivos de entregas"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tareas' AND
  (storage.foldername(name))[1] = 'entregas' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'alumno'
  )
);
```

## Verificar que funciona

Después de ejecutar el SQL:

1. Como alumno, intenta entregar una tarea nuevamente
2. Verifica que no aparezca el error "violates row-level security policy"
3. La entrega debería crearse exitosamente

## Solución de Problemas

### Error persiste después de ejecutar el SQL

1. **Verifica que el usuario tiene rol de alumno:**
   ```sql
   SELECT id, email, role FROM profiles WHERE id = auth.uid();
   ```

2. **Verifica que existe el registro en la tabla alumnos:**
   ```sql
   SELECT * FROM alumnos WHERE user_id = auth.uid();
   ```

3. **Verifica las políticas activas:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename = 'entregas';
   ```

### El alumno no puede ver sus entregas

Asegúrate de que existe el registro en la tabla `alumnos` con el `user_id` correcto.

### El maestro no puede calificar

Verifica que el maestro sea el propietario del curso al que pertenece la tarea.
