# 📋 Instrucciones para Aplicar Migraciones

## ⚠️ IMPORTANTE - Lee antes de ejecutar

Estas migraciones van a:
1. ✅ Agregar campo para archivos adjuntos en tareas
2. ✅ Cambiar el sistema de calificación de numérico (0-100) a binario (Entregado/No Entregado)
3. ✅ Convertir automáticamente las calificaciones existentes

**Tiempo estimado:** 2-3 minutos

---

## 🚀 Pasos para aplicar las migraciones

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. **Abre tu proyecto en Supabase**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto `sistema-escolar`

2. **Abre el SQL Editor**
   - En el menú izquierdo, busca: `SQL Editor`
   - Click en `New query`

3. **Copia el SQL**
   - Abre el archivo: `APLICAR_MIGRACIONES.sql` (está en la raíz del proyecto)
   - Selecciona TODO el contenido
   - Cópialo (Ctrl+C)

4. **Pega y ejecuta**
   - Pega el SQL en el editor de Supabase (Ctrl+V)
   - Click en el botón `Run` (o presiona Ctrl+Enter)

5. **Verifica el resultado**
   - Deberías ver: `Success. No rows returned`
   - O: `UPDATE X` (donde X es el número de calificaciones convertidas)

---

### Opción 2: Verificar manualmente los cambios

Después de ejecutar las migraciones, verifica que funcionó:

**Verificar campo archivo_url:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tareas' AND column_name = 'archivo_url';
```

**Verificar tipo de calificacion:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'entregas' AND column_name = 'calificacion';
```
Debe mostrar `text` en vez de `numeric`

**Ver calificaciones convertidas:**
```sql
SELECT id, calificacion, status
FROM entregas
WHERE status = 'calificada'
LIMIT 10;
```
Deberías ver "Entregado" o "No Entregado" en lugar de números

---

## 🎯 ¿Qué hace cada migración?

### Migración 1: Campo archivo_url en tareas
```sql
ALTER TABLE tareas ADD COLUMN IF NOT EXISTS archivo_url TEXT;
```
- Agrega un nuevo campo opcional a la tabla `tareas`
- Los maestros pueden subir PDFs, documentos, imágenes
- Los alumnos pueden descargarlos antes de entregar

### Migración 2: Calificación binaria
```sql
ALTER TABLE entregas ALTER COLUMN calificacion TYPE TEXT;
```
- Cambia el tipo de dato de `NUMERIC` a `TEXT`
- Agrega restricción: solo "Entregado" o "No Entregado"
- Convierte calificaciones antiguas automáticamente:
  - ≥ 70 → "Entregado"
  - < 70 → "No Entregado"

---

## ⚙️ Después de aplicar las migraciones

### Reinicia tu aplicación:
```bash
npm run dev
```

### Prueba las nuevas funcionalidades:

#### Como Maestro:
1. Ve a `/maestro/crear-tarea`
2. Verás un nuevo campo "Archivo Adjunto"
3. Sube un PDF de prueba
4. Crea la tarea
5. Ve a las entregas y califica con "Entregado" o "No Entregado"

#### Como Alumno:
1. Ve a una tarea
2. Si el maestro adjuntó un archivo, verás el botón "Descargar archivo adjunto"
3. Entrega tu tarea
4. Cuando el maestro califique, verás "Entregado" o "No Entregado"

---

## 🐛 Solución de problemas

### Error: "constraint already exists"
**Solución:** La restricción ya existe, ignora este error o ejecuta:
```sql
ALTER TABLE entregas DROP CONSTRAINT IF EXISTS entregas_calificacion_check;
```
Luego vuelve a ejecutar la migración completa.

### Error: "cannot cast type numeric to text"
**Solución:** Hay datos en un formato inesperado. Ejecuta:
```sql
-- Ver qué registros tienen problemas
SELECT id, calificacion, status FROM entregas WHERE calificacion IS NOT NULL;

-- Convertir manualmente
UPDATE entregas SET calificacion = calificacion::text;
```

### Error: "column archivo_url already exists"
**Solución:** El campo ya existe, no hay problema. Continúa con la siguiente migración.

---

## 📊 Verificación final

Ejecuta estos queries para confirmar que todo está bien:

```sql
-- 1. Verificar estructura de tareas
\d tareas

-- 2. Verificar estructura de entregas
\d entregas

-- 3. Ver calificaciones convertidas
SELECT
  COUNT(*) as total_calificadas,
  calificacion,
  COUNT(*) as cantidad
FROM entregas
WHERE status = 'calificada'
GROUP BY calificacion;
```

---

## ✅ Checklist de verificación

Marca cuando completes cada paso:

- [ ] Ejecuté el SQL en Supabase Dashboard
- [ ] Vi mensaje de éxito (sin errores)
- [ ] Verifiqué que `archivo_url` existe en tabla `tareas`
- [ ] Verifiqué que `calificacion` es tipo TEXT en tabla `entregas`
- [ ] Reinicié la aplicación (`npm run dev`)
- [ ] Probé crear una tarea con archivo adjunto
- [ ] Probé calificar con "Entregado/No Entregado"

---

## 🆘 ¿Necesitas ayuda?

Si algo sale mal:
1. Copia el mensaje de error completo
2. No hagas más cambios
3. Comparte el error para ayudarte a solucionarlo

---

**Fecha de creación:** 2025-01-15
**Versión del sistema:** 2.0 - Sistema de tareas mejorado
