# Configurar Storage para Tareas

El sistema necesita un bucket de storage en Supabase para almacenar los archivos adjuntos de las tareas.

## Paso 1: Crear el Bucket

1. Ve a tu proyecto en Supabase Dashboard
2. En el menú lateral, selecciona **Storage**
3. Haz clic en **"New bucket"**
4. Configura el bucket:
   - **Name**: `tareas`
   - **Public bucket**: ✅ Activado (para que los archivos sean accesibles públicamente)
   - Haz clic en **"Create bucket"**

## Paso 2: Configurar Políticas de Seguridad

Después de crear el bucket, necesitas configurar las políticas de Row Level Security (RLS) para el storage.

### Opción A: Mediante SQL (Recomendado)

Ve a **SQL Editor** en Supabase Dashboard y ejecuta:

```sql
-- Permitir que maestros suban archivos
CREATE POLICY "Maestros pueden subir archivos de tareas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tareas' AND
  (storage.foldername(name))[1] = 'maestros' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('maestro', 'auxiliar')
  )
);

-- Permitir que todos los usuarios autenticados lean los archivos
CREATE POLICY "Usuarios autenticados pueden leer archivos de tareas"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'tareas');

-- Permitir que maestros eliminen sus propios archivos
CREATE POLICY "Maestros pueden eliminar sus archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tareas' AND
  (storage.foldername(name))[1] = 'maestros' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('maestro', 'auxiliar')
  )
);
```

### Opción B: Mediante la interfaz de Supabase

1. Ve a **Storage** → selecciona el bucket `tareas`
2. Haz clic en **"Policies"**
3. Crea las siguientes políticas:

#### Política 1: INSERT (Subir archivos)
- **Policy name**: `Maestros pueden subir archivos de tareas`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **POLICY DEFINITION - WITH CHECK**:
```sql
bucket_id = 'tareas' AND
(storage.foldername(name))[1] = 'maestros' AND
EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role IN ('maestro', 'auxiliar')
)
```

#### Política 2: SELECT (Leer archivos)
- **Policy name**: `Usuarios autenticados pueden leer archivos de tareas`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **POLICY DEFINITION - USING**:
```sql
bucket_id = 'tareas'
```

#### Política 3: DELETE (Eliminar archivos)
- **Policy name**: `Maestros pueden eliminar sus archivos`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **POLICY DEFINITION - USING**:
```sql
bucket_id = 'tareas' AND
(storage.foldername(name))[1] = 'maestros' AND
EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role IN ('maestro', 'auxiliar')
)
```

## Paso 3: Verificar la Configuración

1. Intenta subir un archivo desde la interfaz de creación de tareas
2. Si hay errores, revisa la consola del navegador (F12)
3. Los archivos deberían subirse a la ruta: `maestros/{user_id}/{timestamp}.{extension}`

## Tipos de Archivo Permitidos

El sistema actualmente acepta:
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)
- Texto (`.txt`)
- Imágenes (`.jpg`, `.jpeg`, `.png`)

Para agregar más tipos, edita el atributo `accept` en [app/maestro/crear-tarea/page.tsx](app/maestro/crear-tarea/page.tsx:208):

```typescript
accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.ppt,.pptx,.xlsx"
```

## Solución de Problemas

### Error: "Bucket not found"
- Verifica que el bucket `tareas` existe en Storage
- Asegúrate de que el nombre sea exactamente `tareas` (minúsculas)

### Error: "new row violates row-level security policy"
- Verifica que las políticas estén creadas correctamente
- Asegúrate de que el usuario tiene el rol `maestro` o `auxiliar` en la tabla `profiles`

### Error: "File upload failed"
- Verifica que el bucket sea público
- Revisa los logs en la consola del navegador
- Verifica que el archivo no exceda el límite de tamaño (por defecto 50MB en Supabase)

### El archivo se sube pero no se ve
- Verifica que el bucket sea público
- Verifica la política SELECT
- Intenta acceder directamente a la URL del archivo

## Límites de Storage

Supabase Free Tier incluye:
- **1 GB** de almacenamiento
- **2 GB** de transferencia por mes

Si necesitas más, considera actualizar tu plan o implementar limpieza automática de archivos antiguos.
