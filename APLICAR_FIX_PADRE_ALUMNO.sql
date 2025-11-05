-- ============================================
-- SCRIPT RÁPIDO: Fix completo para padre_alumno
-- ============================================
-- Este script debe ejecutarse en Supabase SQL Editor
-- ============================================

-- 1. Agregar políticas RLS faltantes para INSERT, UPDATE, DELETE
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

-- 2. Verificar que todo esté bien
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'padre_alumno'
ORDER BY cmd;

-- Resultado esperado: Deberías ver políticas para SELECT, INSERT, UPDATE y DELETE
