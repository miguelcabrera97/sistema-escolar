// lib/supabase-admin.ts
// Cliente de Supabase con Service Role para operaciones administrativas
// ADVERTENCIA: Solo usar en el servidor, nunca exponer en el cliente

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

// Inicialización diferida: las variables se validan en el primer uso y no al
// importar el módulo, para que `next build` no requiera secretos de runtime.
function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY - Add it to your .env.local file')
  }

  // Cliente con permisos de administrador que bypasea RLS
  adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  return adminClient
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    const value = Reflect.get(client, prop, client)
    return typeof value === 'function' ? value.bind(client) : value
  }
})
