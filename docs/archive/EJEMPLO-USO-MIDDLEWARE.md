# Ejemplos de Uso del Middleware de Autenticación

## 1. Ejemplo: Proteger una página de alumno

```typescript
// app/alumno/calificaciones/page.tsx
import { requireAuth } from '@/lib/auth-helpers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CalificacionesPage() {
  // ✅ Solo permite acceso a usuarios con rol 'alumno'
  // Si no está autenticado → redirige a /login
  // Si es otro rol (maestro, padre, directivo) → redirige a su dashboard
  const { user, profile } = await requireAuth(['alumno'])

  return (
    <div className="p-8">
      <h1>Calificaciones de {profile.nombre}</h1>
      <p>Email: {user.email}</p>
      {/* Tu contenido aquí */}
    </div>
  )
}
```

## 2. Ejemplo: Página accesible por múltiples roles

```typescript
// app/reportes/page.tsx
import { requireAuth } from '@/lib/auth-helpers'

export default async function ReportesPage() {
  // ✅ Permite acceso a directivos y maestros
  const { user, profile } = await requireAuth(['directivo', 'maestro'])

  return (
    <div className="p-8">
      <h1>Reportes</h1>
      {/* Renderizar contenido según el rol */}
      {profile.role === 'directivo' && (
        <div>Contenido exclusivo para directivos</div>
      )}
      {profile.role === 'maestro' && (
        <div>Contenido exclusivo para maestros</div>
      )}
    </div>
  )
}
```

## 3. Ejemplo: Proteger con ProtectedLayout

```typescript
// app/admin/configuracion/page.tsx
import { ProtectedLayout } from '@/components/protected-layout'

export default async function ConfiguracionPage() {
  return (
    <ProtectedLayout allowedRoles={['directivo']}>
      <div className="p-8">
        <h1>Configuración del Sistema</h1>
        <p>Solo directivos pueden ver esto</p>
      </div>
    </ProtectedLayout>
  )
}
```

## 4. Ejemplo: API Route protegida

```typescript
// app/api/admin/usuarios/route.ts
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verificar autenticación
  if (!user) {
    return NextResponse.json(
      { error: 'No autenticado' },
      { status: 401 }
    )
  }

  // Obtener rol del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Verificar autorización
  if (profile?.role !== 'directivo') {
    return NextResponse.json(
      { error: 'No autorizado. Solo directivos pueden acceder' },
      { status: 403 }
    )
  }

  // Lógica de la API
  const { data: usuarios } = await supabase
    .from('profiles')
    .select('*')

  return NextResponse.json({ usuarios })
}
```

## 5. Ejemplo: Server Action protegida

```typescript
// app/actions/calificaciones-actions.ts
'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function calificarTarea(
  entregaId: string,
  calificacion: number,
  comentarios: string
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  // Verificar que sea maestro
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'maestro') {
    throw new Error('Solo los maestros pueden calificar tareas')
  }

  // Actualizar calificación
  const { error } = await supabase
    .from('entregas')
    .update({
      calificacion,
      comentarios,
      status: 'calificada',
      fecha_calificacion: new Date().toISOString()
    })
    .eq('id', entregaId)

  if (error) throw error

  // Revalidar la página para mostrar cambios
  revalidatePath('/maestro/entregas')

  return { success: true }
}
```

## 6. Ejemplo: Componente del cliente que hace fetch a API protegida

```typescript
// app/directivo/components/UsuariosTable.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export function UsuariosTable() {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function cargarUsuarios() {
      try {
        // Esta llamada pasará por el middleware
        // El middleware verificará que el usuario tenga rol 'directivo'
        const response = await fetch('/api/admin/usuarios')

        if (!response.ok) {
          throw new Error('Error al cargar usuarios')
        }

        const data = await response.json()
        setUsuarios(data.usuarios)
      } catch (error) {
        console.error('Error:', error)
        alert('No tienes permisos para ver esta información')
      } finally {
        setLoading(false)
      }
    }

    cargarUsuarios()
  }, [])

  if (loading) return <div>Cargando...</div>

  return (
    <table>
      {/* Renderizar usuarios */}
    </table>
  )
}
```

