import { createServerSupabaseClient } from './supabase-server'
import type { UserRole } from './auth-helpers'
import type { Result } from './types'

interface AuthContext {
    userId: string
    role: UserRole
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
}

/**
 * Helper para verificar autenticación y rol en Server Actions
 */
export async function requireServerRole(
    allowedRoles: UserRole[]
): Promise<Result<AuthContext>> {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { success: false, error: 'No autenticado o sesión expirada' }
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profileError || !profile) {
        return { success: false, error: 'No se pudo verificar el perfil del usuario' }
    }

    const userRole = profile.role as UserRole
    if (!allowedRoles.includes(userRole)) {
        return { success: false, error: 'No tiene permisos para realizar esta acción' }
    }

    return {
        success: true,
        data: {
            userId: user.id,
            role: userRole,
            supabase
        }
    }
}
