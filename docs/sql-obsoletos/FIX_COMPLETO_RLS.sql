-- ============================================
-- FIX COMPLETO: DESHABILITAR RLS EN TODO
-- ============================================
-- Este script deshabilita RLS en:
-- 1. Todas las tablas del schema public
-- 2. Tablas de storage (objects, buckets)
-- 3. Elimina todas las políticas existentes
-- ============================================

-- PASO 1: Deshabilitar RLS en storage
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las políticas de storage.objects
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    RAISE NOTICE 'Política eliminada de storage.objects: %', pol.policyname;
  END LOOP;
END $$;

-- PASO 3: Deshabilitar RLS en todas las tablas del schema public
DO $$
DECLARE
  tabla RECORD;
BEGIN
  FOR tabla IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tabla.tablename);
    RAISE NOTICE 'RLS deshabilitado en tabla: %', tabla.tablename;
  END LOOP;
END $$;

-- PASO 4: Eliminar TODAS las políticas de todas las tablas public
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname, pol.schemaname, pol.tablename);
    RAISE NOTICE 'Política eliminada: % de %', pol.policyname, pol.tablename;
  END LOOP;
END $$;

-- ============================================
-- VERIFICACIÓN COMPLETA
-- ============================================

-- 1. Estado de RLS en tablas public
SELECT
  '📊 TABLAS PUBLIC' as "Sección",
  tablename as "Tabla",
  CASE
    WHEN rowsecurity = true THEN '❌ Habilitado'
    ELSE '✅ Deshabilitado'
  END as "RLS"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- 2. Estado de RLS en storage
SELECT
  '🗄️ STORAGE' as "Sección",
  tablename as "Tabla",
  CASE
    WHEN rowsecurity = true THEN '❌ Habilitado'
    ELSE '✅ Deshabilitado'
  END as "RLS"
FROM pg_tables
WHERE schemaname = 'storage'
  AND tablename IN ('objects', 'buckets');

-- 3. Contar políticas restantes (debería ser 0)
SELECT
  '📋 POLÍTICAS' as "Sección",
  schemaname,
  COUNT(*) as "Políticas restantes"
FROM pg_policies
WHERE schemaname IN ('public', 'storage')
GROUP BY schemaname
UNION ALL
SELECT
  '📋 POLÍTICAS' as "Sección",
  'TOTAL',
  COUNT(*)
FROM pg_policies
WHERE schemaname IN ('public', 'storage');

-- 4. Ver buckets de storage
SELECT
  '🪣 BUCKETS' as "Sección",
  name as "Nombre",
  public as "Público"
FROM storage.buckets
ORDER BY name;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- ✅ Todas las tablas con RLS deshabilitado
-- ✅ 0 políticas restantes en public y storage
-- ============================================
