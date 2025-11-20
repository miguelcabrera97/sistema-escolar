-- ============================================
-- DESHABILITAR RLS EN TODAS LAS TABLAS
-- ============================================
-- ADVERTENCIA: Solo para desarrollo/pruebas
-- En producción debes configurar políticas RLS correctamente

-- Script dinámico que deshabilita RLS en todas las tablas del schema public
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
    RAISE NOTICE 'RLS deshabilitado en: %', tabla.tablename;
  END LOOP;
END $$;

-- ============================================
-- VERIFICACIÓN COMPLETA
-- ============================================

-- Ver el estado de RLS en todas las tablas
SELECT
  tablename as "Tabla",
  rowsecurity as "RLS",
  CASE
    WHEN rowsecurity = true THEN '❌ Habilitado (mal)'
    ELSE '✅ Deshabilitado (ok para dev)'
  END as "Estado"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- Contar cuántas tablas tienen RLS habilitado
SELECT
  COUNT(*) FILTER (WHERE rowsecurity = true) as "Tablas con RLS habilitado",
  COUNT(*) FILTER (WHERE rowsecurity = false) as "Tablas con RLS deshabilitado",
  COUNT(*) as "Total de tablas"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================
-- Todas las tablas deberían mostrar "✅ Deshabilitado"
-- Si ves alguna con "❌ Habilitado", ejecuta el script de nuevo
