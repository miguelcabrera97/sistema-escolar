-- ============================================
-- VERIFICAR ESTRUCTURA DE LA TABLA PAGOS
-- ============================================

-- Ver todas las columnas de la tabla pagos
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pagos'
ORDER BY ordinal_position;

-- Ver los primeros registros de pagos para entender la estructura
SELECT *
FROM pagos
LIMIT 3;

-- Ver qué columnas relacionadas con "concepto" existen
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'pagos'
  AND column_name ILIKE '%concepto%';
