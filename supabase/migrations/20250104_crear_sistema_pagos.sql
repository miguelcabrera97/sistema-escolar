-- ============================================
-- Sistema de Pagos
-- Fecha: 2025-01-04
-- ============================================

-- Primero, verificar y crear la tabla padres si no existe
CREATE TABLE IF NOT EXISTS padres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  telefono VARCHAR(20),
  direccion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear índice en padres
CREATE INDEX IF NOT EXISTS idx_padres_user_id ON padres(user_id);

-- Tabla de relación padre-alumno si no existe
CREATE TABLE IF NOT EXISTS padre_alumno (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  padre_id UUID REFERENCES padres(id) ON DELETE CASCADE,
  alumno_id UUID REFERENCES alumnos(id) ON DELETE CASCADE,
  parentesco VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(padre_id, alumno_id)
);

-- Crear índices en padre_alumno
CREATE INDEX IF NOT EXISTS idx_padre_alumno_padre ON padre_alumno(padre_id);
CREATE INDEX IF NOT EXISTS idx_padre_alumno_alumno ON padre_alumno(alumno_id);

-- Tabla de conceptos de pago (ej: Colegiatura, Uniforme, Libros)
CREATE TABLE IF NOT EXISTS conceptos_pago (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  monto_default DECIMAL(10, 2),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de pagos creados por el directivo
CREATE TABLE IF NOT EXISTS pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concepto_id UUID REFERENCES conceptos_pago(id) ON DELETE RESTRICT,
  padre_id UUID REFERENCES padres(id) ON DELETE CASCADE,
  alumno_id UUID REFERENCES alumnos(id) ON DELETE CASCADE,

  -- Información del pago
  concepto_nombre VARCHAR(200) NOT NULL, -- Guardamos el nombre por si el concepto se elimina
  descripcion TEXT,
  monto DECIMAL(10, 2) NOT NULL,

  -- Fechas
  fecha_vencimiento DATE NOT NULL,

  -- Estado
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente', -- pendiente, pagado, vencido, cancelado

  -- Información del pago realizado
  metodo_pago VARCHAR(20), -- mercadopago, manual, null si no pagado
  fecha_pago TIMESTAMP WITH TIME ZONE,
  referencia_pago VARCHAR(200), -- ID de Mercado Pago o referencia manual
  comprobante_url TEXT, -- URL del comprobante en caso de pago manual

  -- Auditoría
  creado_por UUID REFERENCES profiles(id),
  pagado_verificado_por UUID REFERENCES profiles(id), -- Directivo que verificó pago manual

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de transacciones de Mercado Pago
CREATE TABLE IF NOT EXISTS transacciones_mercadopago (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pago_id UUID REFERENCES pagos(id) ON DELETE CASCADE,

  -- Información de Mercado Pago
  preference_id VARCHAR(100) UNIQUE,
  payment_id VARCHAR(100) UNIQUE,
  merchant_order_id VARCHAR(100),

  -- Estado de la transacción
  status VARCHAR(50), -- pending, approved, rejected, etc.
  status_detail VARCHAR(100),

  -- Montos
  transaction_amount DECIMAL(10, 2),
  net_amount DECIMAL(10, 2),
  fee_amount DECIMAL(10, 2),

  -- Información del pagador
  payer_email VARCHAR(200),
  payer_identification VARCHAR(50),

  -- Datos completos de la respuesta (JSON)
  payment_data JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_pagos_padre ON pagos(padre_id);
CREATE INDEX IF NOT EXISTS idx_pagos_alumno ON pagos(alumno_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha_vencimiento ON pagos(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_transacciones_pago ON transacciones_mercadopago(pago_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_preference ON transacciones_mercadopago(preference_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_payment ON transacciones_mercadopago(payment_id);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers a las tablas
DROP TRIGGER IF EXISTS update_padres_updated_at ON padres;
CREATE TRIGGER update_padres_updated_at
  BEFORE UPDATE ON padres
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conceptos_pago_updated_at ON conceptos_pago;
CREATE TRIGGER update_conceptos_pago_updated_at
  BEFORE UPDATE ON conceptos_pago
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pagos_updated_at ON pagos;
CREATE TRIGGER update_pagos_updated_at
  BEFORE UPDATE ON pagos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transacciones_updated_at ON transacciones_mercadopago;
CREATE TRIGGER update_transacciones_updated_at
  BEFORE UPDATE ON transacciones_mercadopago
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar estado de pagos vencidos
CREATE OR REPLACE FUNCTION actualizar_pagos_vencidos()
RETURNS void AS $$
BEGIN
  UPDATE pagos
  SET estado = 'vencido'
  WHERE estado = 'pendiente'
    AND fecha_vencimiento < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Insertar conceptos de pago por defecto
INSERT INTO conceptos_pago (nombre, descripcion, monto_default, activo) VALUES
  ('Colegiatura', 'Pago mensual de colegiatura', 1500.00, true),
  ('Inscripción', 'Pago anual de inscripción', 3000.00, true),
  ('Uniforme', 'Compra de uniforme escolar', 800.00, true),
  ('Libros', 'Material didáctico y libros', 1200.00, true),
  ('Actividades Extraescolares', 'Pago de actividades deportivas o culturales', 500.00, true),
  ('Examen', 'Pago de examen o certificación', 300.00, true),
  ('Otro', 'Concepto personalizado', 0.00, true)
ON CONFLICT DO NOTHING;

-- Políticas RLS (Row Level Security)
ALTER TABLE padres ENABLE ROW LEVEL SECURITY;
ALTER TABLE padre_alumno ENABLE ROW LEVEL SECURITY;
ALTER TABLE conceptos_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_mercadopago ENABLE ROW LEVEL SECURITY;

-- Políticas para padres
DROP POLICY IF EXISTS "Padres pueden ver su propio perfil" ON padres;
CREATE POLICY "Padres pueden ver su propio perfil"
  ON padres FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Directivos pueden ver todos los padres" ON padres;
CREATE POLICY "Directivos pueden ver todos los padres"
  ON padres FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- Políticas para padre_alumno
DROP POLICY IF EXISTS "Padres pueden ver sus alumnos" ON padre_alumno;
CREATE POLICY "Padres pueden ver sus alumnos"
  ON padre_alumno FOR SELECT
  USING (
    padre_id IN (
      SELECT id FROM padres WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Directivos pueden ver todas las relaciones" ON padre_alumno;
CREATE POLICY "Directivos pueden ver todas las relaciones"
  ON padre_alumno FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- Política para conceptos_pago
DROP POLICY IF EXISTS "Todos pueden ver conceptos activos" ON conceptos_pago;
CREATE POLICY "Todos pueden ver conceptos activos"
  ON conceptos_pago FOR SELECT
  USING (activo = true);

DROP POLICY IF EXISTS "Solo directivos pueden gestionar conceptos" ON conceptos_pago;
CREATE POLICY "Solo directivos pueden gestionar conceptos"
  ON conceptos_pago FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- Política para pagos - Directivos
DROP POLICY IF EXISTS "Directivos pueden ver todos los pagos" ON pagos;
CREATE POLICY "Directivos pueden ver todos los pagos"
  ON pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

DROP POLICY IF EXISTS "Directivos pueden crear pagos" ON pagos;
CREATE POLICY "Directivos pueden crear pagos"
  ON pagos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

DROP POLICY IF EXISTS "Directivos pueden actualizar pagos" ON pagos;
CREATE POLICY "Directivos pueden actualizar pagos"
  ON pagos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- Política para pagos - Padres
DROP POLICY IF EXISTS "Padres pueden ver sus pagos" ON pagos;
CREATE POLICY "Padres pueden ver sus pagos"
  ON pagos FOR SELECT
  USING (
    padre_id IN (
      SELECT id FROM padres WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Padres pueden actualizar sus pagos" ON pagos;
CREATE POLICY "Padres pueden actualizar sus pagos"
  ON pagos FOR UPDATE
  USING (
    padre_id IN (
      SELECT id FROM padres WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    padre_id IN (
      SELECT id FROM padres WHERE user_id = auth.uid()
    )
  );

-- Política para transacciones
DROP POLICY IF EXISTS "Directivos pueden ver todas las transacciones" ON transacciones_mercadopago;
CREATE POLICY "Directivos pueden ver todas las transacciones"
  ON transacciones_mercadopago FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

DROP POLICY IF EXISTS "Padres pueden ver sus transacciones" ON transacciones_mercadopago;
CREATE POLICY "Padres pueden ver sus transacciones"
  ON transacciones_mercadopago FOR SELECT
  USING (
    pago_id IN (
      SELECT id FROM pagos
      WHERE padre_id IN (
        SELECT id FROM padres WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Sistema puede crear transacciones" ON transacciones_mercadopago;
CREATE POLICY "Sistema puede crear transacciones"
  ON transacciones_mercadopago FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Sistema puede actualizar transacciones" ON transacciones_mercadopago;
CREATE POLICY "Sistema puede actualizar transacciones"
  ON transacciones_mercadopago FOR UPDATE
  USING (true);

-- Comentarios en las tablas
COMMENT ON TABLE padres IS 'Información de los padres de familia';
COMMENT ON TABLE padre_alumno IS 'Relación entre padres y alumnos';
COMMENT ON TABLE conceptos_pago IS 'Catálogo de conceptos de pago disponibles';
COMMENT ON TABLE pagos IS 'Registro de todos los pagos creados y su estado';
COMMENT ON TABLE transacciones_mercadopago IS 'Registro de transacciones de Mercado Pago';
