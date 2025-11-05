-- ============================================
-- VERIFICAR POLÍTICAS DE STORAGE
-- ============================================

-- Ver las políticas del storage bucket 'tareas'
SELECT
  name as "Bucket",
  public as "Público",
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'tareas';

-- Ver las políticas RLS del storage
SELECT
  policyname as "Política",
  cmd as "Acción",
  qual as "Condición"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%tareas%'
ORDER BY policyname;

-- Ver TODAS las políticas de storage.objects
SELECT
  policyname as "Política",
  cmd as "Acción"
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY cmd, policyname;
