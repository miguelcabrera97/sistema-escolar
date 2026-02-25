-- ============================================
-- SOLUCIONAR: Maestros no pueden ver sus cursos
-- ============================================

-- PASO 1: Verificar políticas RLS actuales en la tabla cursos
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'cursos';

-- PASO 2: Verificar si RLS está habilitado en la tabla cursos
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'cursos';

-- PASO 3: Verificar estructura de la tabla cursos
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'cursos'
ORDER BY ordinal_position;

-- PASO 4: Verificar foreign key de maestro_id
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'cursos'
  AND tc.constraint_type = 'FOREIGN KEY';

-- PASO 5: Verificar que hay maestros en profiles
SELECT
  COUNT(*) as total_maestros,
  COUNT(CASE WHEN activo = true THEN 1 END) as maestros_activos
FROM profiles
WHERE role = 'maestro';

-- PASO 6: Verificar cursos existentes y sus maestros
SELECT
  c.id,
  c.nombre,
  c.grado,
  c.grupo,
  c.maestro_id,
  p.nombre as maestro_nombre,
  p.apellidos as maestro_apellidos,
  p.email as maestro_email,
  p.role as maestro_role,
  p.activo as maestro_activo
FROM cursos c
LEFT JOIN profiles p ON c.maestro_id = p.id
ORDER BY c.nombre;

-- PASO 7: Buscar maestros sin cursos asignados
SELECT
  p.id,
  p.nombre,
  p.apellidos,
  p.email,
  p.activo,
  COUNT(c.id) as num_cursos
FROM profiles p
LEFT JOIN cursos c ON c.maestro_id = p.id
WHERE p.role = 'maestro'
GROUP BY p.id, p.nombre, p.apellidos, p.email, p.activo
ORDER BY num_cursos DESC, p.nombre;

-- ============================================
-- SOLUCIÓN: Crear/Actualizar políticas RLS
-- ============================================

-- ELIMINAR políticas antiguas si existen
DROP POLICY IF EXISTS "Maestros pueden ver sus cursos" ON cursos;
DROP POLICY IF EXISTS "Directivos pueden ver todos los cursos" ON cursos;
DROP POLICY IF EXISTS "Directivos pueden crear cursos" ON cursos;
DROP POLICY IF EXISTS "Directivos pueden actualizar cursos" ON cursos;
DROP POLICY IF EXISTS "Directivos pueden eliminar cursos" ON cursos;
DROP POLICY IF EXISTS "Alumnos pueden ver cursos donde están inscritos" ON cursos;
DROP POLICY IF EXISTS "Auxiliares pueden ver cursos asignados" ON cursos;

-- CREAR política para MAESTROS (ver sus propios cursos)
CREATE POLICY "Maestros pueden ver sus cursos"
ON cursos
FOR SELECT
TO authenticated
USING (
  maestro_id = auth.uid()
);

-- CREAR política para DIRECTIVOS (acceso completo)
CREATE POLICY "Directivos pueden ver todos los cursos"
ON cursos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'directivo'
  )
);

CREATE POLICY "Directivos pueden crear cursos"
ON cursos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'directivo'
  )
);

CREATE POLICY "Directivos pueden actualizar cursos"
ON cursos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'directivo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'directivo'
  )
);

CREATE POLICY "Directivos pueden eliminar cursos"
ON cursos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'directivo'
  )
);

-- CREAR política para ALUMNOS (ver cursos donde están inscritos)
CREATE POLICY "Alumnos pueden ver cursos donde están inscritos"
ON cursos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM inscripciones i
    INNER JOIN alumnos a ON i.alumno_id = a.id
    WHERE i.curso_id = cursos.id
    AND a.user_id = auth.uid()
  )
);

-- CREAR política para AUXILIARES (ver cursos asignados)
CREATE POLICY "Auxiliares pueden ver cursos asignados"
ON cursos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM curso_auxiliares ca
    INNER JOIN auxiliares_calificaciones ac ON ca.auxiliar_id = ac.id
    WHERE ca.curso_id = cursos.id
    AND ac.user_id = auth.uid()
  )
);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Verificar que las políticas se crearon correctamente
SELECT
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'cursos'
ORDER BY policyname;

-- Probar consulta como maestro (simulado)
-- NOTA: Ejecutar esto después de hacer login como maestro
-- SELECT * FROM cursos WHERE maestro_id = auth.uid();

-- ============================================
-- DIAGNÓSTICO ADICIONAL
-- ============================================

-- Si aún no funciona, verificar si hay un problema de foreign key
-- Buscar maestros cuyos IDs no existen en auth.users
SELECT
  c.id as curso_id,
  c.nombre as curso_nombre,
  c.maestro_id,
  CASE
    WHEN p.id IS NULL THEN 'MAESTRO NO EXISTE EN PROFILES'
    WHEN p.role != 'maestro' THEN 'USER NO ES MAESTRO: ' || p.role
    WHEN p.activo = false THEN 'MAESTRO INACTIVO'
    ELSE 'OK'
  END as estado
FROM cursos c
LEFT JOIN profiles p ON c.maestro_id = p.id
WHERE p.id IS NULL
   OR p.role != 'maestro'
   OR p.activo = false;

-- Verificar que auth.uid() funciona correctamente
-- (Esta función solo funciona en contexto de sesión autenticada)
SELECT
  'auth.uid() actual: ' || COALESCE(auth.uid()::text, 'NULL (no hay sesión activa)') as info;

-- ============================================
-- RESULTADO ESPERADO
-- ============================================

/*
Después de ejecutar este script, deberías ver:

1. Políticas RLS creadas correctamente:
   - "Maestros pueden ver sus cursos" (SELECT)
   - "Directivos pueden ver todos los cursos" (SELECT)
   - "Directivos pueden crear cursos" (INSERT)
   - "Directivos pueden actualizar cursos" (UPDATE)
   - "Directivos pueden eliminar cursos" (DELETE)
   - "Alumnos pueden ver cursos donde están inscritos" (SELECT)
   - "Auxiliares pueden ver cursos asignados" (SELECT)

2. Lista de cursos con información de maestros
   - Todos los maestros deben tener role='maestro' y activo=true

3. Si hay problemas:
   - Maestros sin cursos: Normal si no se les han asignado
   - Cursos sin maestro o con maestro inválido: PROBLEMA - necesita corrección manual
*/
