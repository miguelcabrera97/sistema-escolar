-- Migración: Crear tabla curso_auxiliares para asignación automática
-- Fecha: 2025-11-04
-- Descripción: Tabla de relación entre cursos y auxiliares de calificaciones

-- 1. Crear tabla de relación curso_auxiliares
CREATE TABLE IF NOT EXISTS curso_auxiliares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  auxiliar_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Evitar duplicados: un auxiliar no puede estar asignado dos veces al mismo curso
  UNIQUE(curso_id, auxiliar_id)
);

-- 2. Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_curso_auxiliares_curso_id ON curso_auxiliares(curso_id);
CREATE INDEX IF NOT EXISTS idx_curso_auxiliares_auxiliar_id ON curso_auxiliares(auxiliar_id);

-- 3. Agregar comentarios para documentación
COMMENT ON TABLE curso_auxiliares IS 'Relación entre cursos y auxiliares de calificaciones. Los auxiliares son asignados automáticamente al crear un curso.';
COMMENT ON COLUMN curso_auxiliares.curso_id IS 'ID del curso';
COMMENT ON COLUMN curso_auxiliares.auxiliar_id IS 'ID del usuario con rol auxiliar_calificaciones';

-- 4. Función para asignar automáticamente auxiliares a un nuevo curso
CREATE OR REPLACE FUNCTION asignar_auxiliares_a_curso()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar una relación por cada auxiliar activo en el sistema
  INSERT INTO curso_auxiliares (curso_id, auxiliar_id)
  SELECT NEW.id, p.id
  FROM profiles p
  WHERE p.role = 'auxiliar_calificaciones'
    AND p.activo = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear trigger que se ejecuta después de crear un curso
CREATE TRIGGER trigger_asignar_auxiliares_a_curso
  AFTER INSERT ON cursos
  FOR EACH ROW
  EXECUTE FUNCTION asignar_auxiliares_a_curso();

-- 6. Asignar retroactivamente todos los auxiliares actuales a cursos existentes
-- (Ejecutar solo una vez, luego el trigger se encarga de nuevos cursos)
INSERT INTO curso_auxiliares (curso_id, auxiliar_id)
SELECT c.id, p.id
FROM cursos c
CROSS JOIN profiles p
WHERE p.role = 'auxiliar_calificaciones'
  AND p.activo = true
ON CONFLICT (curso_id, auxiliar_id) DO NOTHING;

-- Verificación: Ver asignaciones creadas
-- SELECT ca.*, c.nombre as curso_nombre, p.nombre as auxiliar_nombre
-- FROM curso_auxiliares ca
-- JOIN cursos c ON ca.curso_id = c.id
-- JOIN profiles p ON ca.auxiliar_id = p.id;
