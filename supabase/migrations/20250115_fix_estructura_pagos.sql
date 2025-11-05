-- ============================================
-- FIX: Asegurar estructura correcta de tabla pagos
-- ============================================

-- Agregar columna concepto_id si no existe
ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS concepto_id UUID REFERENCES conceptos_pago(id) ON DELETE RESTRICT;

-- Asegurar que todas las columnas necesarias existen
ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS padre_id UUID REFERENCES padres(id) ON DELETE CASCADE;

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS alumno_id UUID REFERENCES alumnos(id) ON DELETE CASCADE;

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS concepto_nombre VARCHAR(200);

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS descripcion TEXT;

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS monto DECIMAL(10, 2);

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente';

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(20);

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS fecha_pago TIMESTAMP WITH TIME ZONE;

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS referencia_pago VARCHAR(200);

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS comprobante_url TEXT;

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES profiles(id);

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS pagado_verificado_por UUID REFERENCES profiles(id);

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();

ALTER TABLE pagos
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_pagos_concepto ON pagos(concepto_id);
CREATE INDEX IF NOT EXISTS idx_pagos_padre ON pagos(padre_id);
CREATE INDEX IF NOT EXISTS idx_pagos_alumno ON pagos(alumno_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_vencimiento ON pagos(fecha_vencimiento);

-- Verificar resultado
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pagos'
ORDER BY ordinal_position;
