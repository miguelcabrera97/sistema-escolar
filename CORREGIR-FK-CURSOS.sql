-- Migración para corregir la foreign key de cursos.maestro_id
-- Esta foreign key debe apuntar a profiles(id) en lugar de auth.users(id)

-- Paso 1: Eliminar la constraint incorrecta
ALTER TABLE cursos DROP CONSTRAINT IF EXISTS cursos_maestro_id_fkey;

-- Paso 2: Crear la constraint correcta apuntando a profiles
ALTER TABLE cursos
ADD CONSTRAINT cursos_maestro_id_fkey
FOREIGN KEY (maestro_id)
REFERENCES profiles(id)
ON DELETE CASCADE;

-- Verificación: Ver que la constraint se creó correctamente
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
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'cursos'
    AND kcu.column_name = 'maestro_id';
