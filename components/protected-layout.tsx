import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase-server'
import { UserRole, getDashboardPath } from '@/lib/auth-helpers'

interface ProtectedLayoutProps {
  children: ReactNode
  allowedRoles: UserRole[]
}

/**
 * Componente de layout que protege rutas verificando autenticación y roles
 * Este es un Server Component que se ejecuta en el servidor
 */
export async function ProtectedLayout({ children, allowedRoles }: ProtectedLayoutProps) {
  const currentUser = await getCurrentUser()

  // Si no hay usuario, redirigir a login
  if (!currentUser) {
    redirect('/login')
  }

  const userRole = currentUser.profile?.role as UserRole

  // Si el usuario no tiene un rol válido
  if (!userRole) {
    redirect('/login')
  }

  // Si el usuario no tiene permiso para esta ruta
  if (!allowedRoles.includes(userRole)) {
    const dashboardPath = getDashboardPath(userRole)
    redirect(dashboardPath)
  }

  // Si todo está bien, renderizar el contenido
  return <>{children}</>
}
