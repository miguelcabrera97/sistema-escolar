-- Script para limpiar inscripciones duplicadas e incorrectas
-- Fecha: 2025-11-04

-- Paso 1: Eliminar inscripciones donde el alumno no pertenece al mismo grado y grupo que el curso
DELETE FROM inscripciones
WHERE id IN (
  SELECT i.id
  FROM inscripciones i
  INNER JOIN alumnos a ON i.alumno_id = a.id
  INNER JOIN cursos c ON i.curso_id = c.id
  WHERE a.grado != c.grado OR a.grupo != c.grupo
);

-- Paso 2: Eliminar inscripciones duplicadas (mantener solo la más reciente)
DELETE FROM inscripciones
WHERE id IN (
  SELECT i1.id
  FROM inscripciones i1
  INNER JOIN inscripciones i2 ON
    i1.curso_id = i2.curso_id
    AND i1.alumno_id = i2.alumno_id
    AND i1.id < i2.id
);

-- Paso 3: Verificar resultados
-- Esta consulta debe retornar 0 si no hay problemas
SELECT
  COUNT(*) as inscripciones_con_problemas
FROM inscripciones i
INNER JOIN alumnos a ON i.alumno_id = a.id
INNER JOIN cursos c ON i.curso_id = c.id
WHERE a.grado != c.grado OR a.grupo != c.grupo;

-- Paso 4: Verificar duplicados
-- Esta consulta debe retornar 0 si no hay duplicados
SELECT
  curso_id,
  alumno_id,
  COUNT(*) as total
FROM inscripciones
GROUP BY curso_id, alumno_id
HAVING COUNT(*) > 1;
