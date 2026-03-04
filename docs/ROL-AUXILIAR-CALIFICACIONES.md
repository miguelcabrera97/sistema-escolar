# Rol: Auxiliar de Calificaciones (Maestro Auxiliar/Directivo)

## Descripción

El rol **Auxiliar de Calificaciones** (`auxiliar_calificaciones`) es un rol especial diseñado para personal que necesita acceso completo a la funcionalidad de calificación de tareas en todo el sistema, pero con restricciones de seguridad y privacidad.

## Permisos y Restricciones

### ✅ Permisos Autorizados

1. **Acceso Total a Calificaciones**
   - Puede ver TODAS las tareas del sistema (no solo las asignadas)
   - Puede calificar entregas de cualquier curso
   - Puede editar calificaciones existentes
   - Puede agregar retroalimentación a las entregas

2. **Visualización de Estadísticas**
   - Dashboard con estadísticas generales de entregas
   - Contadores de tareas pendientes, entregadas y calificadas
   - Promedio general de calificaciones

### ❌ Restricciones de Seguridad

1. **Sin Acceso a Pagos**
   - No puede ver el módulo de pagos
   - No puede crear, editar o gestionar pagos
   - Redirigido automáticamente si intenta acceder

2. **Información Personal Limitada**
   - **Solo puede ver:** Nombre y apellidos de alumnos
   - **NO puede ver:**
     - Matrícula
     - CURP
     - Teléfonos
     - Emails
     - Direcciones
     - Información médica
     - Información del tutor
     - Teléfonos de emergencia

3. **Sin Acceso a Otros Módulos**
   - No puede gestionar usuarios
   - No puede crear/editar cursos
   - No puede inscribir o desinscribir alumnos

## Rutas del Sistema

### Dashboard
- **Ruta:** `/auxiliar`
- **Descripción:** Panel principal con estadísticas y listado de tareas

### Calificar Entregas
- **Ruta:** `/auxiliar/tarea/[id]/entregas`
- **Descripción:** Vista de entregas de una tarea específica con formulario de calificación

## Cómo Crear un Usuario Auxiliar

1. Iniciar sesión como **Directivo**
2. Ir a **Gestión de Usuarios** (`/directivo/usuarios`)
3. Seleccionar la pestaña **Auxiliares**
4. Completar el formulario:
   - Nombre *
   - Apellidos *
   - Email *
   - Contraseña * (mínimo 6 caracteres)
   - Teléfono (opcional)
5. Hacer clic en **Crear Auxiliar**

## Credenciales de Prueba

Para probar el rol, puedes crear un usuario con los siguientes datos de ejemplo:

```
Nombre: María
Apellidos: González Pérez
Email: maria.gonzalez@escuela.com
Password: 123456
```

## Arquitectura Técnica

### Tipo de Rol
```typescript
export type UserRole = 'alumno' | 'maestro' | 'padre' | 'directivo' | 'auxiliar_calificaciones'
```

### Rutas en Middleware
```typescript
const roleRoutes: Record<string, string[]> = {
  // ...
  auxiliar_calificaciones: ['/auxiliar'],
}
```

### Dashboard Path
```typescript
auxiliar_calificaciones: '/auxiliar'
```

## Archivos Creados/Modificados

### Archivos Nuevos
- `app/auxiliar/page.tsx` - Dashboard principal
- `app/auxiliar/tarea/[id]/entregas/page.tsx` - Vista de calificación
- `app/directivo/usuarios/FormularioAuxiliar.tsx` - Formulario de creación
- `app/directivo/usuarios/ListaAuxiliares.tsx` - Lista de auxiliares

### Archivos Modificados
- `lib/auth-helpers.ts` - Agregado tipo de rol y redirects
- `middleware.ts` - Agregado rutas del auxiliar
- `app/actions/usuarios-actions.ts` - Agregadas funciones para crear y listar auxiliares
- `app/directivo/usuarios/page.tsx` - Agregada pestaña de auxiliares

## Queries de Base de Datos

### Query para Entregas (Sin Información Personal)
```typescript
// Auxiliar - Solo nombre y apellidos
.select('id, status, calificacion, retroalimentacion, fecha_entrega, archivo_url, comentarios, alumnos (id, profiles (nombre, apellidos))')

// Maestro - Con toda la información
.select('*, alumnos (id, matricula, profiles (nombre, apellidos, email, telefono))')
```

## Flujo de Trabajo

1. **Login** → Auxiliar inicia sesión con email/password
2. **Dashboard** → Ve estadísticas generales y lista de tareas
3. **Seleccionar Tarea** → Hace clic en "Ver Entregas"
4. **Calificar** → Ve entregas con solo nombre del alumno
5. **Guardar** → Calificación se guarda en la base de datos
6. **Logout** → Cierra sesión

## Seguridad

### Validación en Servidor
```typescript
// Las server actions verifican el rol antes de ejecutar
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'directivo') {
  return { success: false, error: 'No autorizado' }
}
```

### Protección de Rutas
El middleware verifica automáticamente:
- Si el usuario está autenticado
- Si el usuario tiene el rol correcto para la ruta
- Redirige a su dashboard si intenta acceder a rutas no autorizadas

## Casos de Uso

### Caso 1: Director Académico
Un director académico que necesita revisar y calificar tareas de todos los grados sin tener acceso a información financiera o datos personales sensibles.

### Caso 2: Coordinador de Calificaciones
Personal administrativo que se encarga de verificar que todas las tareas estén calificadas en tiempo y forma.

### Caso 3: Maestro Suplente
Un maestro que cubre ausencias de otros maestros y necesita calificar tareas de múltiples cursos temporalmente.

## Notas Importantes

⚠️ **Privacidad**: Este rol fue diseñado específicamente para cumplir con políticas de privacidad, limitando el acceso a datos personales y financieros.

⚠️ **Auditoría**: Todas las calificaciones realizadas por auxiliares quedan registradas en la base de datos con el ID del usuario que las realizó.

⚠️ **Restricciones**: El auxiliar no puede crear tareas, solo calificar las existentes.

## Troubleshooting

### El auxiliar no puede ver tareas
- Verificar que existan tareas creadas en el sistema
- Verificar que el rol en `profiles` sea exactamente `'auxiliar_calificaciones'`

### Error al crear auxiliar
- Verificar que el email no esté ya registrado
- Verificar que el usuario creador sea directivo
- Revisar logs del navegador para errores específicos

### El auxiliar puede ver información que no debería
- Verificar que la query no incluya campos adicionales
- Revisar el archivo `app/auxiliar/tarea/[id]/entregas/page.tsx`
- Asegurar que solo se seleccionen `nombre` y `apellidos`

## Soporte

Para reportar problemas o sugerencias sobre este rol, contacta al administrador del sistema.

---

**Versión:** 1.0
**Fecha de Creación:** Noviembre 2025
**Última Actualización:** Noviembre 2025
