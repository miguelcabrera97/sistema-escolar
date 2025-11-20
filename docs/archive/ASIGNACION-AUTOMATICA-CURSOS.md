# Asignación Automática de Cursos al Auxiliar de Calificaciones

## Descripción

El sistema implementa una **asignación automática** de cursos a todos los usuarios con rol "Auxiliar de Calificaciones". Cuando se crea un nuevo curso, automáticamente se asigna a todos los auxiliares activos en el sistema, garantizando su acceso universal a las herramientas de calificación.

## ¿Cómo Funciona?

### 1. Tabla de Relación: `curso_auxiliares`

Se creó una tabla especial que relaciona cursos con auxiliares:

```sql
CREATE TABLE curso_auxiliares (
  id UUID PRIMARY KEY,
  curso_id UUID REFERENCES cursos(id) ON DELETE CASCADE,
  auxiliar_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP,
  UNIQUE(curso_id, auxiliar_id)
);
```

**Características:**
- Evita duplicados con restricción UNIQUE
- Se elimina automáticamente si se borra el curso (CASCADE)
- Índices optimizados para consultas rápidas

### 2. Trigger Automático en Base de Datos

Se implementó un **trigger de PostgreSQL** que se ejecuta automáticamente cada vez que se crea un curso:

```sql
CREATE TRIGGER trigger_asignar_auxiliares_a_curso
  AFTER INSERT ON cursos
  FOR EACH ROW
  EXECUTE FUNCTION asignar_auxiliares_a_curso();
```

**La función hace lo siguiente:**
1. Detecta cuando se inserta un nuevo curso
2. Busca todos los usuarios con rol `'auxiliar_calificaciones'` y estado `activo = true`
3. Crea una relación en `curso_auxiliares` por cada auxiliar encontrado
4. Todo esto sucede automáticamente en la base de datos

### 3. Ventajas de Usar Trigger vs Código

| Aspecto | Trigger (Implementado) | Código en App |
|---------|------------------------|---------------|
| Ejecución | Siempre, incluso desde SQL directo | Solo cuando se usa la función específica |
| Consistencia | Garantizada en BD | Depende del código |
| Performance | Muy rápido (en BD) | Red + procesamiento |
| Mantenimiento | Centralizado | Múltiples lugares |
| Confiabilidad | 100% automático | Puede olvidarse |

## Flujo Completo

### Creación de Curso

```
1. Directivo crea curso → /directivo/cursos
2. Se ejecuta crearCurso() → cursos-actions.ts
3. INSERT INTO cursos → Base de datos
4. TRIGGER se activa automáticamente
5. Función busca auxiliares activos
6. INSERT INTO curso_auxiliares (por cada auxiliar)
7. ✅ Curso asignado a todos los auxiliares
```

### Dashboard del Auxiliar

```
1. Auxiliar inicia sesión → /auxiliar
2. Sistema carga cursos asignados
3. Query: curso_auxiliares WHERE auxiliar_id = user.id
4. Muestra lista de cursos con maestro asignado
5. Botón "Ver Tareas" para cada curso
```

## Componentes Modificados

### Base de Datos

**Nuevos archivos SQL:**
- `CREATE_CURSO_AUXILIARES.sql` - Migración completa

**Elementos creados:**
- Tabla `curso_auxiliares`
- Función `asignar_auxiliares_a_curso()`
- Trigger `trigger_asignar_auxiliares_a_curso`
- Índices de optimización

### Código de Aplicación

**Archivos modificados:**

1. **`app/actions/cursos-actions.ts`**
   - Nueva función: `obtenerCursosAuxiliar(auxiliarId)`
   - Query con JOIN a tabla curso_auxiliares

2. **`app/auxiliar/page.tsx`**
   - Agrega estado para cursos: `const [cursos, setCursos] = useState([])`
   - Carga cursos asignados en `obtenerDatos()`
   - Muestra card de "Mis Cursos Asignados"
   - Estadística de cursos en dashboard
   - Navegación directa a tareas por curso

