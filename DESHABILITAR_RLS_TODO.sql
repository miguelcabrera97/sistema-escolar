-- ============================================
-- DESHABILITAR RLS EN TODAS LAS TABLAS RELACIONADAS
-- ============================================
-- ADVERTENCIA: Esto es solo para desarrollo/pruebas

-- Deshabilitar RLS en tabla pagos
ALTER TABLE pagos DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tablas relacionadas con foreign keys
ALTER TABLE padres DISABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos DISABLE ROW LEVEL SECURITY;
ALTER TABLE padre_alumno DISABLE ROW LEVEL SECURITY;

-- Si existe tabla conceptos_pago
ALTER TABLE conceptos_pago DISABLE ROW LEVEL SECURITY;

-- Si existe tabla profiles (puede causar problemas si tiene RLS)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver el estado de RLS en todas las tablas importantes
SELECT
  tablename,
  rowsecurity as "RLS habilitado",
  CASE
    WHEN rowsecurity = true THEN '❌ Habilitado'
    ELSE '✅ Deshabilitado'
  END as "Estado"
FROM pg_tables
WHERE tablename IN ('pagos', 'padres', 'alumnos', 'padre_alumno', 'profiles', 'conceptos_pago')
ORDER BY tablename;
