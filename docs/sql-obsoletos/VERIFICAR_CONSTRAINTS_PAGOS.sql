-- ============================================
-- VERIFICAR CONSTRAINTS Y FOREIGN KEYS EN PAGOS
-- ============================================

-- 1. Ver todas las foreign keys de la tabla pagos
SELECT
  tc.constraint_name as "Constraint",
  tc.table_name as "Tabla",
  kcu.column_name as "Columna",
  ccu.table_name AS "Tabla referenciada",
  ccu.column_name AS "Columna referenciada",
  rc.delete_rule as "ON DELETE",
  rc.update_rule as "ON UPDATE"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'pagos'
ORDER BY kcu.column_name;

-- 2. Ver todos los constraints (CHECK, NOT NULL, etc)
SELECT
  conname as "Constraint",
  contype as "Tipo",
  CASE contype
    WHEN 'c' THEN 'CHECK constraint'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 't' THEN 'TRIGGER'
    WHEN 'x' THEN 'EXCLUSION'
  END as "Descripción",
  pg_get_constraintdef(oid) as "Definición"
FROM pg_constraint
WHERE conrelid = 'pagos'::regclass
ORDER BY contype;

-- 3. Ver las columnas NOT NULL
SELECT
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'pagos'
  AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 4. Verificar si las tablas referenciadas tienen RLS habilitado
SELECT
  tablename,
  rowsecurity as "RLS habilitado"
FROM pg_tables
WHERE tablename IN ('padres', 'alumnos', 'profiles', 'conceptos_pago')
ORDER BY tablename;
