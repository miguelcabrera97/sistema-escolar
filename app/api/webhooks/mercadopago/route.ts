import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import crypto from 'crypto'

/**
 * Verifica la firma de Mercado Pago (HMAC-SHA256)
 */
function verifyWebhookSignature(xSignature: string, xRequestId: string, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.error('MERCADOPAGO_WEBHOOK_SECRET no está configurado')
    return false
  }

  // Mercado Pago envía el header x-signature con formato ts=...,v1=...
  const parts = xSignature.split(',')
  const tsValue = parts.find(p => p.trim().startsWith('ts='))?.split('=')[1]
  const v1Value = parts.find(p => p.trim().startsWith('v1='))?.split('=')[1]

  if (!tsValue || !v1Value) {
    console.error('Formato de x-signature inválido')
    return false
  }

  // Según documentación de Mercado Pago para notificaciones V1/V2:
  // El manifest se construye como: id:[data.id];request-id:[x-request-id];ts:[ts];
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${tsValue};`

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(manifest)
    .digest('hex')

  return hmac === v1Value
}

/**
 * Webhook de Mercado Pago
 * Este endpoint recibe las notificaciones de Mercado Pago cuando hay actualizaciones de pagos
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('Webhook de Mercado Pago recibido:', body)

    // Mercado Pago envía diferentes tipos de notificaciones
    // Nos interesan las de tipo "payment"
    if (body.type !== 'payment') {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
    }

    // --- SEGURIDAD: VERIFICACIÓN DE FIRMA ---
    const xSignature = req.headers.get('x-signature') || ''
    const xRequestId = req.headers.get('x-request-id') || ''

    // En entornos de desarrollo sin el secreto configurado, podríamos saltar esto
    // pero para producción es CRÍTICO.
    if (process.env.NODE_ENV === 'production' || process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      if (!verifyWebhookSignature(xSignature, xRequestId, paymentId.toString())) {
        console.error('Firma de webhook inválida detectada')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else {
      console.warn('⚠️ Saltando verificación de firma de webhook (entorno de desarrollo sin secreto)')
    }
    // ----------------------------------------

    // Configurar el cliente de Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
    })

    const paymentClient = new Payment(client)

    // Obtener la información completa del pago desde Mercado Pago
    const payment = await paymentClient.get({ id: paymentId })

    console.log('Información del pago:', payment)

    // Obtener el external_reference que es nuestro pagoId
    const pagoId = payment.external_reference
    if (!pagoId) {
      console.error('No se encontró external_reference en el pago')
      return NextResponse.json({ error: 'No external reference' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Actualizar la transacción en la base de datos
    const { error: transError } = await supabase
      .from('transacciones_mercadopago')
      .update({
        payment_id: payment.id?.toString(),
        merchant_order_id: payment.order?.id?.toString(),
        status: payment.status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        net_amount: payment.transaction_details?.net_received_amount,
        fee_amount: payment.fee_details?.reduce((sum, fee) => sum + (fee.amount || 0), 0),
        payer_email: payment.payer?.email,
        payer_identification: payment.payer?.identification?.number,
        payment_data: payment as any,
        updated_at: new Date().toISOString()
      })
      .eq('pago_id', pagoId)

    if (transError) {
      console.error('Error al actualizar transacción:', transError)
    }

    // Si el pago fue aprobado, actualizar el estado del pago
    if (payment.status === 'approved') {
      const { error: pagoError } = await supabase
        .from('pagos')
        .update({
          estado: 'pagado',
          metodo_pago: 'mercadopago',
          fecha_pago: new Date().toISOString(),
          referencia_pago: payment.id?.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pagoId)

      if (pagoError) {
        console.error('Error al actualizar pago:', pagoError)
        return NextResponse.json({ error: 'Error updating payment' }, { status: 500 })
      }

      console.log(`Pago ${pagoId} actualizado a 'pagado'`)
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      // Si el pago fue rechazado o cancelado, volver a pendiente
      const { error: pagoError } = await supabase
        .from('pagos')
        .update({
          estado: 'pendiente',
          updated_at: new Date().toISOString()
        })
        .eq('id', pagoId)

      if (pagoError) {
        console.error('Error al actualizar pago rechazado:', pagoError)
      }

      console.log(`Pago ${pagoId} rechazado/cancelado, vuelto a pendiente`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Error en webhook de Mercado Pago:', error)
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 500 }
    )
  }
}

// Mercado Pago también puede hacer GET para verificar el endpoint
export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' })
}
