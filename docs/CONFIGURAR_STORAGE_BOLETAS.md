# Configurar Storage para Boletas

Este archivo contiene las instrucciones para configurar el bucket de storage y las políticas RLS necesarias para subir boletas de calificaciones.

## Paso 1: Crear el Bucket (si no existe)

Ve a **Storage** en Supabase y crea un bucket llamado `boletas` con las siguientes configuraciones:
- **Nombre:** `boletas`
- **Público:** ✅ Sí (para que los PDFs sean accesibles)
- **Tamaño máximo de archivo:** 10 MB
- **Tipos de archivo permitidos:** `application/pdf`

O ejecuta este SQL:

```sql
-- Crear bucket de boletas (si no existe)
INSERT INTO storage.buckets (id, name, public)
VALUES ('boletas', 'boletas', true)
ON CONFLICT (id) DO NOTHING;
```

## Paso 2: Crear Políticas de Storage

Ejecuta el siguiente SQL en el **SQL Editor** de Supabase:

```sql
-- ============================================
-- POLÍTICAS DE STORAGE PARA BOLETAS
-- ============================================

-- Política 1: Directivos pueden subir boletas
CREATE POLICY "Directivos pueden subir boletas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'boletas' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
);

-- Política 2: Todos los usuarios autenticados pueden leer boletas
CREATE POLICY "Usuarios autenticados pueden leer boletas"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'boletas'
);

-- Política 3: Directivos pueden actualizar boletas
CREATE POLICY "Directivos pueden actualizar boletas"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'boletas' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
);

-- Política 4: Directivos pueden eliminar boletas
CREATE POLICY "Directivos pueden eliminar boletas"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'boletas' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
);
```

## Paso 3: Verificar las Políticas

```sql
-- Ver todas las políticas del bucket boletas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%boleta%';
```

## Paso 4: Crear Tabla de Boletas (si no existe)

```sql
-- Crear tabla de boletas
CREATE TABLE IF NOT EXISTS boletas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  periodo VARCHAR(50) NOT NULL, -- "Primer Trimestre", "Segundo Trimestre", etc.
  ciclo_escolar VARCHAR(20) NOT NULL, -- "2024-2025"
  archivo_url TEXT NOT NULL,
  archivo_nombre TEXT NOT NULL,
  notas TEXT,
  subido_por UUID REFERENCES profiles(id),
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_boletas_alumno ON boletas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_boletas_periodo ON boletas(periodo);
CREATE INDEX IF NOT EXISTS idx_boletas_ciclo ON boletas(ciclo_escolar);

-- Habilitar RLS
ALTER TABLE boletas ENABLE ROW LEVEL SECURITY;

-- Política: Directivos pueden insertar boletas
CREATE POLICY "Directivos pueden insertar boletas"
ON boletas FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
);

-- Política: Directivos pueden ver todas las boletas
CREATE POLICY "Directivos pueden ver todas las boletas"
ON boletas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
);

-- Política: Alumnos pueden ver sus propias boletas
CREATE POLICY "Alumnos pueden ver sus boletas"
ON boletas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM alumnos
    WHERE alumnos.id = boletas.alumno_id
    AND alumnos.user_id = auth.uid()
  )
);

-- Política: Padres pueden ver boletas de sus hijos
CREATE POLICY "Padres pueden ver boletas de sus hijos"
ON boletas FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM padre_alumno
    JOIN padres ON padres.id = padre_alumno.padre_id
    WHERE padre_alumno.alumno_id = boletas.alumno_id
    AND padres.user_id = auth.uid()
  )
);

-- Política: Directivos pueden actualizar boletas
CREATE POLICY "Directivos pueden actualizar boletas"
ON boletas FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
);

-- Política: Directivos pueden eliminar boletas
CREATE POLICY "Directivos pueden eliminar boletas"
ON boletas FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'directivo'
  )
);
```

## Verificar que todo funciona

Después de ejecutar el SQL, intenta subir una boleta desde la interfaz. Si todo está correcto:
- ✅ El archivo se subirá al bucket `boletas`
- ✅ Se creará un registro en la tabla `boletas`
- ✅ Los padres y alumnos podrán ver sus boletas
- ✅ Solo los directivos podrán subir/editar/eliminar boletas

## Notas Importantes

1. El bucket `boletas` debe ser **público** para que los PDFs sean accesibles mediante URL
2. Las políticas RLS controlan quién puede subir/ver/eliminar archivos
3. Los alumnos y padres solo pueden ver las boletas que les corresponden
4. Los directivos tienen acceso total a todas las boletas
