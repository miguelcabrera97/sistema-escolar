import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

interface PagoWithRelations {
  id: string
  concepto: string
  monto: number
  alumno_id: string
  alumnos: {
    matricula: string
    profiles: {
      nombre: string
      apellidos: string
      email: string
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pagoId } = await request.json()

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

    const pagoData = pago as unknown as PagoWithRelations

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: pagoData.concepto,
              description: `Pago para ${pagoData.alumnos.profiles.nombre} ${pagoData.alumnos.profiles.apellidos} - Matrícula: ${pagoData.alumnos.matricula}`,
            },
            unit_amount: Math.round(pagoData.monto * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/padre/pagos?success=true&pago_id=${pagoId}`,
      cancel_url: `${request.nextUrl.origin}/padre/pagos?canceled=true`,
      metadata: {
        pagoId: pagoData.id,
        alumnoId: pagoData.alumno_id,
      },
    })

    await supabase
      .from('pagos')
      .update({ stripe_session_id: session.id })
      .eq('id', pagoId)

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    })
  } catch (err) {
    const error = err as Error
    console.error('Error creando sesión de pago:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}