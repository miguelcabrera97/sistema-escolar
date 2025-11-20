-- Migración: Sistema de Boletas en PDF
-- Fecha: 2025-11-04
-- Descripción: Tabla para almacenar boletas de calificaciones en PDF subidas por el directivo

-- ============================================
-- IMPORTANTE: EJECUTAR ESTOS PASOS EN ORDEN
-- ============================================

-- PASO 1: Crear bucket manualmente en Supabase Dashboard
-- Dashboard → Storage → Create a new bucket
-- Name: boletas
-- Public: NO (private)

-- PASO 2: Configurar políticas de storage manualmente en Dashboard
-- Dashboard → Storage → boletas → Policies
-- O ejecutar estos INSERT en SQL Editor:

-- Política: Permitir SELECT a usuarios autenticados (controlado por RLS en tabla)
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Usuarios autenticados pueden ver boletas',
  'boletas',
  'SELECT',
  '(auth.role() = ''authenticated'')'::jsonb
);

-- Política: Permitir INSERT solo a directivos
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Solo directivos pueden subir boletas',
  'boletas',
  'INSERT',
  '(auth.uid() IN (SELECT user_id FROM profiles WHERE role = ''directivo''))'::jsonb
);

-- Política: Permitir UPDATE solo a directivos
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Solo directivos pueden actualizar boletas',
  'boletas',
  'UPDATE',
  '(auth.uid() IN (SELECT user_id FROM profiles WHERE role = ''directivo''))'::jsonb
);

-- Política: Permitir DELETE solo a directivos
INSERT INTO storage.policies (name, bucket_id, operation, definition)
VALUES (
  'Solo directivos pueden eliminar boletas',
  'boletas',
  'DELETE',
  '(auth.uid() IN (SELECT user_id FROM profiles WHERE role = ''directivo''))'::jsonb
);

-- ============================================
-- PASO 3: Crear tabla de boletas
-- ============================================

CREATE TABLE IF NOT EXISTS boletas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  periodo VARCHAR(50) NOT NULL, -- Ej: "2024-1", "2024-2", "Enero-Junio 2024"
  ciclo_escolar VARCHAR(50), -- Ej: "2024-2025"
  archivo_url TEXT NOT NULL, -- URL del archivo en Supabase Storage
  archivo_nombre TEXT NOT NULL, -- Nombre original del archivo
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subido_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notas TEXT, -- Notas adicionales del directivo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un alumno solo puede tener una boleta por periodo
  UNIQUE(alumno_id, periodo, ciclo_escolar)
);

-- ============================================
-- PASO 4: Índices para mejorar performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_boletas_alumno_id ON boletas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_boletas_periodo ON boletas(periodo);
CREATE INDEX IF NOT EXISTS idx_boletas_ciclo ON boletas(ciclo_escolar);
CREATE INDEX IF NOT EXISTS idx_boletas_fecha ON boletas(fecha_subida DESC);

-- ============================================
-- PASO 5: Trigger para actualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_boletas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_boletas_timestamp
  BEFORE UPDATE ON boletas
  FOR EACH ROW
  EXECUTE FUNCTION update_boletas_updated_at();

-- ============================================
-- PASO 6: Comentarios para documentación
-- ============================================

COMMENT ON TABLE boletas IS 'Almacena las boletas de calificaciones en PDF subidas por el directivo para cada alumno y periodo';
COMMENT ON COLUMN boletas.alumno_id IS 'ID del alumno al que pertenece la boleta';
COMMENT ON COLUMN boletas.periodo IS 'Periodo académico (ej: 2024-1, Enero-Junio)';
COMMENT ON COLUMN boletas.ciclo_escolar IS 'Ciclo escolar completo (ej: 2024-2025)';
COMMENT ON COLUMN boletas.archivo_url IS 'URL del PDF en Supabase Storage';
COMMENT ON COLUMN boletas.subido_por IS 'ID del usuario (directivo) que subió la boleta';

-- ============================================
-- PASO 7: Row Level Security (RLS)
-- ============================================

ALTER TABLE boletas ENABLE ROW LEVEL SECURITY;

-- Política: Directivos pueden ver todas las boletas
CREATE POLICY "Directivos pueden ver todas las boletas"
ON boletas FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'directivo'
  )
);

-- Política: Directivos pueden insertar boletas
CREATE POLICY "Directivos pueden crear boletas"
ON boletas FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'directivo'
  )
);

-- Política: Directivos pueden actualizar boletas
CREATE POLICY "Directivos pueden actualizar boletas"
ON boletas FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'directivo'
  )
);

-- Política: Directivos pueden eliminar boletas
CREATE POLICY "Directivos pueden eliminar boletas"
ON boletas FOR DELETE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE role = 'directivo'
  )
);

-- Política: Alumnos pueden ver sus propias boletas
CREATE POLICY "Alumnos pueden ver sus boletas"
ON boletas FOR SELECT
TO authenticated
USING (
  alumno_id IN (
    SELECT id FROM alumnos WHERE user_id = auth.uid()
  )
);

-- Política: Padres pueden ver boletas de sus hijos
CREATE POLICY "Padres pueden ver boletas de sus hijos"
ON boletas FOR SELECT
TO authenticated
USING (
  alumno_id IN (
    SELECT a.id
    FROM alumnos a
    WHERE a.padre_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid() AND role = 'padre'
    )
  )
);

-- ============================================
-- PASO 8: Función auxiliar para obtener boletas
-- ============================================

CREATE OR REPLACE FUNCTION get_boletas_alumno(p_alumno_id UUID)
RETURNS TABLE (
  id UUID,
  periodo VARCHAR,
  ciclo_escolar VARCHAR,
  archivo_url TEXT,
  archivo_nombre TEXT,
  fecha_subida TIMESTAMP WITH TIME ZONE,
  notas TEXT,
  subido_por_nombre TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.periodo,
    b.ciclo_escolar,
    b.archivo_url,
    b.archivo_nombre,
    b.fecha_subida,
    b.notas,
    COALESCE(p.nombre || ' ' || p.apellidos, 'Sistema') as subido_por_nombre
  FROM boletas b
  LEFT JOIN profiles p ON b.subido_por = p.id
  WHERE b.alumno_id = p_alumno_id
  ORDER BY b.fecha_subida DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar tabla creada
SELECT 'Tabla boletas creada' as status, COUNT(*) as registros FROM boletas;

-- Verificar políticas
SELECT 'Políticas RLS creadas' as status, COUNT(*) as total
FROM pg_policies WHERE tablename = 'boletas';

-- Verificar función
SELECT 'Función auxiliar creada' as status
FROM pg_proc WHERE proname = 'get_boletas_alumno';

SELECT '✅ Migración completada exitosamente' as resultado;
