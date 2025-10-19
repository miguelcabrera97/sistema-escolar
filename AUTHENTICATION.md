# Sistema de Autenticación y Middleware

Este documento explica cómo funciona el sistema de autenticación implementado en el proyecto.

## Componentes del Sistema

### 1. Middleware (`middleware.ts`)

El middleware se ejecuta en **cada petición** antes de que la página se renderice. Realiza las siguientes funciones:

#### Funciones principales:
- ✅ Verifica si el usuario está autenticado
- ✅ Obtiene el rol del usuario desde la base de datos
- ✅ Protege rutas privadas (redirige a `/login` si no está autenticado)
- ✅ Valida que el usuario tenga el rol correcto para acceder a cada ruta
- ✅ Redirige automáticamente a usuarios autenticados desde `/login` a su dashboard
- ✅ Previene acceso no autorizado a rutas de otros roles

#### Rutas protegidas por rol:
- `/alumno/*` - Solo accesible para usuarios con rol `alumno`
- `/maestro/*` - Solo accesible para usuarios con rol `maestro`
- `/padre/*` - Solo accesible para usuarios con rol `padre`
- `/directivo/*` - Solo accesible para usuarios con rol `directivo`

#### Rutas públicas:
- `/` - Página principal (redirige según rol si está autenticado)
- `/login` - Página de login (redirige al dashboard si ya está autenticado)

### 2. Utilidades de Supabase

#### `lib/supabase.ts` - Para Client Components
Cliente de Supabase para componentes del cliente (Client Components).

```typescript
'use client'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
```

#### `lib/supabase-server.ts` - Para Server Components

**`createServerSupabaseClient()`**
Cliente de Supabase para Server Components y Server Actions.

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function MyServerComponent() {
  const supabase = await createServerSupabaseClient()
  // Usar supabase...
}
```

**`getCurrentUser()`**
Obtiene el usuario actual y su perfil completo.

```typescript
import { getCurrentUser } from '@/lib/supabase-server'

const currentUser = await getCurrentUser()
if (currentUser) {
  console.log(currentUser.user.email)
  console.log(currentUser.profile.role)
}
```

**`checkUserRole(allowedRoles)`**
Verifica si el usuario tiene uno de los roles permitidos.

```typescript
import { checkUserRole } from '@/lib/supabase-server'

const hasAccess = await checkUserRole(['directivo', 'maestro'])
if (!hasAccess) {
  // No tiene acceso
}
```

### 3. Helpers de Autenticación (`lib/auth-helpers.ts`)

#### `requireAuth(allowedRoles?)`
Función para proteger rutas en Server Components. Redirige automáticamente si el usuario no está autenticado o no tiene el rol correcto.

```typescript
import { requireAuth } from '@/lib/auth-helpers'

export default async function AlumnoPage() {
  // Solo permite acceso a usuarios con rol 'alumno'
  const { user, profile } = await requireAuth(['alumno'])

  return <div>Bienvenido {profile.nombre}</div>
}
```

#### `getDashboardPath(role)`
Obtiene la ruta del dashboard según el rol.

```typescript
import { getDashboardPath } from '@/lib/auth-helpers'

const path = getDashboardPath('maestro') // '/maestro'
```

#### `hasRole(userRole, allowedRoles)`
Verifica si un rol está en la lista de roles permitidos.

```typescript
import { hasRole } from '@/lib/auth-helpers'

if (hasRole('directivo', ['directivo', 'maestro'])) {
  // Tiene acceso
}
```

### 4. Componente Protected Layout (`components/protected-layout.tsx`)

Componente wrapper para proteger páginas completas.

```typescript
import { ProtectedLayout } from '@/components/protected-layout'

export default async function AlumnoPage() {
  return (
    <ProtectedLayout allowedRoles={['alumno']}>
      <div>Contenido solo para alumnos</div>
    </ProtectedLayout>
  )
}
```

## Flujo de Autenticación

### 1. Usuario no autenticado intenta acceder a ruta protegida
```
Usuario → /alumno → Middleware → Verifica auth → ❌ No autenticado → Redirect /login
```

### 2. Usuario autenticado accede a su dashboard
```
Usuario → /alumno → Middleware → Verifica auth → ✅ Autenticado → Verifica rol → ✅ Es alumno → Permitir acceso
```

### 3. Usuario intenta acceder a ruta de otro rol
```
Usuario (alumno) → /maestro → Middleware → Verifica auth → ✅ Autenticado → Verifica rol → ❌ No es maestro → Redirect /alumno
```

### 4. Usuario autenticado accede a /login
```
Usuario → /login → Middleware → Verifica auth → ✅ Autenticado → Redirect a dashboard según rol
```

## Ejemplos de Uso

### Proteger una página con Server Component

```typescript
// app/alumno/page.tsx
import { requireAuth } from '@/lib/auth-helpers'

export default async function AlumnoPage() {
  // Automáticamente redirige si no está autenticado o no es alumno
  const { user, profile } = await requireAuth(['alumno'])

  return (
    <div>
      <h1>Bienvenido {profile.nombre}</h1>
      <p>Email: {user.email}</p>
    </div>
  )
}
```

### Proteger una API Route

```typescript
// app/api/admin/route.ts
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'directivo') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Lógica de la API...
  return NextResponse.json({ data: 'Success' })
}
```

### Proteger una Server Action

```typescript
// app/actions/admin-actions.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export async function deleteAlumno(alumnoId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'directivo') {
    throw new Error('No autorizado')
  }

  // Lógica de la acción...
  await supabase.from('alumnos').delete().eq('id', alumnoId)
}
```

## Seguridad

### ✅ Implementado
- Middleware que valida en cada petición
- Verificación de roles desde la base de datos
- Protección de rutas del lado del servidor
- Redirecciones automáticas según rol
- Cookies seguras con Supabase SSR

### ⚠️ Recomendaciones adicionales
1. Implementar Row Level Security (RLS) en Supabase
2. Agregar validación de permisos específicos por acción
3. Implementar rate limiting en API routes
4. Agregar logs de auditoría para acciones sensibles
5. Implementar 2FA para roles administrativos

## Roles Disponibles

| Rol | Dashboard | Permisos |
|-----|-----------|----------|
| `alumno` | `/alumno` | Ver tareas, cursos, calificaciones, pagos propios |
| `maestro` | `/maestro` | Crear tareas, calificar, ver cursos que imparte |
| `padre` | `/padre` | Ver información de hijos, realizar pagos |
| `directivo` | `/directivo` | Acceso completo al sistema, estadísticas globales |

## Troubleshooting

### El middleware no redirige correctamente
- Verificar que `middleware.ts` está en la raíz del proyecto
- Verificar que las variables de entorno están configuradas
- Revisar la configuración del `matcher` en el middleware

### Error "cookies is not a function"
- Asegurarse de usar `await cookies()` en Next.js 15+
- Verificar que estás importando `cookies` desde `next/headers`

### Usuario queda en loop de redirección
- Verificar que el rol en la base de datos coincide con los roles permitidos
- Revisar que la tabla `profiles` tiene el campo `role` correctamente poblado

### Cambios en middleware no se aplican
- Reiniciar el servidor de desarrollo
- Limpiar caché: `rm -rf .next && npm run dev`
