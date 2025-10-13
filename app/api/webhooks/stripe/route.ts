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
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const error = err as Error
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const error = err as Error
    console.error('Error processing webhook:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const pagoId = session.metadata?.pagoId
  
  if (!pagoId) {
    console.error('No pagoId in metadata')
    return
  }

  const { error } = await supabaseAdmin
    .from('pagos')
    .update({
      status: 'pagado',
      fecha_pago: new Date().toISOString(),
      metodo_pago: 'stripe',
      stripe_payment_intent_id: session.payment_intent as string
    })
    .eq('id', pagoId)

  if (error) {
    console.error('Error updating payment:', error)
    throw error
  }
}