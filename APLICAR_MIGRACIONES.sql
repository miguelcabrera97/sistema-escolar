-- ============================================
-- MIGRACIONES PARA SISTEMA DE TAREAS
-- Fecha: 2025-01-15
-- ============================================
-- IMPORTANTE: Ejecuta este script completo en Supabase Dashboard
-- SQL Editor → New Query → Pega este código → Run
-- ============================================

-- MIGRACIÓN 1: Agregar campo archivo_url a tareas
-- ============================================
-- Permite que maestros suban archivos adjuntos a las tareas

ALTER TABLE tareas ADD COLUMN IF NOT EXISTS archivo_url TEXT;

COMMENT ON COLUMN tareas.archivo_url IS 'URL del archivo adjunto subido por el maestro (material de apoyo, instrucciones, etc.)';

-- ============================================
-- MIGRACIÓN 2: Cambiar calificación de numérico a binario
-- ============================================
-- Cambia el sistema de calificación de 0-100 a "Entregado/No Entregado"

-- Paso 1: Cambiar el tipo de dato de calificacion de NUMERIC a TEXT
ALTER TABLE entregas ALTER COLUMN calificacion TYPE TEXT;

-- Paso 2: Eliminar restricción si existe y crear nueva
ALTER TABLE entregas DROP CONSTRAINT IF EXISTS entregas_calificacion_check;

ALTER TABLE entregas ADD CONSTRAINT entregas_calificacion_check
  CHECK (calificacion IS NULL OR calificacion IN ('Entregado', 'No Entregado'));

-- Paso 3: Actualizar registros existentes
-- Calificaciones >= 70 se marcan como "Entregado"
-- Calificaciones < 70 se marcan como "No Entregado"
UPDATE entregas
SET calificacion = CASE
  WHEN calificacion::numeric >= 70 THEN 'Entregado'
  WHEN calificacion::numeric < 70 THEN 'No Entregado'
  ELSE calificacion
END
WHERE calificacion ~ '^[0-9]+\.?[0-9]*$';

COMMENT ON COLUMN entregas.calificacion IS 'Calificación binaria: Entregado o No Entregado';

-- ============================================
-- FIN DE MIGRACIONES
-- ============================================
-- Si todo salió bien, deberías ver: "Success. No rows returned"
-- O el número de registros actualizados en la tabla entregas
-- ============================================
