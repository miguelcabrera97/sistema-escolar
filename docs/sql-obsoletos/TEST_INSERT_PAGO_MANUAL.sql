-- ============================================
-- TEST: Insertar un pago manualmente
-- ============================================
-- Este script prueba si podemos insertar directamente en la base de datos

-- PASO 1: Obtener IDs reales para usar en el INSERT
SELECT
  'Padres disponibles:' as info,
  p.id as padre_id,
  prof.nombre,
  prof.email
FROM padres p
JOIN profiles prof ON p.user_id = prof.id
LIMIT 5;

SELECT
  'Alumnos disponibles:' as info,
  a.id as alumno_id,
  a.matricula,
  prof.nombre,
  prof.apellidos
FROM alumnos a
JOIN profiles prof ON a.user_id = prof.id
LIMIT 5;

SELECT
  'Conceptos disponibles:' as info,
  id as concepto_id,
  nombre
FROM conceptos_pago
WHERE activo = true
LIMIT 5;

-- PASO 2: Tu usuario actual (el que va a crear el pago)
SELECT
  'Tu usuario:' as info,
  auth.uid() as user_id,
  p.role,
  p.nombre,
  p.email
FROM profiles p
WHERE p.id = auth.uid();

-- PASO 3: Intenta insertar un pago de prueba
-- REEMPLAZA los IDs con los IDs reales de arriba
/*
INSERT INTO pagos (
  concepto,
  padre_id,
  alumno_id,
  descripcion,
  monto,
  fecha_vencimiento,
  estado,
  creado_por
) VALUES (
  'Mensualidad',
  'ID_PADRE_AQUI',
  'ID_ALUMNO_AQUI',
  'Pago de prueba manual',
  500.00,
  CURRENT_DATE + INTERVAL '30 days',
  'pendiente',
  auth.uid()
) RETURNING *;
*/

-- Si el INSERT de arriba funciona, el problema está en el código Next.js
-- Si falla, el problema está en la base de datos (constraints, permisos, etc)
