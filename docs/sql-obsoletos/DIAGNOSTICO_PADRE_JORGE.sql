-- ============================================
-- DIAGNÓSTICO: jorge.perez@padre.com
-- ============================================
-- Ejecuta estas consultas en orden para diagnosticar el problema
-- ============================================

-- 1. VERIFICAR SI EL USUARIO EXISTE EN PROFILES
-- ============================================
SELECT
  id,
  nombre,
  apellidos,
  email,
  role,
  activo
FROM profiles
WHERE email = 'jorge.perez@padre.com';
-- ESPERADO: Debería mostrar 1 registro con role = 'padre'

-- 2. VERIFICAR SI EXISTE EN LA TABLA PADRES
-- ============================================
SELECT
  padre.id as padre_id,
  padre.user_id,
  p.nombre,
  p.apellidos,
  p.email,
  p.role
FROM padres padre
JOIN profiles p ON padre.user_id = p.id
WHERE p.email = 'jorge.perez@padre.com';
-- ESPERADO: Debería mostrar 1 registro con el padre_id

-- 3. VERIFICAR SI TIENE ALUMNOS ASIGNADOS EN PADRE_ALUMNO
-- ============================================
SELECT
  pa.id as relacion_id,
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
-- ESPERADO: Debería mostrar los alumnos asignados

-- 4. SI NO TIENE ALUMNOS - VERIFICAR QUÉ ALUMNOS EXISTEN
-- ============================================
SELECT
  a.id,
  a.matricula,
  p.nombre,
  p.apellidos,
  a.grado,
  a.grupo,
  CASE
    WHEN pa.id IS NOT NULL THEN 'Tiene padre asignado'
    ELSE 'Sin padre'
  END as estado_padre
FROM alumnos a
JOIN profiles p ON a.user_id = p.id
LEFT JOIN padre_alumno pa ON a.id = pa.alumno_id
ORDER BY a.matricula;
-- RESULTADO: Lista todos los alumnos y si tienen padre o no

-- 5. VERIFICAR POLÍTICAS RLS EN PADRE_ALUMNO
-- ============================================
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'padre_alumno'
ORDER BY cmd;
-- ESPERADO: Debería mostrar 5 políticas (2 SELECT, 1 INSERT, 1 UPDATE, 1 DELETE)

-- 6. CREAR RELACIÓN MANUAL (si no existe)
-- ============================================
-- IMPORTANTE: Reemplaza estos IDs con los valores reales de las consultas anteriores

-- Primero, obtén el padre_id de jorge.perez@padre.com:
-- (usa el resultado de la consulta 2)

-- Luego, obtén el id de algún alumno:
-- (usa el resultado de la consulta 4)

-- Finalmente, ejecuta esto reemplazando los IDs:
/*
INSERT INTO padre_alumno (padre_id, alumno_id, parentesco)
VALUES (
  'PADRE_ID_AQUI',  -- Reemplaza con el padre_id de la consulta 2
  'ALUMNO_ID_AQUI', -- Reemplaza con el id del alumno de la consulta 4
  'Padre'
);
*/

-- 7. VERIFICAR LA CONSULTA QUE USA EL FRONTEND
-- ============================================
-- Esta es la misma consulta que usa app/padre/page.tsx
-- Reemplaza 'PADRE_ID_AQUI' con el padre_id de jorge.perez@padre.com

/*
SELECT
  parentesco,
  alumnos (
    id,
    matricula,
    grado,
    grupo,
    user_id,
    profiles (
      nombre,
      apellidos
    )
  )
FROM padre_alumno
WHERE padre_id = 'PADRE_ID_AQUI';
*/

-- 8. VERIFICACIÓN COMPLETA - RESUMEN
-- ============================================
WITH padre_info AS (
  SELECT
    padre.id as padre_id,
    p.nombre as padre_nombre,
    p.apellidos as padre_apellidos,
    p.email as padre_email
  FROM padres padre
  JOIN profiles p ON padre.user_id = p.id
  WHERE p.email = 'jorge.perez@padre.com'
),
alumnos_info AS (
  SELECT
    pa.padre_id,
    COUNT(pa.alumno_id) as total_alumnos,
    STRING_AGG(
      p_alumno.nombre || ' ' || p_alumno.apellidos || ' (' || a.matricula || ')',
      ', '
    ) as alumnos
  FROM padre_alumno pa
  JOIN alumnos a ON pa.alumno_id = a.id
  JOIN profiles p_alumno ON a.user_id = p_alumno.id
  WHERE pa.padre_id IN (SELECT padre_id FROM padre_info)
  GROUP BY pa.padre_id
)
SELECT
  pi.padre_id,
  pi.padre_nombre,
  pi.padre_apellidos,
  pi.padre_email,
  COALESCE(ai.total_alumnos, 0) as total_alumnos,
  COALESCE(ai.alumnos, 'Sin alumnos asignados') as alumnos
FROM padre_info pi
LEFT JOIN alumnos_info ai ON pi.padre_id = ai.padre_id;

-- RESULTADO ESPERADO:
-- Si total_alumnos = 0, entonces jorge.perez@padre.com NO tiene alumnos asignados
-- Si total_alumnos > 0, entonces SÍ tiene alumnos pero puede haber un problema en el frontend
