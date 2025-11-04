import { redirect } from 'next/navigation'
import { getCurrentUser } from './supabase-server'

export type UserRole = 'alumno' | 'maestro' | 'padre' | 'directivo' | 'auxiliar_calificaciones'

interface AuthCheck {
  user: any
  profile: any
}

/**
 * Protege una ruta verificando que el usuario esté autenticado
 * y tenga uno de los roles permitidos
 */
export async function requireAuth(allowedRoles?: UserRole[]): Promise<AuthCheck> {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/login')
  }

  // Si se especificaron roles permitidos, verificar
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = currentUser.profile?.role

    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirigir al dashboard correspondiente del usuario
      const roleRedirects: Record<string, string> = {
        alumno: '/alumno',
        maestro: '/maestro',
        padre: '/padre',
        directivo: '/directivo',
        auxiliar_calificaciones: '/auxiliar',
      }

      const redirectPath = roleRedirects[userRole] || '/login'
      redirect(redirectPath)
    }
  }

  return currentUser
}

/**
 * Obtiene el dashboard correspondiente según el rol
 */
export function getDashboardPath(role: UserRole): string {
  const dashboards: Record<UserRole, string> = {
    alumno: '/alumno',
    maestro: '/maestro',
    padre: '/padre',
    directivo: '/directivo',
    auxiliar_calificaciones: '/auxiliar',
  }

  return dashboards[role] || '/login'
}

/**
 * Verifica si un usuario tiene un rol específico
 */
export function hasRole(userRole: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole as UserRole)
}
