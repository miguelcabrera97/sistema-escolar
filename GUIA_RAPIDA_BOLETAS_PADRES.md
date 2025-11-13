# 🚀 Guía Rápida: Solucionar Acceso de Padres a Boletas

## El Problema
Los padres no pueden ver las boletas que el directivo sube para sus hijos.

## ✅ Solución en 3 Pasos

### PASO 1: Configurar Políticas RLS en Supabase

1. Ve a tu Dashboard de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Copia y pega el contenido completo del archivo `APLICAR_FIX_BOLETAS_PADRES.sql`
5. Haz clic en **Run** (o presiona Ctrl+Enter)
6. Revisa los resultados de las consultas de verificación

**¿Qué hace este script?**
- Elimina políticas antiguas que pueden estar bloqueando el acceso
- Crea 3 políticas nuevas:
  - Padres pueden ver boletas de sus hijos
  - Directivos tienen acceso completo
  - Alumnos pueden ver sus propias boletas

---

### PASO 2: Hacer Público el Bucket de Storage

1. En tu Dashboard de Supabase, ve a **Storage** en el menú lateral
2. Busca el bucket llamado **`boletas`**
   - ❌ Si NO existe: Créalo haciendo clic en "New bucket"
     - Nombre: `boletas`
     - ✅ Marca "Public bucket"
     - Clic en "Create bucket"

   - ✅ Si YA existe:
     - Haz clic en el bucket `boletas`
     - Haz clic en **Settings** (⚙️ arriba a la derecha)
     - Marca **"Public bucket"** ✅
     - Clic en "Save"

**¿Por qué esto es importante?**
- Las boletas son archivos PDF almacenados en el bucket
- Si el bucket no es público, las URLs de los PDFs no serán accesibles
- Hacer el bucket público permite que los PDFs se puedan descargar

---

### PASO 3: Verificar Relaciones Padre-Alumno

Ejecuta esta consulta en el **SQL Editor**:

```sql
SELECT
  prof.email as padre_email,
  prof.nombre as padre_nombre,
  prof.apellidos as padre_apellidos,
  prof_alumno.nombre as alumno_nombre,
  prof_alumno.apellidos as alumno_apellidos,
  a.matricula as alumno_matricula
FROM padres p
INNER JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN padre_alumno pa ON p.id = pa.padre_id
LEFT JOIN alumnos a ON pa.alumno_id = a.id
LEFT JOIN profiles prof_alumno ON a.user_id = prof_alumno.id
WHERE prof.role = 'padre'
ORDER BY padre_nombre;
```

**Resultado esperado:**
- Debes ver cada padre con su(s) hijo(s) asignado(s)
- Si `alumno_nombre` es NULL, significa que ese padre NO tiene hijos asignados

**Si un padre no tiene hijos asignados:**
1. Ve a tu aplicación como **Directivo**
2. Ve a **Usuarios** > Tab **Alumnos**
3. Haz clic en **Editar** (✏️) en el alumno
4. En el campo **"Padre/Tutor"**, selecciona el padre correcto
5. Guarda los cambios

---

## 🧪 Probar que Funciona

1. **Cierra sesión** en tu aplicación
2. **Inicia sesión como padre** (ejemplo: email del padre / contraseña)
3. Ve a **Calificaciones** en el menú
4. Deberías ver:
   - Un selector con tus hijos
   - Las boletas disponibles para cada hijo
   - El botón "Descargar PDF" funcional

---

## 🐛 Solución de Problemas

### Problema: El padre ve "No hay boletas disponibles aún"

**Causas posibles:**
1. No hay boletas subidas para ese alumno
2. El padre no está relacionado con el alumno
3. Las políticas RLS no se aplicaron correctamente

**Solución:**
```sql
-- Verificar si hay boletas para ese alumno
SELECT b.*, a.matricula, prof.nombre, prof.apellidos
FROM boletas b
INNER JOIN alumnos a ON b.alumno_id = a.id
INNER JOIN profiles prof ON a.user_id = prof.id
WHERE a.matricula = 'A01-SEC-2025'; -- Cambia por la matrícula del alumno
```

### Problema: Error 403 o "No autorizado"

**Causas posibles:**
- Las políticas RLS no están bien configuradas
- El bucket no es público

**Solución:**
1. Re-ejecuta el script `APLICAR_FIX_BOLETAS_PADRES.sql` completo
2. Verifica que el bucket `boletas` esté marcado como público
3. Cierra sesión y vuelve a iniciar sesión como padre

### Problema: No se puede descargar el PDF

**Causas posibles:**
- El bucket no es público
- El archivo no existe en Storage

**Solución:**
1. Ve a Storage > boletas en Supabase
2. Verifica que los archivos PDF estén ahí
3. Marca el bucket como público
4. Intenta descargar de nuevo

---

## 📋 Checklist Final

Antes de dar por resuelto el problema, verifica:

- [ ] El script SQL se ejecutó sin errores
- [ ] El bucket `boletas` existe y está marcado como **público**
- [ ] Los padres están relacionados con sus hijos en `padre_alumno`
- [ ] Existen boletas para los alumnos en la tabla `boletas`
- [ ] Al probar como padre, aparecen las boletas y se pueden descargar

---

## 📞 ¿Aún no funciona?

Si después de seguir todos los pasos el problema persiste:

1. Abre la **Consola del Navegador** (F12) cuando estés como padre
2. Ve a la pestaña **Console**
3. Ve a **Calificaciones** y busca errores en rojo
4. Copia el error y compártelo para ayudarte mejor

O ejecuta esta consulta de diagnóstico:

```sql
-- Diagnóstico completo
SELECT
  'Políticas RLS' as tipo,
  COUNT(*) as cantidad
FROM pg_policies
WHERE tablename = 'boletas'

UNION ALL

SELECT
  'Padres registrados' as tipo,
  COUNT(*) as cantidad
FROM padres

UNION ALL

SELECT
  'Relaciones padre-alumno' as tipo,
  COUNT(*) as cantidad
FROM padre_alumno

UNION ALL

SELECT
  'Boletas subidas' as tipo,
  COUNT(*) as cantidad
FROM boletas;
```

---

**Última actualización**: Enero 2025
