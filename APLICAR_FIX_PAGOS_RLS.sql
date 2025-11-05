-- ============================================
-- SCRIPT RÁPIDO: APLICAR POLÍTICAS RLS PARA PAGOS
-- ============================================
-- Copia y pega este script completo en Supabase SQL Editor

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Directivos pueden crear pagos" ON pagos;
DROP POLICY IF EXISTS "Directivos pueden ver todos los pagos" ON pagos;
DROP POLICY IF EXISTS "Directivos pueden actualizar pagos" ON pagos;
DROP POLICY IF EXISTS "Directivos pueden eliminar pagos" ON pagos;
DROP POLICY IF EXISTS "Padres pueden ver sus propios pagos" ON pagos;
DROP POLICY IF EXISTS "Padres pueden actualizar sus propios pagos" ON pagos;

-- DIRECTIVOS: Crear pagos
CREATE POLICY "Directivos pueden crear pagos"
  ON pagos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- DIRECTIVOS: Ver todos los pagos
CREATE POLICY "Directivos pueden ver todos los pagos"
  ON pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- DIRECTIVOS: Actualizar pagos
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

-- DIRECTIVOS: Eliminar pagos
CREATE POLICY "Directivos pueden eliminar pagos"
  ON pagos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'directivo'
    )
  );

-- PADRES: Ver sus propios pagos
CREATE POLICY "Padres pueden ver sus propios pagos"
  ON pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM padres
      WHERE padres.id = pagos.padre_id
        AND padres.user_id = auth.uid()
    )
  );

-- PADRES: Actualizar sus propios pagos
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

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver las políticas creadas
SELECT
  policyname,
  cmd,
  CASE
    WHEN policyname LIKE '%Directivos%' THEN '👔 Directivos'
    WHEN policyname LIKE '%Padres%' THEN '👨‍👩‍👧 Padres'
    ELSE 'Otros'
  END as "Para quién",
  CASE
    WHEN cmd = 'INSERT' THEN '➕ Crear'
    WHEN cmd = 'SELECT' THEN '👁️ Ver'
    WHEN cmd = 'UPDATE' THEN '✏️ Actualizar'
    WHEN cmd = 'DELETE' THEN '🗑️ Eliminar'
    ELSE cmd
  END as "Acción"
FROM pg_policies
WHERE tablename = 'pagos'
ORDER BY policyname;

-- Verificar que RLS está habilitado
SELECT
  tablename,
  rowsecurity as "RLS habilitado"
FROM pg_tables
WHERE tablename = 'pagos';
