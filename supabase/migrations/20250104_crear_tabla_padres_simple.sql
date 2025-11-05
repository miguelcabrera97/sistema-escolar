-- Crear tabla padres si no existe (versión simple)
CREATE TABLE IF NOT EXISTS padres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Crear índice en padres
CREATE INDEX IF NOT EXISTS idx_padres_user_id ON padres(user_id);

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_padres_updated_at ON padres;
CREATE TRIGGER update_padres_updated_at
  BEFORE UPDATE ON padres
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS
ALTER TABLE padres ENABLE ROW LEVEL SECURITY;

-- Políticas para padres
DROP POLICY IF EXISTS "Padres pueden ver su propio perfil" ON padres;
CREATE POLICY "Padres pueden ver su propio perfil"
  ON padres FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Directivos pueden ver todos los padres" ON padres;
CREATE POLICY "Directivos pueden ver todos los padres"
  ON padres FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

DROP POLICY IF EXISTS "Directivos pueden insertar padres" ON padres;
CREATE POLICY "Directivos pueden insertar padres"
  ON padres FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );
