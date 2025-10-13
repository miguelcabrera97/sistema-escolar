import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  console.log('🎫 ========================================')
  console.log('🎫 CREANDO SESION DE PAGO')
  console.log('🎫 ========================================')
  
  try {
    const { pagoId } = await request.json()
    console.log('📝 Pago ID recibido:', pagoId)

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
      console.error('❌ Error obteniendo pago:', error)
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Pago encontrado:', {
      concepto: pago.concepto,
      monto: pago.monto,
      alumno: pago.alumnos.profiles.nombre
    })

    // Crear sesión de pago en Stripe
    console.log('💳 Creando sesión en Stripe...')
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
            unit_amount: Math.round(pago.monto * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/padre/pagos?success=true&pago_id=${pagoId}`,
      cancel_url: `${request.nextUrl.origin}/padre/pagos?canceled=true`,
      metadata: {
        pagoId: pago.id,
        alumnoId: pago.alumno_id,
      },
    })

    console.log('✅ Sesión creada:', session.id)
    console.log('📦 Metadata enviado:', session.metadata)

    // Actualizar pago con el session_id
    await supabase
      .from('pagos')
      .update({ stripe_session_id: session.id })
      .eq('id', pagoId)

    console.log('✅ Pago actualizado con session_id')
    console.log('🔗 URL de pago:', session.url)

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    })
  } catch (error: any) {
    console.error('❌ ========================================')
    console.error('❌ ERROR CREANDO SESION:', error.message)
    console.error('❌ ========================================')
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}