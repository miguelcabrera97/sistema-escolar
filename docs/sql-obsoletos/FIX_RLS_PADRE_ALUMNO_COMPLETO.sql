-- ============================================
-- FIX COMPLETO: Políticas RLS para padre_alumno
-- ============================================
-- Este script asegura que los padres puedan ver sus alumnos
-- y que los directivos puedan gestionar todas las relaciones
-- ============================================

-- PASO 1: Verificar políticas actuales
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'padre_alumno'
ORDER BY cmd, policyname;

-- PASO 2: Eliminar todas las políticas existentes
-- ============================================
DROP POLICY IF EXISTS "Padres pueden ver sus alumnos" ON padre_alumno;
DROP POLICY IF EXISTS "Directivos pueden ver todas las relaciones" ON padre_alumno;
DROP POLICY IF EXISTS "Directivos pueden crear relaciones padre-alumno" ON padre_alumno;
DROP POLICY IF EXISTS "Directivos pueden actualizar relaciones padre-alumno" ON padre_alumno;
DROP POLICY IF EXISTS "Directivos pueden eliminar relaciones padre-alumno" ON padre_alumno;

-- PASO 3: Crear políticas correctas
-- ============================================

-- SELECT: Los padres pueden ver sus propios alumnos
CREATE POLICY "Padres pueden ver sus alumnos"
  ON padre_alumno FOR SELECT
  USING (
    padre_id IN (
      SELECT id FROM padres WHERE user_id = auth.uid()
    )
  );

-- SELECT: Los directivos pueden ver todas las relaciones
CREATE POLICY "Directivos pueden ver todas las relaciones"
  ON padre_alumno FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- INSERT: Solo directivos pueden crear relaciones
CREATE POLICY "Directivos pueden crear relaciones padre-alumno"
  ON padre_alumno FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- UPDATE: Solo directivos pueden actualizar relaciones
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

-- DELETE: Solo directivos pueden eliminar relaciones
CREATE POLICY "Directivos pueden eliminar relaciones padre-alumno"
  ON padre_alumno FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- PASO 4: Verificar que RLS esté habilitado
-- ============================================
ALTER TABLE padre_alumno ENABLE ROW LEVEL SECURITY;

-- PASO 5: Verificar las políticas creadas
-- ============================================
SELECT
  policyname,
  cmd,
  CASE
    WHEN cmd = 'SELECT' AND policyname ILIKE '%padre%' THEN '✓ Padres pueden ver sus alumnos'
    WHEN cmd = 'SELECT' AND policyname ILIKE '%directivo%' THEN '✓ Directivos pueden ver todo'
    WHEN cmd = 'INSERT' THEN '✓ Directivos pueden crear'
    WHEN cmd = 'UPDATE' THEN '✓ Directivos pueden actualizar'
    WHEN cmd = 'DELETE' THEN '✓ Directivos pueden eliminar'
  END as descripcion
FROM pg_policies
WHERE tablename = 'padre_alumno'
ORDER BY cmd, policyname;

-- RESULTADO ESPERADO: 5 políticas
-- ✓ 2 políticas SELECT (padres y directivos)
-- ✓ 1 política INSERT (directivos)
-- ✓ 1 política UPDATE (directivos)
-- ✓ 1 política DELETE (directivos)

-- PASO 6: Probar la consulta como si fueras el padre
-- ============================================
-- Esta consulta simula lo que el frontend hace
-- Reemplaza 'EMAIL_DEL_PADRE' con el email real

/*
-- Primero obtén el user_id del padre
SELECT id, email FROM profiles WHERE email = 'jorge.perez@padre.com';

-- Luego prueba la consulta con ese user_id
-- (Supabase hace esto automáticamente con auth.uid())
SELECT
  pa.padre_id,
  pa.alumno_id,
  pa.parentesco
FROM padre_alumno pa
WHERE pa.padre_id IN (
  SELECT id FROM padres WHERE user_id = 'USER_ID_AQUI'
);
*/

-- PASO 7: Verificar políticas RLS en otras tablas relacionadas
-- ============================================

-- Verificar políticas en tabla PADRES
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'padres'
ORDER BY cmd;

-- Verificar políticas en tabla ALUMNOS
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'alumnos'
ORDER BY cmd;

-- Verificar políticas en tabla PAGOS
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'pagos'
ORDER BY cmd;

-- Si falta alguna política para PADRES, agrégala:
-- ALTER TABLE padres ENABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Padres pueden ver su propio perfil" ON padres;
-- CREATE POLICY "Padres pueden ver su propio perfil"
--   ON padres FOR SELECT
--   USING (user_id = auth.uid());
--
-- DROP POLICY IF EXISTS "Directivos pueden ver todos los padres" ON padres;
-- CREATE POLICY "Directivos pueden ver todos los padres"
--   ON padres FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE id = auth.uid() AND role = 'directivo'
--     )
--   );

-- PASO 8: Políticas para ALUMNOS (si son necesarias)
-- ============================================
-- ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Padres pueden ver a sus hijos" ON alumnos;
-- CREATE POLICY "Padres pueden ver a sus hijos"
--   ON alumnos FOR SELECT
--   USING (
--     id IN (
--       SELECT alumno_id FROM padre_alumno
--       WHERE padre_id IN (
--         SELECT id FROM padres WHERE user_id = auth.uid()
--       )
--     )
--   );
--
-- DROP POLICY IF EXISTS "Directivos pueden ver todos los alumnos" ON alumnos;
-- CREATE POLICY "Directivos pueden ver todos los alumnos"
--   ON alumnos FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE id = auth.uid() AND role = 'directivo'
--     )
--   );

-- PASO 9: Verificación final
-- ============================================
SELECT
  'padre_alumno' as tabla,
  COUNT(*) as total_politicas
FROM pg_policies
WHERE tablename = 'padre_alumno'
UNION ALL
SELECT
  'padres' as tabla,
  COUNT(*) as total_politicas
FROM pg_policies
WHERE tablename = 'padres'
UNION ALL
SELECT
  'alumnos' as tabla,
  COUNT(*) as total_politicas
FROM pg_policies
WHERE tablename = 'alumnos'
UNION ALL
SELECT
  'pagos' as tabla,
  COUNT(*) as total_politicas
FROM pg_policies
WHERE tablename = 'pagos';

-- RESULTADO ESPERADO:
-- padre_alumno: 5 políticas
-- padres: 2-3 políticas (mínimo SELECT para padres y directivos)
-- alumnos: 2+ políticas (SELECT para padres y directivos)
-- pagos: 4+ políticas (SELECT/UPDATE para padres y directivos)
