-- ============================================
-- DIAGNÓSTICO COMPLETO: Padres no pueden ver boletas
-- ============================================

-- PASO 1: Verificar políticas RLS en tabla BOLETAS
SELECT
  policyname,
  cmd,
  permissive,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'boletas'
ORDER BY policyname;

-- PASO 2: Verificar políticas RLS en tabla PADRES
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'padres'
ORDER BY policyname;

-- PASO 3: Verificar políticas RLS en tabla PADRE_ALUMNO
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'padre_alumno'
ORDER BY policyname;

-- PASO 4: Verificar estructura de la tabla padre_alumno
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'padre_alumno'
ORDER BY ordinal_position;

-- PASO 5: Verificar relaciones padre-alumno existentes
SELECT
  -- pa.id as relacion_id, -- COMENTADO POR ERROR: column pa.id does not exist
  pa.padre_id,
  pa.alumno_id,
  prof_padre.email as padre_email,
  prof_padre.nombre as padre_nombre,
  prof_padre.apellidos as padre_apellidos,
  prof_alumno.nombre as alumno_nombre,
  prof_alumno.apellidos as alumno_apellidos,
  a.matricula as alumno_matricula
FROM padre_alumno pa
INNER JOIN padres p ON pa.padre_id = p.id
INNER JOIN profiles prof_padre ON p.user_id = prof_padre.id
INNER JOIN alumnos a ON pa.alumno_id = a.id
INNER JOIN profiles prof_alumno ON a.user_id = prof_alumno.id
ORDER BY padre_email, alumno_nombre;

-- PASO 6: Verificar boletas existentes con información del alumno
SELECT
  b.id as boleta_id,
  b.periodo,
  b.ciclo_escolar,
  b.alumno_id,
  a.matricula,
  prof.nombre as alumno_nombre,
  prof.apellidos as alumno_apellidos,
  b.archivo_url,
  b.fecha_subida,
  -- Verificar si el alumno tiene padres asignados
  (SELECT COUNT(*) FROM padre_alumno WHERE alumno_id = b.alumno_id) as num_padres_asignados
FROM boletas b
INNER JOIN alumnos a ON b.alumno_id = a.id
INNER JOIN profiles prof ON a.user_id = prof.id
ORDER BY b.fecha_subida DESC
LIMIT 20;

-- PASO 7: Verificar padres sin hijos asignados
SELECT
  p.id as padre_id,
  prof.email as padre_email,
  prof.nombre,
  prof.apellidos,
  COUNT(pa.alumno_id) as num_hijos
FROM padres p
INNER JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN padre_alumno pa ON p.id = pa.padre_id
WHERE prof.role = 'padre'
GROUP BY p.id, prof.email, prof.nombre, prof.apellidos
HAVING COUNT(pa.alumno_id) = 0
ORDER BY prof.nombre;

-- PASO 8: Verificar alumnos con boletas pero sin padres asignados
SELECT
  a.id as alumno_id,
  a.matricula,
  prof.nombre as alumno_nombre,
  prof.apellidos as alumno_apellidos,
  COUNT(DISTINCT b.id) as num_boletas,
  COUNT(DISTINCT pa.padre_id) as num_padres
FROM alumnos a
INNER JOIN profiles prof ON a.user_id = prof.id
LEFT JOIN boletas b ON b.alumno_id = a.id
LEFT JOIN padre_alumno pa ON pa.alumno_id = a.id
GROUP BY a.id, a.matricula, prof.nombre, prof.apellidos
HAVING COUNT(DISTINCT b.id) > 0 AND COUNT(DISTINCT pa.padre_id) = 0
ORDER BY a.matricula;

-- PASO 9: Probar consulta como padre (simulación)
-- Esta consulta simula lo que un padre vería
-- Reemplaza 'EMAIL_DEL_PADRE' con el email real del padre que reporta el problema
SELECT
  b.id,
  b.periodo,
  b.ciclo_escolar,
  b.archivo_url,
  a.matricula,
  prof_alumno.nombre as alumno_nombre
