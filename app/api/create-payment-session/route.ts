import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { pagoId } = await request.json()

    // Obtener datos del pago
    const { data: pago, error } = await supabase
      .from('pagos')
      .select(`
        *,
        alumnos (
          matricula,
          profiles (
            nombre,
            apellidos,
            email
          )
        )
      `)
      .eq('id', pagoId)
      .single()

    if (error || !pago) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    // Crear sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: pago.concepto,
              description: `Pago para ${pago.alumnos.profiles.nombre} ${pago.alumnos.profiles.apellidos} - Matrícula: ${pago.alumnos.matricula}`,
            },
            unit_amount: Math.round(pago.monto * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/padre/pagos?success=true`,
      cancel_url: `${request.nextUrl.origin}/padre/pagos?canceled=true`,
      metadata: {
        pagoId: pago.id,
        alumnoId: pago.alumno_id,
      },
    })

    // Actualizar pago con el session_id
    await supabase
      .from('pagos')
      .update({ stripe_session_id: session.id })
      .eq('id', pagoId)

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error('Error creando sesión de pago:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}