-- ============================================
-- DEBUG: Verificar por qué las políticas no funcionan
-- ============================================

-- 1. Ver tu usuario actual
SELECT
  auth.uid() as "Mi User ID",
  auth.role() as "Mi Role Auth";

-- 2. Ver tu perfil
SELECT
  id,
  email,
  role as "Rol en profiles",
  nombre,
  apellidos
FROM profiles
WHERE id = auth.uid();

-- 3. Verificar si la consulta de la política funciona manualmente
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'directivo'
    ) THEN '✅ La política DEBERÍA permitir el INSERT'
    ELSE '❌ La política está bloqueando porque NO eres directivo'
  END as "Resultado";

-- 4. Ver todas las políticas activas
SELECT
  policyname,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN 'TIENE USING'
    ELSE 'SIN USING'
  END as "tiene_using",
  CASE
    WHEN with_check IS NOT NULL THEN 'TIENE WITH CHECK'
    ELSE 'SIN WITH CHECK'
  END as "tiene_with_check"
FROM pg_policies
WHERE tablename = 'pagos'
ORDER BY cmd;

-- 5. Probar insertar un registro de prueba (ESTO VA A FALLAR pero veremos el error exacto)
-- CAMBIA LOS IDs por IDs reales de tu base de datos
/*
INSERT INTO pagos (
  concepto,
  padre_id,
  alumno_id,
  monto,
  fecha_vencimiento,
  estado,
  creado_por
) VALUES (
  'Prueba',
  'ID_PADRE_REAL_AQUI',
  'ID_ALUMNO_REAL_AQUI',
  100.00,
  CURRENT_DATE + INTERVAL '30 days',
  'pendiente',
  auth.uid()
);
*/

-- 6. Ver si auth.uid() está retornando algo
SELECT
  CASE
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() es NULL - NO ESTÁS AUTENTICADO'
    ELSE '✅ auth.uid() tiene valor: ' || auth.uid()::text
  END as "Estado autenticación";