FROM boletas b
INNER JOIN alumnos a ON b.alumno_id = a.id
INNER JOIN profiles prof_alumno ON a.user_id = prof_alumno.id
WHERE EXISTS (
  SELECT 1
  FROM padres p
  INNER JOIN padre_alumno pa ON p.id = pa.padre_id
  INNER JOIN profiles prof_padre ON p.user_id = prof_padre.id
  WHERE pa.alumno_id = b.alumno_id
  AND prof_padre.email = 'EMAIL_DEL_PADRE_AQUI'  -- CAMBIAR ESTO
);

-- PASO 10: Verificar bucket de Storage
-- IMPORTANTE: Esto debe verificarse en el Dashboard de Supabase
-- Storage > boletas > Settings
-- Debe estar marcado como "Public bucket"

-- PASO 11: Verificar políticas de Storage
SELECT
  name,
  bucket_id,
  definition
FROM storage.policies
WHERE bucket_id = 'boletas';

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

/*
PASO 1: Debe mostrar AL MENOS estas políticas en tabla boletas:
- "Padres pueden ver boletas de sus hijos" (SELECT)
- "Directivos tienen acceso completo a boletas" (ALL)
- "Alumnos pueden ver sus propias boletas" (SELECT)

PASO 2 y 3: Debe mostrar políticas que permitan SELECT a authenticated

PASO 5: Debe mostrar relaciones padre-alumno
- Si está vacío, LOS PADRES NO ESTÁN VINCULADOS CON SUS HIJOS

PASO 6: Debe mostrar boletas con num_padres_asignados > 0
- Si num_padres_asignados = 0, el alumno NO tiene padre asignado

PASO 7: Lista de padres sin hijos
- Si aparece un padre aquí, DEBE ASIGNARSE UN HIJO

PASO 8: Alumnos con boletas pero sin padres
- Estos alumnos necesitan que se les asigne un padre

PASO 9: Simulación de consulta de padre
- Debe devolver boletas si todo está configurado correctamente
- Si no devuelve nada, hay un problema de políticas o relaciones

PASO 11: Debe mostrar políticas que permitan acceso público
*/

-- ============================================
-- PROBLEMAS COMUNES Y SOLUCIONES
-- ============================================

/*
PROBLEMA 1: El paso 5 está vacío (no hay relaciones padre-alumno)
SOLUCIÓN:
1. Como directivo, ve a Usuarios > Alumnos
2. Edita cada alumno
3. En el campo "Padre/Tutor" selecciona el padre correspondiente
4. Guarda los cambios

PROBLEMA 2: El paso 1 no muestra la política "Padres pueden ver boletas de sus hijos"
SOLUCIÓN:
Ejecutar el script APLICAR_FIX_BOLETAS_PADRES.sql

PROBLEMA 3: El paso 6 muestra num_padres_asignados = 0
SOLUCIÓN:
El alumno no tiene padres asignados. Asignar desde la interfaz de directivo.

PROBLEMA 4: El paso 9 no devuelve boletas
CAUSAS POSIBLES:
a) No hay relación padre-alumno
b) Las políticas RLS están mal configuradas
c) El bucket de storage no es público
*/

-- ============================================
-- CONSULTA DE AYUDA: Asignar padre a alumno manualmente
-- ============================================

/*
Si necesitas asignar un padre a un alumno manualmente en SQL:

-- Paso 1: Obtener el ID del padre
SELECT p.id as padre_id, prof.email, prof.nombre, prof.apellidos
FROM padres p
INNER JOIN profiles prof ON p.user_id = prof.id
WHERE prof.email = 'email_del_padre@ejemplo.com';

-- Paso 2: Obtener el ID del alumno
SELECT a.id as alumno_id, a.matricula, prof.nombre, prof.apellidos
FROM alumnos a
INNER JOIN profiles prof ON a.user_id = prof.id
WHERE a.matricula = 'A01-SEC-2025';

-- Paso 3: Crear la relación (usar los IDs de los pasos anteriores)
INSERT INTO padre_alumno (padre_id, alumno_id)
VALUES ('PADRE_ID_AQUI', 'ALUMNO_ID_AQUI')
ON CONFLICT DO NOTHING;  -- Evita duplicados

-- Paso 4: Verificar que se creó
SELECT * FROM padre_alumno
WHERE padre_id = 'PADRE_ID_AQUI'
AND alumno_id = 'ALUMNO_ID_AQUI';
*/
