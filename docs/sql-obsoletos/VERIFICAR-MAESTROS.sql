-- Script para verificar y solucionar el problema de maestros en cursos

-- 1. Ver qué maestros existen en profiles pero NO en auth.users
SELECT
    p.id,
    p.nombre,
    p.apellidos,
    p.email,
    CASE
        WHEN au.id IS NULL THEN 'NO EXISTE EN AUTH.USERS'
        ELSE 'OK'
    END as estado
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.role = 'maestro';

-- 2. Si necesitas recrear la foreign key para que apunte a profiles en lugar de auth.users:
-- CUIDADO: Solo ejecuta esto si estás seguro

-- Primero eliminar la constraint existente
-- ALTER TABLE cursos DROP CONSTRAINT IF EXISTS cursos_maestro_id_fkey;

-- Crear nueva constraint que apunte a profiles
-- ALTER TABLE cursos
-- ADD CONSTRAINT cursos_maestro_id_fkey
-- FOREIGN KEY (maestro_id)
-- REFERENCES profiles(id)
-- ON DELETE CASCADE;

-- 3. Verificar cursos existentes
SELECT
    c.id,
    c.nombre,
    c.grado,
    c.grupo,
    c.maestro_id,
    p.nombre as maestro_nombre,
    p.apellidos as maestro_apellidos
FROM cursos c
LEFT JOIN profiles p ON c.maestro_id = p.id;
