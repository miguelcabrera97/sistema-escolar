import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Healthcheck para Coolify/Docker. No toca Supabase.
export function GET() {
  return NextResponse.json({ ok: true })
}
