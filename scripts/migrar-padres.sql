-- Script para migrar usuarios con rol 'padre' a la tabla padres
-- Este script crea registros en la tabla padres para todos los usuarios con rol padre que no tengan uno

-- Insertar padres que no existen
INSERT INTO padres (user_id, telefono, direccion, created_at, updated_at)
SELECT
  p.id as user_id,
  NULL as telefono,
  NULL as direccion,
  now() as created_at,
  now() as updated_at
FROM profiles p
WHERE p.role = 'padre'
  AND NOT EXISTS (
    SELECT 1 FROM padres pa WHERE pa.user_id = p.id
  );

-- Verificar cuántos padres se crearon
SELECT COUNT(*) as total_padres FROM padres;

-- Ver los padres creados
SELECT
  pa.id,
  pr.nombre,
  pr.apellidos,
  pr.email
FROM padres pa
JOIN profiles pr ON pa.user_id = pr.id;
