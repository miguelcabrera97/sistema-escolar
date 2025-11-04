import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
  const publicPaths = ['/login', '/']
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
    const roleRoutes: Record<string, string[]> = {
      alumno: ['/alumno'],
      maestro: ['/maestro'],
      padre: ['/padre'],
      directivo: ['/directivo'],
      auxiliar_calificaciones: ['/auxiliar'],
    }

    const currentPath = request.nextUrl.pathname

    // Si está en login y ya autenticado, redirigir a su dashboard
    if (currentPath === '/login' && userRole) {
      const dashboardPath = roleRoutes[userRole]?.[0] || '/login'
      return NextResponse.redirect(new URL(dashboardPath, request.url))
    }

    // Si está en la raíz, redirigir a su dashboard
    if (currentPath === '/' && userRole) {
      const dashboardPath = roleRoutes[userRole]?.[0] || '/login'
      return NextResponse.redirect(new URL(dashboardPath, request.url))
    }

    // Verificar si el usuario tiene permiso para acceder a la ruta actual
    if (userRole) {
      const allowedPaths = roleRoutes[userRole] || []
      const hasAccess = allowedPaths.some(path => currentPath.startsWith(path))

      // Si no tiene acceso, redirigir a su dashboard
      if (!hasAccess && !isPublicPath) {
        const dashboardPath = roleRoutes[userRole]?.[0] || '/login'
        return NextResponse.redirect(new URL(dashboardPath, request.url))
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
