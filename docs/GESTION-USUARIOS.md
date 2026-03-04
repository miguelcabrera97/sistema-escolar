# Gestión de Usuarios - Directivo

Este documento explica cómo usar la funcionalidad de gestión de usuarios (alumnos y maestros) para el rol de directivo.

## Acceso a la Funcionalidad

1. Inicia sesión como directivo
2. En el dashboard principal, haz clic en el botón **"Gestionar Usuarios"**
3. Serás redirigido a `/directivo/usuarios`

## Características Principales

### ✨ Funcionalidades Implementadas

- ✅ **Agregar Alumnos**: Crear nuevos alumnos con toda su información
- ✅ **Agregar Maestros**: Crear nuevos maestros en el sistema
- ✅ **Editar Alumnos**: Modificar información existente de alumnos
- ✅ **Editar Maestros**: Modificar información existente de maestros
- ✅ **Ver Lista de Alumnos**: Tabla con todos los alumnos registrados
- ✅ **Ver Lista de Maestros**: Tabla con todos los maestros registrados
- ✅ **Validación de Permisos**: Solo directivos pueden acceder
- ✅ **Creación Automática de Cuentas**: Se crean automáticamente en Supabase Auth

## Agregar un Nuevo Alumno

### Campos Requeridos (*)

- **Nombre**: Nombre(s) del alumno
- **Apellidos**: Apellidos del alumno
- **Matrícula**: Identificador único (ej: 2024001)
- **Grado**: Seleccionar del 1° al 6° grado
- **Grupo**: Seleccionar grupo A, B, C o D
- **Email**: Correo electrónico para login
- **Contraseña**: Mínimo 6 caracteres

### Campos Opcionales

- **Fecha de Nacimiento**: Fecha de nacimiento del alumno
- **Teléfono**: Número de contacto

### Proceso de Creación

1. Selecciona la pestaña **"Alumnos"**
2. Completa el formulario con la información del alumno
3. Haz clic en **"Crear Alumno"**
4. El sistema:
   - Valida que la matrícula no exista
   - Crea el usuario en Supabase Auth
   - Crea el perfil del usuario
   - Crea el registro del alumno
   - Muestra mensaje de éxito
5. El alumno puede iniciar sesión inmediatamente con su email y contraseña

### Ejemplo de Datos

```
Nombre: Juan
Apellidos: Pérez García
Matrícula: 2024001
Grado: 5° Grado
Grupo: Grupo A
Email: juan.perez@escuela.com
Contraseña: MiPassword123
Teléfono: 555-1234567
Fecha de Nacimiento: 2015-03-15
```

## Agregar un Nuevo Maestro

### Campos Requeridos (*)

- **Nombre**: Nombre(s) del maestro
- **Apellidos**: Apellidos del maestro
- **Email**: Correo electrónico para login
- **Contraseña**: Mínimo 6 caracteres

### Campos Opcionales

- **Especialidad**: Área de especialización (ej: Matemáticas, Español)
- **Teléfono**: Número de contacto

### Proceso de Creación

1. Selecciona la pestaña **"Maestros"**
2. Completa el formulario con la información del maestro
3. Haz clic en **"Crear Maestro"**
4. El sistema:
   - Crea el usuario en Supabase Auth
   - Crea el perfil con rol de maestro
   - Muestra mensaje de éxito
5. El maestro puede iniciar sesión inmediatamente

### Ejemplo de Datos

```
Nombre: María
Apellidos: González López
Email: maria.gonzalez@escuela.com
Contraseña: Profesor2024
Especialidad: Matemáticas
Teléfono: 555-9876543
```

## Visualización de Usuarios

### Lista de Alumnos

La tabla muestra:
- **Matrícula**: Badge con el identificador único
- **Nombre Completo**: Nombre y apellidos
- **Grado**: Número de grado (1° - 6°)
- **Grupo**: Letra del grupo (A, B, C, D)
- **Email**: Correo electrónico
- **Teléfono**: Número de contacto (o "-" si no tiene)

