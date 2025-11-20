-- ============================================
-- VERIFICAR Y CORREGIR ESTRUCTURA DE PAGOS
-- ============================================

-- 1. Ver la estructura actual de la tabla pagos
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'pagos'
ORDER BY ordinal_position;

-- 2. Ver si existe la columna concepto_id
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'pagos'
  AND column_name = 'concepto_id';

-- 3. Si NO existe concepto_id, agrégala:
/*
ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS concepto_id UUID REFERENCES conceptos_pago(id) ON DELETE RESTRICT;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_pagos_concepto ON pagos(concepto_id);
*/

-- 4. Ver qué columnas relacionadas con "concepto" existen
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pagos'
  AND column_name ILIKE '%concepto%';

-- 5. Ver los primeros registros de pagos (si existen)
SELECT * FROM pagos LIMIT 3;

-- 6. Ver la tabla conceptos_pago (si existe)
SELECT * FROM conceptos_pago LIMIT 5;
