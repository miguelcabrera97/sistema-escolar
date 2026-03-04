# Crear Sistema de Gestión de Grados y Grupos

Este archivo contiene el SQL necesario para crear las tablas de grados y grupos del colegio.

## Ejecutar en SQL Editor de Supabase

```sql
-- ============================================
-- TABLA: niveles_educativos
-- ============================================
CREATE TABLE IF NOT EXISTS niveles_educativos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(50) NOT NULL UNIQUE, -- Primaria, Secundaria, Preparatoria
  orden INT NOT NULL, -- Para ordenar los niveles
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: grados
-- ============================================
CREATE TABLE IF NOT EXISTS grados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nivel_id UUID NOT NULL REFERENCES niveles_educativos(id) ON DELETE CASCADE,
  nombre VARCHAR(50) NOT NULL, -- 1, 2, 3, etc.
  nombre_completo VARCHAR(100) NOT NULL, -- "1° Primaria", "1° Secundaria", etc.
  orden INT NOT NULL, -- Para ordenar los grados dentro del nivel
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(nivel_id, nombre)
);

-- ============================================
-- TABLA: grupos
-- ============================================
CREATE TABLE IF NOT EXISTS grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(10) NOT NULL UNIQUE, -- A, B, C, D, etc.
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_grados_nivel ON grados(nivel_id);
CREATE INDEX IF NOT EXISTS idx_grados_activo ON grados(activo);
CREATE INDEX IF NOT EXISTS idx_grupos_activo ON grupos(activo);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Niveles Educativos
ALTER TABLE niveles_educativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver niveles educativos"
ON niveles_educativos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Solo directivos pueden modificar niveles"
ON niveles_educativos FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
);

-- Grados
ALTER TABLE grados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver grados"
ON grados FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Solo directivos pueden modificar grados"
ON grados FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
);

-- Grupos
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver grupos"
ON grupos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Solo directivos pueden modificar grupos"
ON grupos FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar niveles educativos
INSERT INTO niveles_educativos (nombre, orden) VALUES
  ('Primaria', 1),
  ('Secundaria', 2),
  ('Preparatoria', 3)
ON CONFLICT (nombre) DO NOTHING;

-- Insertar grados de Primaria
INSERT INTO grados (nivel_id, nombre, nombre_completo, orden)
SELECT
  n.id,
  g.nombre,
  g.nombre || '° ' || n.nombre as nombre_completo,
  g.orden
FROM niveles_educativos n
CROSS JOIN (
  VALUES
    ('1', 1),
    ('2', 2),
    ('3', 3),
    ('4', 4),
    ('5', 5),
    ('6', 6)
) AS g(nombre, orden)
WHERE n.nombre = 'Primaria'
ON CONFLICT DO NOTHING;

-- Insertar grados de Secundaria
INSERT INTO grados (nivel_id, nombre, nombre_completo, orden)
SELECT
  n.id,
  g.nombre,
  g.nombre || '° ' || n.nombre as nombre_completo,
  g.orden
FROM niveles_educativos n
CROSS JOIN (
  VALUES
    ('1', 1),
    ('2', 2),
    ('3', 3)
) AS g(nombre, orden)
WHERE n.nombre = 'Secundaria'
ON CONFLICT DO NOTHING;

-- Insertar grados de Preparatoria
INSERT INTO grados (nivel_id, nombre, nombre_completo, orden)
SELECT
  n.id,
  g.nombre,
  g.nombre || '° ' || n.nombre as nombre_completo,
  g.orden
FROM niveles_educativos n
CROSS JOIN (
  VALUES
    ('1', 1),
    ('2', 2),
    ('3', 3)
) AS g(nombre, orden)
WHERE n.nombre = 'Preparatoria'
ON CONFLICT DO NOTHING;

-- Insertar grupos iniciales
INSERT INTO grupos (nombre) VALUES
  ('A'),
  ('B'),
  ('C'),
  ('D')
ON CONFLICT (nombre) DO NOTHING;
```

## Verificar que se crearon correctamente

```sql
-- Ver niveles educativos
SELECT * FROM niveles_educativos ORDER BY orden;

-- Ver grados por nivel
SELECT
  n.nombre as nivel,
  g.nombre_completo,
  g.activo
FROM grados g
JOIN niveles_educativos n ON g.nivel_id = n.id
ORDER BY n.orden, g.orden;

-- Ver grupos
SELECT * FROM grupos ORDER BY nombre;
```

## Notas importantes

- Los niveles educativos son: Primaria (6 grados), Secundaria (3 grados), Preparatoria (3 grados)
- Los grupos son letras: A, B, C, D (puedes agregar más desde la interfaz)
- Solo los directivos pueden agregar/modificar grados y grupos
- Todos los usuarios autenticados pueden ver los grados y grupos para seleccionarlos
