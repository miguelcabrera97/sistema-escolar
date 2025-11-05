-- ============================================
-- POLÍTICAS RLS PARA LA TABLA PAGOS
-- ============================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Directivos pueden crear pagos" ON pagos;
DROP POLICY IF EXISTS "Directivos pueden ver todos los pagos" ON pagos;
DROP POLICY IF EXISTS "Directivos pueden actualizar pagos" ON pagos;
DROP POLICY IF EXISTS "Directivos pueden eliminar pagos" ON pagos;
DROP POLICY IF EXISTS "Padres pueden ver sus propios pagos" ON pagos;
DROP POLICY IF EXISTS "Padres pueden actualizar sus propios pagos" ON pagos;

-- POLÍTICAS PARA DIRECTIVOS
-- Directivos pueden crear pagos
CREATE POLICY "Directivos pueden crear pagos"
  ON pagos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- Directivos pueden ver todos los pagos
CREATE POLICY "Directivos pueden ver todos los pagos"
  ON pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- Directivos pueden actualizar cualquier pago
CREATE POLICY "Directivos pueden actualizar pagos"
  ON pagos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- Directivos pueden eliminar pagos
CREATE POLICY "Directivos pueden eliminar pagos"
  ON pagos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- POLÍTICAS PARA PADRES
-- Padres pueden ver sus propios pagos
CREATE POLICY "Padres pueden ver sus propios pagos"
  ON pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM padres
      WHERE padres.id = pagos.padre_id
        AND padres.user_id = auth.uid()
    )
  );

-- Padres pueden actualizar sus propios pagos (solo ciertos campos)
CREATE POLICY "Padres pueden actualizar sus propios pagos"
  ON pagos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM padres
      WHERE padres.id = pagos.padre_id
        AND padres.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM padres
      WHERE padres.id = pagos.padre_id
        AND padres.user_id = auth.uid()
    )
  );

-- Verificar políticas creadas
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
WHERE tablename = 'pagos'
ORDER BY policyname;
