-- ============================================
-- SOLUCIÓN TEMPORAL: Deshabilitar RLS en tabla pagos
-- ============================================
-- ADVERTENCIA: Esto deshabilita la seguridad de RLS temporalmente
-- Solo usa esto para desarrollo/pruebas

-- Opción 1: Deshabilitar RLS completamente (MÁS RÁPIDO PARA PROBAR)
ALTER TABLE pagos DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó
SELECT
  tablename,
  rowsecurity as "RLS habilitado (debe ser false)"
FROM pg_tables
WHERE tablename = 'pagos';

-- ============================================
-- NOTA: Una vez que confirmes que funciona sin RLS,
-- podemos volver a habilitarlo con las políticas correctas
-- ============================================
