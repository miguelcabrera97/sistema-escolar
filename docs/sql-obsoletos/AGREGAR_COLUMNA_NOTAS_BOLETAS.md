# Agregar Columna "notas" a la Tabla Boletas

El sistema intenta guardar notas en la tabla boletas pero la columna no existe.

## Ejecutar en SQL Editor de Supabase

```sql
-- Agregar columna notas a la tabla boletas
ALTER TABLE boletas
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Verificar que se agregó correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'boletas'
ORDER BY ordinal_position;
```

## Verificar la estructura completa de la tabla

Si la tabla no tiene todas las columnas necesarias, ejecuta este SQL para crearla completa:

```sql
-- Agregar todas las columnas faltantes
ALTER TABLE boletas
ADD COLUMN IF NOT EXISTS notas TEXT;

ALTER TABLE boletas
ADD COLUMN IF NOT EXISTS subido_por UUID REFERENCES profiles(id);

ALTER TABLE boletas
ADD COLUMN IF NOT EXISTS archivo_nombre TEXT;

ALTER TABLE boletas
ADD COLUMN IF NOT EXISTS fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verificar estructura final
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'boletas'
ORDER BY ordinal_position;
```

## Estructura esperada de la tabla boletas

La tabla debe tener estas columnas:

| Columna         | Tipo      | Nulable | Descripción                          |
|-----------------|-----------|---------|--------------------------------------|
| id              | UUID      | NO      | Primary key                          |
| alumno_id       | UUID      | NO      | Foreign key a alumnos                |
| periodo         | VARCHAR   | NO      | "Primer Trimestre", etc.             |
| ciclo_escolar   | VARCHAR   | NO      | "2024-2025"                          |
| archivo_url     | TEXT      | NO      | URL del PDF en storage               |
| archivo_nombre  | TEXT      | NO      | Nombre original del archivo          |
| notas           | TEXT      | SÍ      | Notas opcionales del directivo       |
| subido_por      | UUID      | SÍ      | Foreign key a profiles (directivo)   |
| fecha_subida    | TIMESTAMP | NO      | Fecha de subida (default: NOW())     |
| created_at      | TIMESTAMP | NO      | Fecha de creación (default: NOW())   |

Después de ejecutar el SQL, intenta subir una boleta nuevamente.
