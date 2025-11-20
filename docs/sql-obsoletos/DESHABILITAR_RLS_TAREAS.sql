-- ============================================
-- DESHABILITAR RLS EN TABLAS DE TAREAS
-- ============================================

-- Deshabilitar RLS en tabla tareas
ALTER TABLE tareas DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla entregas (si existe)
ALTER TABLE entregas DISABLE ROW LEVEL SECURITY;

-- Deshabilitar RLS en tabla cursos (relacionada con tareas)
ALTER TABLE cursos DISABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT
  tablename,
  rowsecurity as "RLS habilitado",
  CASE
    WHEN rowsecurity = true THEN '❌ Habilitado'
    ELSE '✅ Deshabilitado'
  END as "Estado"
FROM pg_tables
WHERE tablename IN ('tareas', 'entregas', 'cursos')
ORDER BY tablename;
