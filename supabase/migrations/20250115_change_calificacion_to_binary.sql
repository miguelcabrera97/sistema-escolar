-- Cambiar el sistema de calificación de numérico a binario (Entregado/No Entregado)

-- Paso 1: Cambiar el tipo de dato de calificacion de NUMERIC a TEXT
ALTER TABLE entregas ALTER COLUMN calificacion TYPE TEXT;

-- Paso 2: Eliminar restricción si existe y crear nueva
ALTER TABLE entregas DROP CONSTRAINT IF EXISTS entregas_calificacion_check;

ALTER TABLE entregas ADD CONSTRAINT entregas_calificacion_check
  CHECK (calificacion IS NULL OR calificacion IN ('Entregado', 'No Entregado'));

-- Paso 3: Actualizar registros existentes (calificaciones numéricas >= 70 = Entregado, < 70 = No Entregado)
UPDATE entregas
SET calificacion = CASE
  WHEN calificacion::numeric >= 70 THEN 'Entregado'
  WHEN calificacion::numeric < 70 THEN 'No Entregado'
  ELSE calificacion
END
WHERE calificacion ~ '^[0-9]+\.?[0-9]*$';

-- Comentario para documentar el cambio
COMMENT ON COLUMN entregas.calificacion IS 'Calificación binaria: Entregado o No Entregado';