## Consultas SQL Útiles

### Ver todas las asignaciones
```sql
SELECT
  c.nombre as curso,
  c.grado,
  c.grupo,
  p.nombre || ' ' || p.apellidos as auxiliar,
  ca.created_at
FROM curso_auxiliares ca
JOIN cursos c ON ca.curso_id = c.id
JOIN profiles p ON ca.auxiliar_id = p.id
ORDER BY ca.created_at DESC;
```

### Ver cursos de un auxiliar específico
```sql
SELECT c.*
FROM curso_auxiliares ca
JOIN cursos c ON ca.curso_id = c.id
WHERE ca.auxiliar_id = 'uuid-del-auxiliar';
```

### Contar asignaciones por curso
```sql
SELECT
  c.nombre,
  COUNT(ca.id) as num_auxiliares
FROM cursos c
LEFT JOIN curso_auxiliares ca ON c.id = ca.curso_id
GROUP BY c.id, c.nombre
ORDER BY num_auxiliares DESC;
```

## Asignación Retroactiva

Al ejecutar la migración, se asignan automáticamente todos los cursos existentes a todos los auxiliares activos:

```sql
INSERT INTO curso_auxiliares (curso_id, auxiliar_id)
SELECT c.id, p.id
FROM cursos c
CROSS JOIN profiles p
WHERE p.role = 'auxiliar_calificaciones'
  AND p.activo = true
ON CONFLICT (curso_id, auxiliar_id) DO NOTHING;
```

Esto garantiza que los auxiliares tengan acceso inmediato a todos los cursos, no solo a los nuevos.

## Casos de Uso

### Caso 1: Nuevo Auxiliar

1. Directivo crea usuario auxiliar
2. Auxiliar inicia sesión
3. **Ve automáticamente todos los cursos existentes**
4. Puede calificar tareas de todos ellos

**Nota:** Los cursos existentes se asignan mediante el script de asignación retroactiva.

### Caso 2: Nuevo Curso

1. Directivo crea curso "Matemáticas 3°A"
2. Trigger se ejecuta automáticamente
3. **Todos los auxiliares activos reciben el curso**
4. Auxiliares pueden verlo inmediatamente en su dashboard

### Caso 3: Auxiliar Desactivado

1. Directivo desactiva auxiliar
2. Auxiliar no recibe nuevos cursos (filtro `activo = true`)
3. Asignaciones existentes permanecen en BD
4. Si se reactiva, comienza a recibir nuevos cursos

## Mantenimiento

### Reactivar asignación de cursos existentes

Si un auxiliar fue desactivado y reactivado:

```sql
-- Asignar todos los cursos al auxiliar reactivado
INSERT INTO curso_auxiliares (curso_id, auxiliar_id)
SELECT c.id, 'uuid-del-auxiliar'
FROM cursos c
WHERE NOT EXISTS (
  SELECT 1 FROM curso_auxiliares ca
  WHERE ca.curso_id = c.id AND ca.auxiliar_id = 'uuid-del-auxiliar'
);
```

### Verificar integridad

```sql
-- Ver auxiliares sin cursos asignados
SELECT p.id, p.nombre, p.apellidos
FROM profiles p
WHERE p.role = 'auxiliar_calificaciones'
  AND p.activo = true
  AND NOT EXISTS (
    SELECT 1 FROM curso_auxiliares ca WHERE ca.auxiliar_id = p.id
  );
```

## Diferencias con Maestros

| Aspecto | Maestro | Auxiliar |
|---------|---------|----------|
| Asignación | Manual, 1 por curso | Automática, todos |
| Campo en tabla cursos | `maestro_id` | No aplica |
| Tabla de relación | No usa | `curso_auxiliares` |
| Puede cambiar | Sí, editable | Sí, siempre todos |
| Ver cursos | Solo asignados | Todos |

