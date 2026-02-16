-- Crear bucket para comprobantes de pago
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes-pagos', 'comprobantes-pagos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de seguridad para storage

-- Permitir a usuarios autenticados subir archivos a su propia carpeta (basada en user_id)
-- Nota: En este caso simplificado, permitiremos subir a cualquier usuario autenticado, 
-- pero idealmente restringiríamos la ruta.
CREATE POLICY "Usuarios autenticados pueden subir comprobantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'comprobantes-pagos' );

-- Permitir ver los archivos a usuarios autenticados (Directivos y el propio padre)
CREATE POLICY "Usuarios autenticados pueden ver comprobantes"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'comprobantes-pagos' );

-- Permitir actualizar/borrar solo al dueño (opcional, por ahora solo insert y select)
