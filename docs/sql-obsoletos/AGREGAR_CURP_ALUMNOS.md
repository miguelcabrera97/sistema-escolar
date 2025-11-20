# Agregar Campo CURP a Alumnos

Este archivo contiene el SQL necesario para agregar el campo CURP (Clave Única de Registro de Población) a la tabla de alumnos.

## Ejecutar en SQL Editor de Supabase

```sql
-- Agregar columna curp a la tabla alumnos
ALTER TABLE alumnos
ADD COLUMN IF NOT EXISTS curp VARCHAR(18);

-- Opcional: Agregar índice para búsquedas rápidas por CURP
CREATE INDEX IF NOT EXISTS idx_alumnos_curp ON alumnos(curp);

-- Opcional: Agregar comentario a la columna
COMMENT ON COLUMN alumnos.curp IS 'Clave Única de Registro de Población (18 caracteres)';
```

## Verificar que se agregó correctamente

```sql
-- Ver la estructura de la tabla alumnos
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'alumnos'
ORDER BY ordinal_position;
```

## Notas

- El CURP en México tiene exactamente 18 caracteres
- El campo es opcional (nullable) para permitir registros antiguos sin CURP
- Se puede agregar una constraint de unicidad más adelante si es necesario:

```sql
-- Solo ejecutar si quieres que el CURP sea único
ALTER TABLE alumnos
ADD CONSTRAINT unique_curp UNIQUE (curp);
```
