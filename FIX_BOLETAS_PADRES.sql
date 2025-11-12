-- ============================================
-- SCRIPT PARA CORREGIR ACCESO DE PADRES A BOLETAS
-- ============================================

-- 1. Verificar que el bucket 'boletas' exista
-- (Esto se hace desde el dashboard de Supabase en Storage)

-- 2. Asegurarse de que el bucket sea PÚBLICO
-- Ve a Storage > boletas > Settings > Make public

-- 3. Verificar políticas RLS de la tabla boletas
-- Primero verificamos las políticas existentes:
SELECT * FROM pg_policies WHERE tablename = 'boletas';

-- 4. ELIMINAR políticas antiguas que puedan estar bloqueando el acceso
DROP POLICY IF EXISTS "Los padres pueden ver boletas de sus hijos" ON boletas;
DROP POLICY IF EXISTS "Padres pueden ver boletas de sus hijos" ON boletas;
DROP POLICY IF EXISTS "padres_read_boletas" ON boletas;

-- 5. CREAR política correcta para que padres vean las boletas
CREATE POLICY "Padres pueden ver boletas de sus hijos"
ON boletas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM padres p
    INNER JOIN padre_alumno pa ON p.id = pa.padre_id
    WHERE p.user_id = auth.uid()
    AND pa.alumno_id = boletas.alumno_id
  )
);

-- 6. Política para directivos (todos los permisos)
DROP POLICY IF EXISTS "Directivos tienen acceso completo a boletas" ON boletas;
CREATE POLICY "Directivos tienen acceso completo a boletas"
ON boletas
FOR ALL
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

-- 7. Política para alumnos (ver sus propias boletas)
DROP POLICY IF EXISTS "Alumnos pueden ver sus propias boletas" ON boletas;
CREATE POLICY "Alumnos pueden ver sus propias boletas"
ON boletas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM alumnos
    WHERE user_id = auth.uid()
    AND id = boletas.alumno_id
  )
);

-- 8. VERIFICAR que las políticas se crearon correctamente
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'boletas';

-- 9. VERIFICAR datos de prueba
-- Verifica que el padre tenga relación con el alumno
SELECT
  p.id as padre_id,
  p.user_id as padre_user_id,
  prof.nombre as padre_nombre,
  prof.apellidos as padre_apellidos,
  pa.alumno_id,
  a.matricula,
  prof_alumno.nombre as alumno_nombre,
  prof_alumno.apellidos as alumno_apellidos
FROM padres p
INNER JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN padre_alumno pa ON p.id = pa.padre_id
LEFT JOIN alumnos a ON pa.alumno_id = a.id
LEFT JOIN profiles prof_alumno ON a.user_id = prof_alumno.id
WHERE prof.role = 'padre'
ORDER BY padre_nombre, alumno_nombre;

-- 10. VERIFICAR boletas existentes y su accesibilidad
SELECT
  b.id,
  b.periodo,
  b.ciclo_escolar,
  b.fecha_subida,
  a.matricula,
  prof.nombre as alumno_nombre,
  prof.apellidos as alumno_apellidos,
  -- Verificar si hay padres asociados
  (SELECT COUNT(*) FROM padre_alumno pa WHERE pa.alumno_id = b.alumno_id) as num_padres
FROM boletas b
INNER JOIN alumnos a ON b.alumno_id = a.id
INNER JOIN profiles prof ON a.user_id = prof.id
ORDER BY b.fecha_subida DESC;

-- ============================================
-- INSTRUCCIONES ADICIONALES
-- ============================================

/*
IMPORTANTE: Configuración del Storage Bucket

1. Ve al Dashboard de Supabase
2. Ve a Storage > boletas
3. Haz clic en "Settings" (configuración)
4. Marca "Public bucket" (hacer público el bucket)
5. Guarda los cambios

ALTERNATIVA: Si quieres mantener el bucket privado, usa URLs firmadas:
- En ese caso, NO marques el bucket como público
- La función obtenerUrlDescargaBoleta() en boletas-actions.ts ya genera URLs firmadas
- Modifica el componente padre para usar URLs firmadas en lugar de URLs públicas

PARA USAR URLs FIRMADAS:
En app/padre/calificaciones/page.tsx, cambia la línea 331 de:
  onClick={() => window.open(boleta.archivo_url, '_blank')}
a:
  onClick={async () => {
    const result = await obtenerUrlDescargaBoleta(boleta.id)
    if (result.success) {
      window.open(result.data.url, '_blank')
    }
  }}
*/

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

-- Ejecuta esto DESPUÉS de aplicar los cambios para verificar:
-- 1. Inicia sesión como padre
-- 2. Ve a la página de calificaciones
-- 3. Deberías ver las boletas de tus hijos
-- 4. Al hacer clic en "Descargar PDF" debería abrir la boleta

-- Si aún no funciona, verifica:
-- a) Que el padre tenga relación con el alumno en padre_alumno
-- b) Que la boleta exista para ese alumno
-- c) Que el bucket sea público o uses URLs firmadas
-- d) Que no haya errores en la consola del navegador
