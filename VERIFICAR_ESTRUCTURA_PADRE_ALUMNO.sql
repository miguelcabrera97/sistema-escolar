-- ============================================
-- VERIFICAR ESTRUCTURA DE TABLA padre_alumno
-- ============================================

-- 1. Ver la estructura completa de la tabla
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'padre_alumno'
ORDER BY ordinal_position;

-- RESULTADO ESPERADO:
-- id, padre_id, alumno_id, parentesco, created_at

-- 2. Si NO tiene el campo 'id', necesitas recrear la tabla
-- ADVERTENCIA: Esto eliminará todos los datos existentes en padre_alumno
/*
DROP TABLE IF EXISTS padre_alumno CASCADE;

CREATE TABLE padre_alumno (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  padre_id UUID REFERENCES padres(id) ON DELETE CASCADE,
  alumno_id UUID REFERENCES alumnos(id) ON DELETE CASCADE,
  parentesco VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(padre_id, alumno_id)
);

-- Crear índices
CREATE INDEX idx_padre_alumno_padre ON padre_alumno(padre_id);
CREATE INDEX idx_padre_alumno_alumno ON padre_alumno(alumno_id);

-- Habilitar RLS
ALTER TABLE padre_alumno ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Padres pueden ver sus alumnos"
  ON padre_alumno FOR SELECT
  USING (
    padre_id IN (
      SELECT id FROM padres WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Directivos pueden ver todas las relaciones"
  ON padre_alumno FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

CREATE POLICY "Directivos pueden crear relaciones padre-alumno"
  ON padre_alumno FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

CREATE POLICY "Directivos pueden actualizar relaciones padre-alumno"
  ON padre_alumno FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

CREATE POLICY "Directivos pueden eliminar relaciones padre-alumno"
  ON padre_alumno FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );
*/

-- 3. CONSULTA CORREGIDA (sin usar pa.id)
-- Usa esta consulta para verificar si jorge.perez tiene alumnos:
SELECT
  padre.id as padre_id,
  pa.padre_id,
  pa.alumno_id,
  pa.parentesco,
  p_padre.email as padre_email,
  a.matricula as alumno_matricula,
  p_alumno.nombre as alumno_nombre,
  p_alumno.apellidos as alumno_apellidos
FROM padre_alumno pa
JOIN padres padre ON pa.padre_id = padre.id
JOIN profiles p_padre ON padre.user_id = p_padre.id
JOIN alumnos a ON pa.alumno_id = a.id
JOIN profiles p_alumno ON a.user_id = p_alumno.id
WHERE p_padre.email = 'jorge.perez@padre.com';

-- 4. CONSULTA SIMPLIFICADA (más segura)
-- Si la anterior falla, usa esta:
SELECT
  pa.padre_id,
  pa.alumno_id,
  pa.parentesco,
  pa.created_at
FROM padre_alumno pa
JOIN padres padre ON pa.padre_id = padre.id
JOIN profiles p ON padre.user_id = p.id
WHERE p.email = 'jorge.perez@padre.com';
