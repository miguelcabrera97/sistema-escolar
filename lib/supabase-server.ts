// lib/supabase-server.ts
// Este archivo contiene utilidades de Supabase solo para Server Components
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cliente para uso en Server Components y Server Actions
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Puede fallar en middleware o en casos donde cookies es read-only
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Puede fallar en middleware o en casos donde cookies es read-only
          }
        },
      },
    }
  )
}

// Función auxiliar para obtener el usuario actual en el servidor
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    user,
    profile,
  }
}

// Función auxiliar para verificar el rol del usuario
export async function checkUserRole(allowedRoles: string[]) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return false
  }

  return allowedRoles.includes(currentUser.profile?.role)
}
