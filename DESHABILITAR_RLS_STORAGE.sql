-- ============================================
-- DESHABILITAR RLS EN STORAGE
-- ============================================

-- Deshabilitar RLS en la tabla storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en storage.buckets
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que RLS está deshabilitado en storage
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS habilitado",
  CASE
    WHEN rowsecurity = true THEN '❌ Habilitado'
    ELSE '✅ Deshabilitado'
  END as "Estado"
FROM pg_tables
WHERE schemaname = 'storage'
  AND tablename IN ('objects', 'buckets')
ORDER BY tablename;

-- Ver si el bucket 'tareas' existe
SELECT
  name as "Bucket",
  public as "Es público",
  CASE
    WHEN public = true THEN '✅ Público - No necesita políticas'
    ELSE '⚠️ Privado - Puede necesitar políticas'
  END as "Configuración"
FROM storage.buckets
WHERE name = 'tareas';
