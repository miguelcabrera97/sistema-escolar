-- ============================================
-- MIGRACIÓN: SISTEMA DE BOLETAS EN PDF
-- ============================================
-- PREREQUISITOS:
-- 1. Crear bucket 'boletas' manualmente en Dashboard → Storage
-- 2. Configurar políticas de storage (permitir acceso autenticado)

-- Crear tabla de boletas
CREATE TABLE IF NOT EXISTS boletas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  periodo VARCHAR(50) NOT NULL,
  ciclo_escolar VARCHAR(50),
  archivo_url TEXT NOT NULL,
  archivo_nombre TEXT NOT NULL,
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subido_por UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(alumno_id, periodo, ciclo_escolar)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_boletas_alumno_id ON boletas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_boletas_periodo ON boletas(periodo);
CREATE INDEX IF NOT EXISTS idx_boletas_ciclo ON boletas(ciclo_escolar);
CREATE INDEX IF NOT EXISTS idx_boletas_fecha ON boletas(fecha_subida DESC);

-- Trigger para actualizar updated_at automáticamente
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

-- Comentarios para documentación
COMMENT ON TABLE boletas IS 'Boletas de calificaciones en PDF por alumno y periodo';
COMMENT ON COLUMN boletas.alumno_id IS 'ID del alumno';
COMMENT ON COLUMN boletas.periodo IS 'Periodo académico (ej: 2024-1, Enero-Junio)';
COMMENT ON COLUMN boletas.ciclo_escolar IS 'Ciclo escolar completo (ej: 2024-2025)';
COMMENT ON COLUMN boletas.archivo_url IS 'URL del PDF en Supabase Storage';
COMMENT ON COLUMN boletas.subido_por IS 'ID del directivo que subió la boleta';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE boletas ENABLE ROW LEVEL SECURITY;

-- Política: Directivos tienen acceso completo
CREATE POLICY "Directivos acceso completo a boletas"
ON boletas
TO authenticated
USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'directivo'))
WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'directivo'));

-- Política: Alumnos pueden ver solo sus boletas
CREATE POLICY "Alumnos ven sus propias boletas"
ON boletas FOR SELECT
TO authenticated
USING (
  alumno_id IN (
    SELECT id FROM alumnos WHERE user_id = auth.uid()
  )
);

-- Política: Padres pueden ver boletas de sus hijos
-- Usa la tabla padre_alumno para relacionar padres con alumnos
CREATE POLICY "Padres ven boletas de hijos"
ON boletas FOR SELECT
TO authenticated
USING (
  alumno_id IN (
    SELECT pa.alumno_id
    FROM padre_alumno pa
    JOIN padres p ON pa.padre_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- ============================================
-- FUNCIÓN AUXILIAR
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

SELECT
  'Tabla boletas creada' as item,
  COUNT(*)::text as valor
FROM boletas

UNION ALL

SELECT
  'Políticas RLS' as item,
  COUNT(*)::text as valor
FROM pg_policies
WHERE tablename = 'boletas'

UNION ALL

SELECT
  'Función auxiliar' as item,
  CASE
    WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'get_boletas_alumno')
    THEN '✅ Creada'
    ELSE '❌ No existe'
  END as valor;

-- Resultado esperado:
-- item                 | valor
-- ---------------------|----------
-- Tabla boletas creada | 0
-- Políticas RLS        | 3
-- Función auxiliar     | ✅ Creada
