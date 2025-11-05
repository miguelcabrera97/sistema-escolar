-- ============================================
-- Script para limpiar y corregir inscripciones
-- Fecha: 2025-11-04
-- ============================================

-- Paso 1: Eliminar inscripciones donde el alumno no pertenece al mismo grado y grupo que el curso
DELETE FROM inscripciones
WHERE id IN (
  SELECT i.id
  FROM inscripciones i
  INNER JOIN alumnos a ON i.alumno_id = a.id
  INNER JOIN cursos c ON i.curso_id = c.id
  WHERE a.grado != c.grado OR a.grupo != c.grupo
);

-- Paso 2: Eliminar inscripciones duplicadas (mantener solo la más reciente por created_at)
DELETE FROM inscripciones
WHERE id IN (
  SELECT i1.id
  FROM inscripciones i1
  INNER JOIN inscripciones i2 ON
    i1.curso_id = i2.curso_id
    AND i1.alumno_id = i2.alumno_id
    AND i1.created_at < i2.created_at
);

-- Paso 3: Crear una función que valide que alumno y curso tengan el mismo grado y grupo
CREATE OR REPLACE FUNCTION validar_inscripcion_mismo_grupo()
RETURNS TRIGGER AS $$
DECLARE
  alumno_grado VARCHAR;
  alumno_grupo VARCHAR;
  curso_grado VARCHAR;
  curso_grupo VARCHAR;
BEGIN
  -- Obtener grado y grupo del alumno
  SELECT grado, grupo INTO alumno_grado, alumno_grupo
  FROM alumnos
  WHERE id = NEW.alumno_id;

  -- Obtener grado y grupo del curso
  SELECT grado, grupo INTO curso_grado, curso_grupo
  FROM cursos
  WHERE id = NEW.curso_id;

  -- Validar que coincidan
  IF alumno_grado != curso_grado OR alumno_grupo != curso_grupo THEN
    RAISE EXCEPTION 'No se puede inscribir al alumno. El alumno es de %° % pero el curso es de %° %',
      alumno_grado, alumno_grupo, curso_grado, curso_grupo;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Paso 4: Crear trigger para validar inscripciones antes de insertar
DROP TRIGGER IF EXISTS trigger_validar_inscripcion ON inscripciones;
CREATE TRIGGER trigger_validar_inscripcion
  BEFORE INSERT OR UPDATE ON inscripciones
  FOR EACH ROW
  EXECUTE FUNCTION validar_inscripcion_mismo_grupo();

-- Paso 5: Agregar constraint UNIQUE para evitar duplicados
ALTER TABLE inscripciones
DROP CONSTRAINT IF EXISTS inscripciones_curso_alumno_unique;

ALTER TABLE inscripciones
ADD CONSTRAINT inscripciones_curso_alumno_unique
UNIQUE (curso_id, alumno_id);

-- ============================================
-- Consultas de verificación
-- ============================================

-- Verificar inscripciones con problemas (debe retornar 0)
SELECT
  COUNT(*) as inscripciones_con_problemas,
  'Alumnos en cursos de otros grupos' as tipo_problema
FROM inscripciones i
INNER JOIN alumnos a ON i.alumno_id = a.id
INNER JOIN cursos c ON i.curso_id = c.id
WHERE a.grado != c.grado OR a.grupo != c.grupo;

-- Verificar duplicados (debe retornar 0)
SELECT
  COUNT(*) as total_duplicados,
  'Inscripciones duplicadas' as tipo_problema
FROM (
  SELECT curso_id, alumno_id, COUNT(*) as total
  FROM inscripciones
  GROUP BY curso_id, alumno_id
  HAVING COUNT(*) > 1
) duplicados;

-- Mostrar resumen de inscripciones por grupo
SELECT
  c.grado || '° ' || c.grupo as curso_grupo,
  c.nombre as curso,
  COUNT(i.id) as total_inscritos
FROM cursos c
LEFT JOIN inscripciones i ON c.id = i.curso_id
GROUP BY c.grado, c.grupo, c.nombre
ORDER BY c.grado, c.grupo, c.nombre;
