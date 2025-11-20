-- Migración: Agregar campos adicionales a la tabla alumnos
-- Fecha: 2025-11-03
-- Descripción: Agrega CURP, nombre del tutor, información médica y teléfonos de emergencia

-- 1. Agregar campo CURP (Clave Única de Registro de Población)
-- En México, el CURP tiene exactamente 18 caracteres
ALTER TABLE alumnos
ADD COLUMN IF NOT EXISTS curp VARCHAR(18);

-- 2. Agregar campo para nombre del padre/tutor
ALTER TABLE alumnos
ADD COLUMN IF NOT EXISTS nombre_tutor TEXT;

-- 3. Agregar campo para información médica indispensable
ALTER TABLE alumnos
ADD COLUMN IF NOT EXISTS informacion_medica TEXT;

-- 4. Agregar campo para teléfonos de contacto de emergencia (permite múltiples)
-- Usamos JSONB para almacenar un array de objetos con nombre y número
-- Formato: [{"nombre": "Mamá", "numero": "555-1234567"}, {"nombre": "Papá", "numero": "555-7654321"}]
ALTER TABLE alumnos
ADD COLUMN IF NOT EXISTS telefonos_emergencia JSONB DEFAULT '[]'::jsonb;

-- Agregar comentarios a las columnas para documentación
COMMENT ON COLUMN alumnos.curp IS 'Clave Única de Registro de Población (18 caracteres)';
COMMENT ON COLUMN alumnos.nombre_tutor IS 'Nombre completo del padre, madre o tutor legal';
COMMENT ON COLUMN alumnos.informacion_medica IS 'Información médica relevante del alumno (alergias, condiciones, medicamentos, etc.)';
COMMENT ON COLUMN alumnos.telefonos_emergencia IS 'Array JSON de teléfonos de emergencia con formato: [{"nombre": "contacto", "numero": "teléfono"}]';

-- Opcional: Agregar índice en CURP para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_alumnos_curp ON alumnos(curp);

-- Verificación: Mostrar estructura actualizada de la tabla
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'alumnos'
-- ORDER BY ordinal_position;
