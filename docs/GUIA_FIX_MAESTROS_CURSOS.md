# 🔧 Guía: Solucionar "Maestros no ven sus cursos"

## El Problema
Los maestros no pueden ver los cursos que tienen asignados en su dashboard.

## 🔍 Causas Posibles

1. **Políticas RLS incorrectas**: La tabla `cursos` no tiene políticas que permitan a los maestros leer sus cursos
2. **Foreign key incorrecta**: El `maestro_id` no apunta correctamente al `profiles.id`
3. **No hay cursos asignados**: El maestro realmente no tiene cursos asignados
4. **Maestro inactivo**: El maestro está marcado como inactivo en la base de datos

## ✅ Solución

### PASO 1: Ejecutar Script de Diagnóstico y Fix

1. Ve a tu **Dashboard de Supabase**
2. Ve a **SQL Editor**
3. Abre el archivo `FIX_MAESTROS_VER_CURSOS.sql`
4. Copia y pega **todo el contenido** en el editor
5. Haz clic en **Run** (Ctrl+Enter)

### PASO 2: Revisar Resultados del Diagnóstico

El script mostrará varias tablas con información:

#### 📊 Tabla 1: Políticas RLS Actuales
Muestra las políticas que existen actualmente en la tabla `cursos`.

#### 📊 Tabla 2: Estado de RLS
Muestra si Row Level Security está habilitado (`rowsecurity = true`).

#### 📊 Tabla 3: Estructura de la Tabla
Muestra las columnas de la tabla `cursos`, incluyendo `maestro_id`.

#### 📊 Tabla 4: Foreign Keys
Muestra que `maestro_id` apunta a `profiles(id)`.

#### 📊 Tabla 5: Maestros en el Sistema
```
total_maestros | maestros_activos
---------------|------------------
      5        |        4
```
- Si `total_maestros = 0`: No hay maestros registrados
- Si `maestros_activos < total_maestros`: Hay maestros inactivos

#### 📊 Tabla 6: Cursos con Maestros
```
id   | nombre          | grado | grupo | maestro_id | maestro_nombre | maestro_email
-----|-----------------|-------|-------|------------|----------------|---------------
uuid | Matemáticas     | 1°    | A     | uuid       | Juan           | juan@...
uuid | Español         | 2°    | B     | NULL       | NULL           | NULL
```

**¿Qué buscar?**
- ✅ `maestro_nombre` y `maestro_email` tienen valores = OK
- ❌ `maestro_id = NULL` = Curso sin maestro asignado
- ❌ `maestro_nombre = NULL` = Maestro no existe en profiles

#### 📊 Tabla 7: Maestros sin Cursos
```
nombre | apellidos | email        | activo | num_cursos
-------|-----------|--------------|--------|------------
Juan   | Pérez     | juan@...     | true   | 3
María  | García    | maria@...    | true   | 0
```
- `num_cursos = 0` significa que ese maestro NO tiene cursos asignados

### PASO 3: Aplicar el Fix

El script automáticamente:
1. ✅ Elimina políticas RLS antiguas o incorrectas
2. ✅ Crea 7 políticas nuevas y correctas:
   - Maestros pueden ver sus cursos
   - Directivos tienen acceso completo (CRUD)
   - Alumnos ven cursos donde están inscritos
   - Auxiliares ven cursos asignados

### PASO 4: Verificación Final

Al final del script verás:
```
policyname                                    | cmd    | permissive
---------------------------------------------|--------|------------
Alumnos pueden ver cursos donde están...     | SELECT | PERMISSIVE
Auxiliares pueden ver cursos asignados        | SELECT | PERMISSIVE
Directivos pueden actualizar cursos           | UPDATE | PERMISSIVE
Directivos pueden crear cursos                | INSERT | PERMISSIVE
Directivos pueden eliminar cursos             | DELETE | PERMISSIVE
Directivos pueden ver todos los cursos        | SELECT | PERMISSIVE
Maestros pueden ver sus cursos                | SELECT | PERMISSIVE
```

✅ **Debes ver las 7 políticas listadas**

### PASO 5: Probar el Fix

1. **Cierra sesión** en tu aplicación
2. **Inicia sesión como maestro**
3. Ve al dashboard del maestro
4. Deberías ver:
   - Tus cursos en la sección "Mis Cursos"
   - El contador de cursos actualizado
   - Botón "Ver" en cada curso

## 🐛 Solución de Problemas

### Problema 1: El maestro aún no ve cursos

**Causa**: El maestro no tiene cursos asignados

**Solución**:
1. Inicia sesión como **Directivo**
2. Ve a **Gestión de Cursos**
3. Haz clic en **Crear Nuevo Curso**
4. Selecciona al maestro en el campo "Maestro"
5. Completa los datos y guarda

