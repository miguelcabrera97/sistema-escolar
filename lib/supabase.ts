// lib/supabase.ts
// Este archivo contiene utilidades de Supabase para Client Components
import { createBrowserClient } from '@supabase/ssr'

// Cliente para uso en componentes del cliente
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

