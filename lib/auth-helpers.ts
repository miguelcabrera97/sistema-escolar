import { redirect } from 'next/navigation'
import { getCurrentUser } from './supabase-server'
import { ROLE_DASHBOARD } from './constants'

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
      const redirectPath = ROLE_DASHBOARD[userRole as UserRole] || '/login'
      redirect(redirectPath)
    }
  }

  return currentUser
}

/**
 * Obtiene el dashboard correspondiente según el rol
 */
export function getDashboardPath(role: UserRole): string {
  return ROLE_DASHBOARD[role] || '/login'
}

/**
 * Verifica si un usuario tiene un rol específico
 */
export function hasRole(userRole: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole as UserRole)
}
