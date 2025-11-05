-- ============================================
-- CONSULTAS ÚTILES: Relaciones Padre-Alumno
-- ============================================

-- 1. VER TODOS LOS ALUMNOS DE CADA PADRE
-- ============================================
SELECT
  padre.id as padre_id,
  p_padre.nombre as padre_nombre,
  p_padre.apellidos as padre_apellidos,
  p_padre.email as padre_email,
  alumno.matricula,
  p_alumno.nombre as alumno_nombre,
  p_alumno.apellidos as alumno_apellidos,
  alumno.grado || '° ' || alumno.grupo as grado_grupo,
  pa.parentesco
FROM padres padre
JOIN profiles p_padre ON padre.user_id = p_padre.id
LEFT JOIN padre_alumno pa ON padre.id = pa.padre_id
LEFT JOIN alumnos alumno ON pa.alumno_id = alumno.id
LEFT JOIN profiles p_alumno ON alumno.user_id = p_alumno.id
ORDER BY p_padre.apellidos, p_padre.nombre, alumno.matricula;

-- 2. CONTAR CUÁNTOS ALUMNOS TIENE CADA PADRE
-- ============================================
SELECT
  padre.id as padre_id,
  p_padre.nombre as padre_nombre,
  p_padre.apellidos as padre_apellidos,
  p_padre.email as padre_email,
  COUNT(pa.alumno_id) as total_alumnos
FROM padres padre
JOIN profiles p_padre ON padre.user_id = p_padre.id
LEFT JOIN padre_alumno pa ON padre.id = pa.padre_id
GROUP BY padre.id, p_padre.nombre, p_padre.apellidos, p_padre.email
ORDER BY total_alumnos DESC, p_padre.apellidos, p_padre.nombre;

-- 3. PADRES SIN ALUMNOS ASIGNADOS
-- ============================================
SELECT
  padre.id as padre_id,
  p_padre.nombre as padre_nombre,
  p_padre.apellidos as padre_apellidos,
  p_padre.email as padre_email
FROM padres padre
JOIN profiles p_padre ON padre.user_id = p_padre.id
LEFT JOIN padre_alumno pa ON padre.id = pa.padre_id
WHERE pa.id IS NULL
ORDER BY p_padre.apellidos, p_padre.nombre;

-- 4. ALUMNOS SIN PADRE ASIGNADO
-- ============================================
SELECT
  alumno.id as alumno_id,
  alumno.matricula,
  p_alumno.nombre as alumno_nombre,
  p_alumno.apellidos as alumno_apellidos,
  alumno.grado || '° ' || alumno.grupo as grado_grupo,
  p_alumno.email
FROM alumnos alumno
JOIN profiles p_alumno ON alumno.user_id = p_alumno.id
LEFT JOIN padre_alumno pa ON alumno.id = pa.alumno_id
WHERE pa.id IS NULL
ORDER BY alumno.grado, alumno.grupo, alumno.matricula;

-- 5. VER ALUMNOS DE UN PADRE ESPECÍFICO (por email)
-- ============================================
-- Cambia 'padre@ejemplo.com' por el email del padre que quieres consultar
SELECT
  p_padre.nombre as padre_nombre,
  p_padre.apellidos as padre_apellidos,
  p_padre.email as padre_email,
  alumno.matricula,
  p_alumno.nombre as alumno_nombre,
  p_alumno.apellidos as alumno_apellidos,
  alumno.grado || '° ' || alumno.grupo as grado_grupo,
  pa.parentesco
FROM padres padre
JOIN profiles p_padre ON padre.user_id = p_padre.id
JOIN padre_alumno pa ON padre.id = pa.padre_id
JOIN alumnos alumno ON pa.alumno_id = alumno.id
JOIN profiles p_alumno ON alumno.user_id = p_alumno.id
WHERE p_padre.email = 'padre@ejemplo.com'
ORDER BY alumno.matricula;

-- 6. ESTADÍSTICAS GENERALES
-- ============================================
SELECT
  (SELECT COUNT(*) FROM padres) as total_padres,
  (SELECT COUNT(*) FROM alumnos) as total_alumnos,
  (SELECT COUNT(DISTINCT padre_id) FROM padre_alumno) as padres_con_alumnos,
  (SELECT COUNT(DISTINCT alumno_id) FROM padre_alumno) as alumnos_con_padre,
  (SELECT COUNT(*) FROM padre_alumno) as total_relaciones;

-- 7. PADRES CON MÚLTIPLES ALUMNOS
-- ============================================
SELECT
  padre.id as padre_id,
  p_padre.nombre as padre_nombre,
  p_padre.apellidos as padre_apellidos,
  p_padre.email as padre_email,
  COUNT(pa.alumno_id) as total_alumnos,
  STRING_AGG(
    p_alumno.nombre || ' ' || p_alumno.apellidos || ' (' || alumno.matricula || ')',
    ', '
  ) as alumnos
FROM padres padre
JOIN profiles p_padre ON padre.user_id = p_padre.id
JOIN padre_alumno pa ON padre.id = pa.padre_id
JOIN alumnos alumno ON pa.alumno_id = alumno.id
JOIN profiles p_alumno ON alumno.user_id = p_alumno.id
GROUP BY padre.id, p_padre.nombre, p_padre.apellidos, p_padre.email
HAVING COUNT(pa.alumno_id) > 1
ORDER BY total_alumnos DESC, p_padre.apellidos, p_padre.nombre;

-- 8. ALUMNOS CON MÚLTIPLES PADRES (si aplica)
-- ============================================
SELECT
  alumno.id as alumno_id,
  alumno.matricula,
  p_alumno.nombre as alumno_nombre,
  p_alumno.apellidos as alumno_apellidos,
  COUNT(pa.padre_id) as total_padres,
  STRING_AGG(
    p_padre.nombre || ' ' || p_padre.apellidos || ' (' || pa.parentesco || ')',
    ', '
  ) as padres
FROM alumnos alumno
JOIN profiles p_alumno ON alumno.user_id = p_alumno.id
JOIN padre_alumno pa ON alumno.id = pa.alumno_id
JOIN padres padre ON pa.padre_id = padre.id
JOIN profiles p_padre ON padre.user_id = p_padre.id
GROUP BY alumno.id, alumno.matricula, p_alumno.nombre, p_alumno.apellidos
HAVING COUNT(pa.padre_id) > 1
ORDER BY total_padres DESC, alumno.matricula;
