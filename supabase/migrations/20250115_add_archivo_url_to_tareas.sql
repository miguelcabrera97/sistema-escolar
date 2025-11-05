-- Agregar campo archivo_url a la tabla tareas para archivos adjuntos del maestro
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS archivo_url TEXT;

-- Agregar comentario para documentar el campo
COMMENT ON COLUMN tareas.archivo_url IS 'URL del archivo adjunto subido por el maestro (material de apoyo, instrucciones, etc.)';
