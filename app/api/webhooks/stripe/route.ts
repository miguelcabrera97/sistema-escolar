import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  console.log('🔔 ========================================')
  console.log('🔔 WEBHOOK RECIBIDO!')
  console.log('🔔 ========================================')
  
  const body = await request.text()
  const headersList = await headers() // ← CAMBIO: await agregado
  const signature = headersList.get('stripe-signature')

  console.log('📝 Signature:', signature ? 'PRESENTE ✅' : 'FALTANTE ❌')

  if (!signature) {
    console.error('❌ ERROR: No se encontró firma')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    console.log('🔐 Verificando firma...')
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    
    console.log('✅ FIRMA VERIFICADA!')
    console.log('📦 Tipo de evento:', event.type)
    console.log('🆔 Event ID:', event.id)
  } catch (err: any) {
    console.error('❌ ERROR VERIFICANDO FIRMA:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('💳 ========================================')
        console.log('💳 CHECKOUT COMPLETADO!')
        console.log('💳 ========================================')
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`)
    }

    console.log('✅ ========================================')
    console.log('✅ WEBHOOK PROCESADO EXITOSAMENTE')
    console.log('✅ ========================================')
    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ ========================================')
    console.error('❌ ERROR PROCESANDO WEBHOOK:', error.message)
    console.error('❌ ========================================')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('🎯 Session ID:', session.id)
  console.log('🎯 Payment Intent:', session.payment_intent)
  console.log('🎯 Payment Status:', session.payment_status)
  console.log('🎯 Metadata:', JSON.stringify(session.metadata, null, 2))
  
  const pagoId = session.metadata?.pagoId
  
  if (!pagoId) {
    console.error('❌ ERROR: No se encontró pagoId en metadata')
    console.error('❌ Metadata recibido:', session.metadata)
    return
  }

  console.log('💾 Actualizando pago en Supabase:', pagoId)

  const { data, error } = await supabaseAdmin
    .from('pagos')
    .update({
      status: 'pagado',
      fecha_pago: new Date().toISOString(),
      metodo_pago: 'stripe',
      stripe_payment_intent_id: session.payment_intent as string
    })
    .eq('id', pagoId)
    .select()

  if (error) {
    console.error('❌ ERROR DE SUPABASE:', error)
    throw error
  }

  console.log('✅ PAGO ACTUALIZADO EN SUPABASE!')
  console.log('✅ Datos actualizados:', data)
}