### Problema 2: Error "No autorizado" al ver cursos

**Causa**: Las políticas RLS no se aplicaron correctamente

**Solución**:
1. Re-ejecuta el script `FIX_MAESTROS_VER_CURSOS.sql` completo
2. Verifica que las 7 políticas aparezcan en la verificación final
3. Cierra sesión y vuelve a iniciar sesión

### Problema 3: Curso sin maestro (maestro_id = NULL)

**Causa**: El curso se creó sin asignar un maestro

**Solución SQL**:
```sql
-- Actualizar curso para asignar un maestro
UPDATE cursos
SET maestro_id = 'PROFILE_ID_DEL_MAESTRO'
WHERE id = 'CURSO_ID';
```

O desde la aplicación:
1. Como Directivo, ve a Gestión de Cursos
2. Edita el curso
3. Asigna un maestro
4. Guarda cambios

### Problema 4: Maestro existe pero no aparece en profiles

**Causa**: El usuario existe en `auth.users` pero no en `profiles`

**Solución SQL**:
```sql
-- Verificar si falta el registro en profiles
SELECT
  au.id,
  au.email,
  p.id as profile_id
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email = 'email_del_maestro@ejemplo.com';

-- Si profile_id es NULL, crear el profile manualmente
-- (Esto normalmente se hace automáticamente con un trigger)
```

### Problema 5: Dashboard muestra "0 Cursos" pero el SQL muestra cursos

**Causa**: Problema de caché o sesión

**Solución**:
1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Application** > **Storage**
3. Clic en **Clear site data**
4. Cierra sesión
5. Cierra el navegador completamente
6. Abre de nuevo e inicia sesión

## 📋 Checklist de Verificación

Antes de dar por resuelto el problema:

- [ ] El script SQL se ejecutó sin errores
- [ ] Las 7 políticas RLS aparecen en la verificación final
- [ ] El maestro tiene al menos 1 curso asignado (verificado en SQL)
- [ ] El maestro está activo (`activo = true`)
- [ ] El `maestro_id` del curso coincide con el `profiles.id` del maestro
- [ ] Al iniciar sesión como maestro, aparecen los cursos

## 🔬 Consultas SQL Útiles para Diagnóstico

### Ver cursos de un maestro específico
```sql
SELECT
  c.*,
  p.nombre,
  p.apellidos,
  p.email
FROM cursos c
INNER JOIN profiles p ON c.maestro_id = p.id
WHERE p.email = 'email_del_maestro@ejemplo.com';
```

### Ver todos los maestros y sus cursos
```sql
SELECT
  p.nombre,
  p.apellidos,
  p.email,
  p.activo,
  COUNT(c.id) as num_cursos,
  STRING_AGG(c.nombre, ', ') as cursos
FROM profiles p
LEFT JOIN cursos c ON c.maestro_id = p.id
WHERE p.role = 'maestro'
GROUP BY p.id, p.nombre, p.apellidos, p.email, p.activo
ORDER BY p.nombre;
```

### Verificar que auth.uid() funciona para el maestro actual
```sql
-- Ejecutar esto DESPUÉS de iniciar sesión como maestro en la app
-- Luego ejecutar en SQL Editor (estando logueado en Supabase Dashboard)
SELECT
  auth.uid() as mi_user_id,
  p.nombre,
  p.apellidos,
  p.role
FROM profiles p
WHERE p.id = auth.uid();
```

## 📞 ¿Aún no Funciona?

Si después de seguir todos los pasos el problema persiste:

1. **Ejecuta esta consulta de diagnóstico completo**:
```sql
-- Diagnóstico completo
SELECT
  'Total cursos' as item,
  COUNT(*)::text as valor
FROM cursos

UNION ALL

SELECT
  'Total maestros',
  COUNT(*)::text
FROM profiles
WHERE role = 'maestro'

UNION ALL

SELECT
  'Políticas RLS en cursos',
  COUNT(*)::text
FROM pg_policies
WHERE tablename = 'cursos'

UNION ALL

SELECT
  'Cursos sin maestro',
  COUNT(*)::text
FROM cursos
WHERE maestro_id IS NULL

UNION ALL

SELECT
  'Maestros sin cursos',
  COUNT(*)::text
FROM profiles p
LEFT JOIN cursos c ON c.maestro_id = p.id
WHERE p.role = 'maestro'
GROUP BY p.id
HAVING COUNT(c.id) = 0;
```

2. **Captura de pantalla**:
   - Dashboard del maestro mostrando "0 cursos"
   - Resultado del diagnóstico completo
   - Consola del navegador (F12) con errores si los hay

---

**Última actualización**: Enero 2025
