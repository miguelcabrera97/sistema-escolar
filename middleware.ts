import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROLE_DASHBOARD } from '@/lib/constants'
import type { UserRole } from '@/lib/auth-helpers'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rutas públicas que no requieren autenticación
  const publicPaths = ['/login', '/', '/recuperar-password', '/restablecer-password']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname === path)

  // Si el usuario no está autenticado y no está en una ruta pública
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si el usuario está autenticado
  if (user) {
    // Obtener el rol del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role

    // Definir rutas permitidas por rol
    const currentPath = request.nextUrl.pathname
    const roleDashboard = userRole ? ROLE_DASHBOARD[userRole as UserRole] : undefined

    // Si está en login y ya autenticado, redirigir a su dashboard
    if (currentPath === '/login' && roleDashboard) {
      return NextResponse.redirect(new URL(roleDashboard, request.url))
    }

    // Si está en la raíz, redirigir a su dashboard
    if (currentPath === '/' && roleDashboard) {
      return NextResponse.redirect(new URL(roleDashboard, request.url))
    }

    // Verificar si el usuario tiene permiso para acceder a la ruta actual
    if (userRole && roleDashboard) {
      const hasAccess = currentPath.startsWith(roleDashboard)

      // Si no tiene acceso, redirigir a su dashboard
      if (!hasAccess && !isPublicPath) {
        return NextResponse.redirect(new URL(roleDashboard, request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
