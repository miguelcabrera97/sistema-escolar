-- ============================================
-- Fix: Agregar políticas RLS faltantes para padre_alumno
-- Fecha: 2025-01-15
-- ============================================

-- Política para que directivos puedan insertar relaciones padre-alumno
DROP POLICY IF EXISTS "Directivos pueden crear relaciones padre-alumno" ON padre_alumno;
CREATE POLICY "Directivos pueden crear relaciones padre-alumno"
  ON padre_alumno FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- Política para que directivos puedan actualizar relaciones padre-alumno
DROP POLICY IF EXISTS "Directivos pueden actualizar relaciones padre-alumno" ON padre_alumno;
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

-- Política para que directivos puedan eliminar relaciones padre-alumno
DROP POLICY IF EXISTS "Directivos pueden eliminar relaciones padre-alumno" ON padre_alumno;
CREATE POLICY "Directivos pueden eliminar relaciones padre-alumno"
  ON padre_alumno FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- Comentario
COMMENT ON TABLE padre_alumno IS 'Relación entre padres y alumnos - Políticas RLS actualizadas';
