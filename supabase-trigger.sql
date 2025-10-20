-- Trigger para crear automáticamente un profile cuando se crea un usuario en auth.users
-- Ejecuta este SQL en Supabase SQL Editor

-- 1. Crear función que se ejecutará cuando se cree un nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, apellidos, email, role, activo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', 'Nuevo'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'alumno'),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eliminar trigger si ya existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Crear trigger que se activa cuando se inserta un nuevo usuario
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar que el trigger se creó correctamente
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