## Beneficios del Sistema

1. **Automatización Total**
   - No requiere acción manual
   - Sin posibilidad de olvidos
   - Consistencia garantizada

2. **Escalabilidad**
   - Funciona con 1 o 100 auxiliares
   - Sin impacto en performance
   - Queries optimizadas

3. **Mantenibilidad**
   - Lógica centralizada en BD
   - Menos código en aplicación
   - Fácil auditoría

4. **Flexibilidad**
   - Fácil agregar/quitar auxiliares
   - Control por estado activo/inactivo
   - Asignación retroactiva disponible

## Troubleshooting

### Problema: Auxiliar no ve cursos

**Causas posibles:**
1. Usuario no tiene rol `'auxiliar_calificaciones'`
2. Usuario está inactivo (`activo = false`)
3. Trigger no se ejecutó correctamente
4. Tabla `curso_auxiliares` no existe

**Solución:**
```sql
-- Verificar rol
SELECT id, role, activo FROM profiles WHERE id = 'uuid-auxiliar';

-- Asignar manualmente cursos
INSERT INTO curso_auxiliares (curso_id, auxiliar_id)
SELECT c.id, 'uuid-auxiliar'
FROM cursos c
ON CONFLICT DO NOTHING;
```

### Problema: Trigger no funciona

**Verificar trigger:**
```sql
-- Ver si el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'trigger_asignar_auxiliares_a_curso';

-- Re-crear trigger
DROP TRIGGER IF EXISTS trigger_asignar_auxiliares_a_curso ON cursos;
CREATE TRIGGER trigger_asignar_auxiliares_a_curso
  AFTER INSERT ON cursos
  FOR EACH ROW
  EXECUTE FUNCTION asignar_auxiliares_a_curso();
```

### Problema: Duplicados en curso_auxiliares

**No debería ocurrir** gracias a la restricción UNIQUE, pero si sucede:

```sql
-- Eliminar duplicados
DELETE FROM curso_auxiliares a
USING curso_auxiliares b
WHERE a.id > b.id
  AND a.curso_id = b.curso_id
  AND a.auxiliar_id = b.auxiliar_id;
```

## Instrucciones de Migración

### Para Ejecutar en Supabase

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard
2. Abre el **SQL Editor**
3. Copia el contenido de `CREATE_CURSO_AUXILIARES.sql`
4. Haz clic en **Run**
5. Verifica la ejecución:

```sql
-- Debe retornar los registros creados
SELECT COUNT(*) FROM curso_auxiliares;
```

### Rollback (Si es necesario)

```sql
-- Eliminar trigger
DROP TRIGGER IF EXISTS trigger_asignar_auxiliares_a_curso ON cursos;

-- Eliminar función
DROP FUNCTION IF EXISTS asignar_auxiliares_a_curso();

-- Eliminar tabla
DROP TABLE IF EXISTS curso_auxiliares;
```

## Notas de Seguridad

- ✅ Trigger se ejecuta con permisos del owner de la tabla
- ✅ No requiere permisos especiales en el usuario
- ✅ Restricción UNIQUE previene duplicados
- ✅ CASCADE asegura limpieza al borrar
- ✅ Solo afecta auxiliares activos

## Futuras Mejoras

Posibles extensiones del sistema:

1. **Notificaciones**
   - Avisar a auxiliares cuando se crea un curso nuevo

2. **Límites de Asignación**
   - Permitir configurar máximo de cursos por auxiliar

3. **Asignación Selectiva**
   - Por grado, materia o criterios específicos

4. **Auditoría**
   - Log de cuándo se asignó cada curso

5. **Dashboard de Admin**
   - Ver matriz de asignaciones curso-auxiliar

---

**Versión:** 1.0
**Fecha de Creación:** Noviembre 2025
**Última Actualización:** Noviembre 2025
