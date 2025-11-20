-- ============================================
-- FIX COMPLETO: RLS PARA TABLA PAGOS
-- ============================================

-- PASO 1: Eliminar TODAS las políticas existentes
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'pagos'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON pagos', pol.policyname);
  END LOOP;
END $$;

-- PASO 2: Asegurar que RLS está habilitado
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

-- PASO 3: Crear políticas nuevas y simples

-- DIRECTIVOS: INSERT (Crear pagos)
CREATE POLICY "Directivos pueden insertar pagos"
ON pagos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'directivo'
  )
);

-- DIRECTIVOS: SELECT (Ver pagos)
CREATE POLICY "Directivos pueden ver pagos"
ON pagos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'directivo'
  )
);

-- DIRECTIVOS: UPDATE (Actualizar pagos)
CREATE POLICY "Directivos pueden actualizar pagos"
ON pagos
FOR UPDATE
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

-- DIRECTIVOS: DELETE (Eliminar pagos)
CREATE POLICY "Directivos pueden eliminar pagos"
ON pagos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'directivo'
  )
);

-- PADRES: SELECT (Ver sus propios pagos)
CREATE POLICY "Padres pueden ver sus pagos"
ON pagos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM padres
    WHERE padres.id = pagos.padre_id
      AND padres.user_id = auth.uid()
  )
);

-- PADRES: UPDATE (Actualizar sus propios pagos para marcar como pagado)
CREATE POLICY "Padres pueden actualizar sus pagos"
ON pagos
FOR UPDATE
TO authenticated
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
-- VERIFICACIÓN FINAL
-- ============================================

-- Ver las políticas creadas
SELECT
  policyname as "Política",
  cmd as "Acción",
  roles as "Roles"
FROM pg_policies
WHERE tablename = 'pagos'
ORDER BY cmd, policyname;

-- Ver el estado de RLS
SELECT
  tablename as "Tabla",
  rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE tablename = 'pagos';

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS aplicadas correctamente para la tabla pagos';
  RAISE NOTICE '📋 Total de políticas creadas: %', (
    SELECT COUNT(*)
    FROM pg_policies
    WHERE tablename = 'pagos'
  );
END $$;