## 7. Ejemplo: Verificación condicional de permisos

```typescript
// app/maestro/cursos/[id]/page.tsx
import { requireAuth } from '@/lib/auth-helpers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CursoDetallePage({ params }: Props) {
  const { id } = await params
  const { user, profile } = await requireAuth(['maestro', 'directivo'])

  const supabase = await createServerSupabaseClient()

  // Si es maestro, verificar que sea SU curso
  if (profile.role === 'maestro') {
    const { data: curso } = await supabase
      .from('cursos')
      .select('maestro_id')
      .eq('id', id)
      .single()

    // Si el curso no es del maestro, no tiene acceso
    if (curso?.maestro_id !== user.id) {
      redirect('/maestro')
    }
  }

  // Si es directivo, tiene acceso a todos los cursos
  // Continuar con la lógica...

  return <div>Detalles del curso</div>
}
```

## 8. Ejemplo: Hook personalizado para verificar permisos en el cliente

```typescript
// hooks/useAuth.ts
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function useAuth(allowedRoles?: string[]) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (allowedRoles && !allowedRoles.includes(profile?.role)) {
        // Redirigir al dashboard correspondiente
        const dashboards: Record<string, string> = {
          alumno: '/alumno',
          maestro: '/maestro',
          padre: '/padre',
          directivo: '/directivo',
        }
        router.push(dashboards[profile?.role] || '/login')
        return
      }

      setUser(user)
      setProfile(profile)
      setLoading(false)
    }

    checkAuth()
  }, [supabase, router, allowedRoles])

  return { user, profile, loading }
}

// Uso:
// const { user, profile, loading } = useAuth(['maestro'])
```

## 9. Ejemplo: Middleware personalizado para rutas específicas

Si quieres agregar lógica adicional al middleware para ciertas rutas:

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  // ... código existente del middleware

  const currentPath = request.nextUrl.pathname

  // Lógica especial para rutas de API
  if (currentPath.startsWith('/api/admin')) {
    // Solo directivos pueden acceder a /api/admin/*
    if (userRole !== 'directivo') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }
  }

  // Lógica especial para reportes
  if (currentPath.startsWith('/reportes')) {
    // Solo directivos y maestros
    if (!['directivo', 'maestro'].includes(userRole)) {
      const dashboardPath = roleRoutes[userRole]?.[0] || '/login'
      return NextResponse.redirect(new URL(dashboardPath, request.url))
    }
  }

  return response
}
```

## 10. Ejemplo: Testing de autenticación

```typescript
// __tests__/auth.test.ts
import { checkUserRole } from '@/lib/supabase-server'
import { hasRole } from '@/lib/auth-helpers'

describe('Authentication', () => {
  it('verifica roles correctamente', () => {
    expect(hasRole('alumno', ['alumno', 'maestro'])).toBe(true)
    expect(hasRole('padre', ['alumno', 'maestro'])).toBe(false)
  })

  it('permite acceso a múltiples roles', () => {
    const roles = ['directivo', 'maestro']
    expect(hasRole('directivo', roles)).toBe(true)
    expect(hasRole('maestro', roles)).toBe(true)
    expect(hasRole('alumno', roles)).toBe(false)
  })
})
```

## Resumen de Mejores Prácticas

✅ **DO:**
- Usar `requireAuth()` en Server Components para protección automática
- Validar roles tanto en el servidor como en el cliente
- Usar middleware para protección global de rutas
- Implementar verificaciones adicionales en API routes
- Redirigir usuarios a sus dashboards apropiados

❌ **DON'T:**
- No confiar únicamente en validaciones del cliente
- No hardcodear roles en múltiples lugares (usar constantes)
- No olvidar validar permisos en Server Actions
- No exponer información sensible en el cliente
- No saltarse el middleware para rutas "rápidas"