### Lista de Maestros

La tabla muestra:
- **Nombre Completo**: Nombre y apellidos
- **Email**: Correo electrónico
- **Teléfono**: Número de contacto (o "-" si no tiene)
- **Estado**: Badge con estado "Activo"
- **Acciones**: Botón de edición para modificar datos

## Editar Usuarios Existentes

### Editar un Alumno

1. En la lista de alumnos, haz clic en el botón de edición (icono de lápiz) en la fila del alumno
2. Se abrirá un diálogo con la información actual del alumno
3. Modifica los campos que necesites:
   - Nombre y apellidos
   - Matrícula (debe ser única)
   - Grado y grupo
   - Email
   - Teléfono
   - Fecha de nacimiento
4. Haz clic en "Guardar Cambios"
5. El sistema validará los datos y actualizará la información
6. La lista se actualizará automáticamente

**Validaciones en Edición:**
- ✅ La matrícula no puede estar en uso por otro alumno
- ✅ Todos los campos requeridos deben estar completos
- ✅ Solo directivos pueden editar

### Editar un Maestro

1. En la lista de maestros, haz clic en el botón de edición (icono de lápiz) en la fila del maestro
2. Se abrirá un diálogo con la información actual del maestro
3. Modifica los campos que necesites:
   - Nombre y apellidos
   - Email
   - Teléfono
   - Especialidad
4. Haz clic en "Guardar Cambios"
5. El sistema actualizará la información
6. La lista se actualizará automáticamente

**Nota:** No se puede cambiar la contraseña desde el diálogo de edición. Para cambiar contraseñas, se debe usar la funcionalidad de reseteo de contraseña de Supabase.

## Archivos del Sistema

### Server Actions (`app/actions/usuarios-actions.ts`)

Funciones disponibles:

```typescript
// Crear nuevo alumno
crearAlumno(data: CrearAlumnoData): Promise<Result>

// Crear nuevo maestro
crearMaestro(data: CrearMaestroData): Promise<Result>

// Editar alumno existente
editarAlumno(data: EditarAlumnoData): Promise<Result>

// Editar maestro existente
editarMaestro(data: EditarMaestroData): Promise<Result>

// Obtener lista de alumnos
obtenerAlumnos(): Promise<Result>

// Obtener lista de maestros
obtenerMaestros(): Promise<Result>

// Obtener alumno por ID
obtenerAlumnoPorId(alumnoId: string): Promise<Result>

// Obtener maestro por ID
obtenerMaestroPorId(maestroId: string): Promise<Result>
```

### Componentes

- **`FormularioAlumno.tsx`**: Formulario para agregar alumnos
- **`FormularioMaestro.tsx`**: Formulario para agregar maestros
- **`DialogoEditarAlumno.tsx`**: Modal para editar alumnos
- **`DialogoEditarMaestro.tsx`**: Modal para editar maestros
- **`ListaAlumnos.tsx`**: Tabla de alumnos con botones de edición
- **`ListaMaestros.tsx`**: Tabla de maestros con botones de edición

### Página Principal

- **`app/directivo/usuarios/page.tsx`**: Página principal con tabs

## Seguridad

### ✅ Protecciones Implementadas

1. **Middleware**: Solo usuarios autenticados pueden acceder
2. **requireAuth**: Solo directivos pueden ver la página
3. **Server Actions**: Verifican el rol antes de ejecutar
4. **Validaciones**:
   - Matrícula única por alumno
   - Email único por usuario
   - Contraseña mínimo 6 caracteres
   - Campos requeridos validados

### 🔒 Validación de Permisos

```typescript
// En cada Server Action
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single()

if (profile?.role !== 'directivo') {
  return { success: false, error: 'No autorizado' }
}
```

## Manejo de Errores

### Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "La matrícula ya existe" | Matrícula duplicada | Usar una matrícula diferente |
| "Email already registered" | Email duplicado en Auth | Usar un email diferente |
| "Password should be at least 6 characters" | Contraseña muy corta | Usar mínimo 6 caracteres |
| "No autorizado" | Usuario no es directivo | Verificar rol del usuario |

### Mensajes de Error

Los errores se muestran en alerts. En el futuro, considera implementar:
- Toast notifications
- Mensajes inline en el formulario
- Validación en tiempo real

## Flujo de Creación de Usuario

```
1. Directivo completa formulario
   ↓
2. Click en "Crear Alumno/Maestro"
   ↓
3. Validación de campos (cliente)
   ↓
4. Server Action ejecuta validaciones
   ↓
5. Verificar permisos de directivo
   ↓
6. Crear usuario en Supabase Auth
   ↓
7. Crear registro en tabla profiles
   ↓
8. Crear registro en tabla alumnos (si aplica)
   ↓
9. Revalidar páginas
   ↓
10. Mostrar mensaje de éxito
    ↓
11. Limpiar formulario
    ↓
12. Actualizar lista automáticamente
```

## Estructura de Base de Datos

### Tabla: `profiles`
```sql
- id (uuid) - PK, referencia a auth.users
- nombre (text)
- apellidos (text)
- email (text)
- role (text) - 'alumno', 'maestro', 'padre', 'directivo'
- telefono (text) - nullable
```

### Tabla: `alumnos`
```sql
- id (uuid) - PK
- user_id (uuid) - FK a profiles.id
- matricula (text) - UNIQUE
- grado (text)
- grupo (text)
- fecha_nacimiento (date) - nullable
```

## Notas Importantes

⚠️ **Importante sobre Supabase Auth**

El código actual usa `supabase.auth.signUp()` que puede requerir configuración adicional:

1. **Email Confirmation**: Por defecto, Supabase envía email de confirmación
   - Para desarrollo: Desactiva confirmación en Supabase Dashboard
   - Path: Authentication → Providers → Email → Disable "Confirm email"

2. **Service Role**: Para crear usuarios sin confirmar email
   - Necesitas usar el Service Role Key
   - Crear una API route con `createClient` usando service role

### Configuración Recomendada para Desarrollo

En Supabase Dashboard:
1. Ve a Authentication → Providers → Email
2. Desactiva "Confirm email"
3. Desactiva "Secure email change"

## Mejoras Futuras

### 🚀 Próximas Funcionalidades

1. **Editar Usuarios**: Permitir modificar información
2. **Desactivar Usuarios**: Soft delete en lugar de eliminar
3. **Búsqueda y Filtros**: Buscar por matrícula, nombre, grado
4. **Exportar Datos**: CSV/Excel de alumnos y maestros
5. **Importación Masiva**: Subir CSV para crear múltiples usuarios
6. **Fotos de Perfil**: Subir imagen del usuario
7. **Resetear Contraseña**: Funcionalidad para admin
8. **Historial de Cambios**: Auditoría de modificaciones
9. **Asignación de Cursos**: Asignar directamente desde aquí

## Troubleshooting

### El formulario no se limpia después de crear

- Verifica que `onSuccess` se está llamando
- Revisa la consola del navegador para errores

### Error "No autenticado"

- Verifica que el usuario tiene sesión activa
- Revisa que el token de Supabase es válido

### La lista no se actualiza

- El componente usa `useEffect` para cargar al montar
- Refresca la página o implementa revalidación automática

### Errores de permisos RLS

- Verifica las políticas de Supabase
- Asegúrate de tener permisos para insertar en las tablas

## Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Revisa los logs del servidor
3. Verifica la configuración de Supabase
4. Consulta la documentación de autenticación

## Recursos Relacionados

- [AUTHENTICATION.md](./AUTHENTICATION.md) - Sistema de autenticación
- [EJEMPLO-USO-MIDDLEWARE.md](./EJEMPLO-USO-MIDDLEWARE.md) - Ejemplos de uso
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
