-- Agregar campo activo a la tabla profiles
-- Ejecutar este SQL en Supabase SQL Editor

-- 1. Agregar columna activo con valor por defecto true
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true NOT NULL;

-- 2. Actualizar todos los registros existentes a activo = true
UPDATE profiles
SET activo = true
WHERE activo IS NULL;

-- 3. Crear índice para mejorar rendimiento en consultas por estado
CREATE INDEX IF NOT EXISTS idx_profiles_activo ON profiles(activo);

-- Verificar que se agregó correctamente
SELECT id, nombre, apellidos, email, role, activo
FROM profiles
LIMIT 5;
