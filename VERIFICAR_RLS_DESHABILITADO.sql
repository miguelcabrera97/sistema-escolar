-- ============================================
-- VERIFICAR QUE RLS ESTÁ REALMENTE DESHABILITADO
-- ============================================

-- Ver el estado de RLS en la tabla pagos
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS habilitado",
  CASE
    WHEN rowsecurity = true THEN '❌ RLS ESTÁ HABILITADO - Necesitas deshabilitarlo'
    ELSE '✅ RLS ESTÁ DESHABILITADO - El problema es otro'
  END as "Estado"
FROM pg_tables
WHERE tablename = 'pagos';

-- Ver todas las políticas (deberían seguir existiendo pero no aplicarse)
SELECT
  COUNT(*) as "Número de políticas",
  CASE
    WHEN COUNT(*) > 0 THEN 'Las políticas existen pero NO deberían aplicarse si RLS está deshabilitado'
    ELSE 'No hay políticas'
  END as "Info"
FROM pg_policies
WHERE tablename = 'pagos';

-- Ver las políticas específicas
SELECT
  policyname,
  cmd as "Acción"
FROM pg_policies
WHERE tablename = 'pagos'
ORDER BY cmd;
