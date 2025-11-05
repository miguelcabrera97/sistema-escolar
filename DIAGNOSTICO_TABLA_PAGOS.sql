-- ============================================
-- DIAGNÓSTICO COMPLETO: Tabla PAGOS
-- ============================================

-- 1. Ver TODAS las columnas de la tabla pagos
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'pagos'
ORDER BY ordinal_position;

-- 2. Ver restricciones NOT NULL
SELECT
  column_name,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pagos'
  AND is_nullable = 'NO'
ORDER BY column_name;

-- 3. Ver las foreign keys
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'pagos';

-- 4. Ver si hay datos en la tabla
SELECT COUNT(*) as total_registros FROM pagos;

-- 5. Ver un registro de ejemplo (si existe)
SELECT * FROM pagos LIMIT 1;

-- 6. Ver qué tablas relacionadas existen
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('pagos', 'conceptos_pago', 'padre_alumno', 'padres', 'alumnos');
