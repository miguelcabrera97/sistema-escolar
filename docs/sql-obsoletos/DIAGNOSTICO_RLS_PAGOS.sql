-- ============================================
-- DIAGNÓSTICO COMPLETO: RLS EN TABLA PAGOS
-- ============================================

-- 1. Verificar si RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS habilitado"
FROM pg_tables
WHERE tablename = 'pagos';

-- 2. Ver todas las políticas actuales
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as "comando",
  qual as "condición_USING",
  with_check as "condición_WITH_CHECK"
FROM pg_policies
WHERE tablename = 'pagos'
ORDER BY policyname;

-- 3. Ver el usuario actual y su rol
SELECT
  auth.uid() as "user_id",
  p.role,
  p.nombre,
  p.apellidos,
  p.email
FROM profiles p
WHERE p.id = auth.uid();

-- 4. Verificar si el usuario actual es directivo
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    ) THEN '✅ SÍ es directivo'
    ELSE '❌ NO es directivo'
  END as "¿Es directivo?";

-- 5. Ver la estructura de la tabla pagos
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'pagos'
ORDER BY ordinal_position;
