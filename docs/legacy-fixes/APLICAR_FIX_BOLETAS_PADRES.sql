-- ============================================
-- SCRIPT ACTUALIZADO PARA CORREGIR ACCESO DE PADRES A BOLETAS
-- Ejecutar en el SQL Editor de Supabase
-- ============================================

-- PASO 1: Verificar políticas actuales
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'boletas';

-- PASO 2: ELIMINAR todas las políticas antiguas
DROP POLICY IF EXISTS "Los padres pueden ver boletas de sus hijos" ON boletas;
DROP POLICY IF EXISTS "Padres pueden ver boletas de sus hijos" ON boletas;
DROP POLICY IF EXISTS "padres_read_boletas" ON boletas;
DROP POLICY IF EXISTS "Directivos tienen acceso completo a boletas" ON boletas;
DROP POLICY IF EXISTS "Alumnos pueden ver sus propias boletas" ON boletas;

-- PASO 3: CREAR política para PADRES (ver boletas de sus hijos)
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

-- PASO 4: CREAR política para DIRECTIVOS (acceso completo)
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

-- PASO 5: CREAR política para ALUMNOS (ver sus propias boletas)
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

-- ============================================
-- VERIFICACIONES
-- ============================================

-- VERIFICAR: Las políticas se crearon correctamente
SELECT
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'boletas'
ORDER BY policyname;

-- VERIFICAR: Relaciones padre-alumno existen
SELECT
  prof.email as padre_email,
  prof.nombre as padre_nombre,
  prof.apellidos as padre_apellidos,
  prof_alumno.nombre as alumno_nombre,
  prof_alumno.apellidos as alumno_apellidos,
  a.matricula as alumno_matricula,
  pa.padre_id,
  pa.alumno_id
FROM padres p
INNER JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN padre_alumno pa ON p.id = pa.padre_id
LEFT JOIN alumnos a ON pa.alumno_id = a.id
LEFT JOIN profiles prof_alumno ON a.user_id = prof_alumno.id
WHERE prof.role = 'padre'
ORDER BY padre_nombre, alumno_nombre;

-- VERIFICAR: Boletas existentes
SELECT
  b.id,
  b.periodo,
  b.ciclo_escolar,
  b.fecha_subida,
  a.matricula,
  prof.nombre as alumno_nombre,
  prof.apellidos as alumno_apellidos,
  b.archivo_url,
  -- Verificar si hay padres asociados
  (SELECT COUNT(*) FROM padre_alumno pa WHERE pa.alumno_id = b.alumno_id) as num_padres
FROM boletas b
INNER JOIN alumnos a ON b.alumno_id = a.id
INNER JOIN profiles prof ON a.user_id = prof.id
ORDER BY b.fecha_subida DESC;

-- VERIFICAR: Padres sin hijos asignados
SELECT
  prof.email as padre_email,
  prof.nombre,
  prof.apellidos,
  p.id as padre_id,
  COUNT(pa.alumno_id) as num_hijos
FROM padres p
INNER JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN padre_alumno pa ON p.id = pa.padre_id
WHERE prof.role = 'padre'
GROUP BY prof.email, prof.nombre, prof.apellidos, p.id
HAVING COUNT(pa.alumno_id) = 0;

-- ============================================
-- INFORMACIÓN DEL BUCKET DE STORAGE
-- ============================================

-- IMPORTANTE: No se puede verificar el bucket desde SQL
-- Debes ir al Dashboard de Supabase:
-- 1. Ve a Storage > boletas
-- 2. Haz clic en Settings (⚙️)
-- 3. Marca "Public bucket"
-- 4. Guarda los cambios

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

/*
Después de ejecutar este script, deberías ver:

1. Tres políticas creadas correctamente:
   - "Padres pueden ver boletas de sus hijos" (SELECT)
   - "Directivos tienen acceso completo a boletas" (ALL)
   - "Alumnos pueden ver sus propias boletas" (SELECT)

2. Lista de padres con sus hijos asignados
   - Si algún padre aparece sin hijos, debes asignarlos desde
     Directivo > Usuarios > Editar Alumno

3. Lista de boletas existentes
   - Si no hay boletas, el directivo debe subirlas desde
     Directivo > Boletas > Subir Nueva Boleta

4. Bucket 'boletas' debe estar marcado como PÚBLICO
   - Esto se hace manualmente en el Dashboard de Supabase
*/
