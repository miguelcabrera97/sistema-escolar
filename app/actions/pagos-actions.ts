'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { requireServerRole } from '@/lib/auth-server'
import { Result } from '@/lib/types'
import { z } from 'zod'

// ============================================
// VALIDADORES (ZOD)
// ============================================

const crearPagoSchema = z.object({
  concepto_id: z.string().uuid(),
  padre_id: z.string().uuid(),
  alumno_id: z.string().uuid(),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  descripcion: z.string().optional(),
  fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
})

const crearPagosMasivosSchema = z.object({
  concepto: z.string().min(1, 'El concepto es requerido'),
  alumnos: z.array(z.object({
    padre_id: z.string().uuid(),
    alumno_id: z.string().uuid(),
  })).min(1, 'Selecciona al menos un alumno'),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  descripcion: z.string().optional(),
  fecha_vencimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
})

const registrarPagoManualSchema = z.object({
  pagoId: z.string().uuid(),
  referencia: z.string().min(3, 'La referencia debe tener al menos 3 caracteres'),
  comprobanteUrl: z.string().optional().nullable(),
})

// ============================================
// CONCEPTOS DE PAGO
// ============================================

export async function obtenerConceptosPago(): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('conceptos_pago')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (error) {
      console.error('Error al obtener conceptos:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// CREAR PAGO (DIRECTIVO)
// ============================================

export interface CrearPagoData {
  concepto_id: string
  padre_id: string
  alumno_id: string
  monto: number
  descripcion?: string
  fecha_vencimiento: string
}

export async function crearPago(data: CrearPagoData): Promise<Result> {
  try {
    // 1. Validar datos
    const validation = crearPagoSchema.safeParse(data)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }

    // 2. Verificar autorización
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase, userId } = auth.data

    // 3. Obtener el concepto
    const { data: concepto } = await supabase
      .from('conceptos_pago')
      .select('nombre')
      .eq('id', data.concepto_id)
      .single()

    if (!concepto) {
      return { success: false, error: 'Concepto no encontrado' }
    }

    // 4. Verificar que el padre existe
    const { data: padre } = await supabase
      .from('padres')
      .select('id')
      .eq('id', data.padre_id)
      .single()

    if (!padre) {
      return { success: false, error: 'Padre no encontrado' }
    }

    // 5. Verificar que el alumno existe y pertenece al padre
    const { data: relacion } = await supabase
      .from('padre_alumno')
      .select('id')
      .eq('padre_id', data.padre_id)
      .eq('alumno_id', data.alumno_id)
      .maybeSingle()

    if (!relacion) {
      return { success: false, error: 'El alumno no pertenece a este padre o no está asignado.' }
    }

    // 6. Crear el pago
    const { data: pago, error: pagoError } = await supabaseAdmin
      .from('pagos')
      .insert({
        concepto: concepto.nombre,
        padre_id: data.padre_id,
        alumno_id: data.alumno_id,
        descripcion: data.descripcion || null,
        monto: data.monto,
        fecha_vencimiento: data.fecha_vencimiento,
        estado: 'pendiente',
        creado_por: userId
      })
      .select()
      .single()

    if (pagoError) {
      return { success: false, error: pagoError.message }
    }

    revalidatePath('/directivo/cursos')
    return { success: true, data: pago }
  } catch (error) {
    return { success: false, error: 'Error inesperado al crear pago' }
  }
}

// ============================================
// CREAR MÚLTIPLES PAGOS (DIRECTIVO)
// ============================================

export interface CrearPagosMasivosData {
  concepto: string
  alumnos: { padre_id: string; alumno_id: string }[] // Array de objetos con padre_id y alumno_id
  monto: number
  descripcion?: string
  fecha_vencimiento: string
}

export async function crearPagosMasivos(data: CrearPagosMasivosData): Promise<Result> {
  try {
    // 1. Validar datos
    const validation = crearPagosMasivosSchema.safeParse(data)
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }

    // 2. Verificar autorización
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { userId } = auth.data

    // 3. Crear pagos
    const pagosData = data.alumnos.map(al => ({
      concepto: data.concepto,
      padre_id: al.padre_id,
      alumno_id: al.alumno_id,
      descripcion: data.descripcion || null,
      monto: data.monto,
      fecha_vencimiento: data.fecha_vencimiento,
      estado: 'pendiente',
      creado_por: userId
    }))

    const { data: pagosCreados, error: pagosError } = await supabaseAdmin
      .from('pagos')
      .insert(pagosData)
      .select()

    if (pagosError) {
      return { success: false, error: pagosError.message }
    }

    revalidatePath('/directivo/pagos')
    return {
      success: true,
      data: {
        total: pagosCreados.length,
        pagos: pagosCreados
      }
    }
  } catch (error) {
    return { success: false, error: 'Error inesperado al crear pagos masivos' }
  }
}

// ============================================
// OBTENER PAGOS
// ============================================

export async function obtenerPagosDirectivo(filtros?: {
  estado?: string
  fecha_desde?: string
  fecha_hasta?: string
}): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    let query = supabase
      .from('pagos')
      .select(`
        *,
        padres!padre_id (
          id, 
          profiles!user_id (nombre, apellidos, email)
        ),
        alumnos!alumno_id (
          id, matricula, grado, grupo,
          profiles!user_id (nombre, apellidos)
        )
      `)
      .order('created_at', { ascending: false })

    if (filtros?.estado) {
      query = query.eq('estado', filtros.estado)
    }
    if (filtros?.fecha_desde) {
      query = query.gte('fecha_vencimiento', filtros.fecha_desde)
    }
    if (filtros?.fecha_hasta) {
      query = query.lte('fecha_vencimiento', filtros.fecha_hasta)
    }

    const { data: pagos, error } = await query
    if (error) return { success: false, error: error.message }

    return { success: true, data: pagos }
  } catch (error) {
    return { success: false, error: 'Error al obtener pagos' }
  }
}

export async function obtenerPagosPadre(): Promise<Result> {
  try {
    const auth = await requireServerRole(['padre'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase, userId } = auth.data

    // 1. Obtener el ID del padre
    const { data: padre } = await supabase
      .from('padres')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!padre) {
      return { success: false, error: 'No se encontró el perfil del padre' }
    }

    // 2. Obtener los pagos con join de alumnos y profiles
    const { data: pagos, error } = await supabase
      .from('pagos')
      .select(`
        *,
        alumnos!alumno_id (
          id, matricula, grado, grupo,
          profiles!user_id (nombre, apellidos)
        )
      `)
      .eq('padre_id', padre.id)
      .order('fecha_vencimiento', { ascending: true })

    if (error) return { success: false, error: error.message }

    return { success: true, data: pagos || [] }
  } catch (error) {
    return { success: false, error: 'Error al obtener pagos' }
  }
}

// ============================================
// REGISTRAR PAGO MANUAL
// ============================================

export async function registrarPagoManual(
  pagoId: string,
  referencia: string,
  comprobanteUrl?: string
): Promise<Result> {
  try {
    // 1. Validar
    const validation = registrarPagoManualSchema.safeParse({ pagoId, referencia, comprobanteUrl })
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message }
    }

    // 2. Verificar autorización (Padre)
    const auth = await requireServerRole(['padre'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase, userId } = auth.data

    // 3. Obtener el pago
    const { data: pago } = await supabase
      .from('pagos')
      .select('id, padre_id, estado')
      .eq('id', pagoId)
      .single()

    if (!pago) {
      return { success: false, error: 'Pago no encontrado' }
    }

    if (pago.estado !== 'pendiente' && pago.estado !== 'vencido') {
      return { success: false, error: 'Este pago ya fue procesado o está en verificación.' }
    }

    // 4. Verificar que el usuario sea el padre del pago
    const { data: padre } = await supabase
      .from('padres')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!padre || padre.id !== pago.padre_id) {
      return { success: false, error: 'No autorizado para registrar este pago.' }
    }

    // 5. Actualizar el pago a 'pendiente_verificacion'
    const { error: updateError } = await supabase
      .from('pagos')
      .update({
        estado: 'pendiente_verificacion',
        metodo_pago: 'manual',
        referencia_pago: referencia,
        comprobante_url: comprobanteUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', pagoId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    revalidatePath('/padre/pagos')
    return { success: true, data: { message: 'Pago registrado y enviado a verificación' } }
  } catch (error) {
    return { success: false, error: 'Error inesperado al registrar pago' }
  }
}

// ============================================
// VERIFICAR PAGO MANUAL (DIRECTIVO)
// ============================================

export async function verificarPagoManual(pagoId: string, aprobar: boolean): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase, userId } = auth.data

    const updateData: Record<string, unknown> = {
      pagado_verificado_por: userId,
      updated_at: new Date().toISOString()
    }

    if (aprobar) {
      updateData.estado = 'pagado'
      updateData.fecha_pago = new Date().toISOString()
    } else {
      updateData.estado = 'pendiente'
      updateData.metodo_pago = null
      updateData.fecha_pago = null
      updateData.referencia_pago = null
      updateData.comprobante_url = null
    }

    const { error } = await supabase
      .from('pagos')
      .update(updateData)
      .eq('id', pagoId)

    if (error) return { success: false, error: error.message }

    revalidatePath('/directivo/pagos')
    return { success: true, data: { message: aprobar ? 'Pago aprobado' : 'Pago rechazado' } }
  } catch (error) {
    return { success: false, error: 'Error al verificar pago' }
  }
}

// ============================================
// CANCELAR PAGO (DIRECTIVO)
// ============================================

export async function cancelarPago(pagoId: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    const { error } = await supabase
      .from('pagos')
      .update({ estado: 'cancelado' })
      .eq('id', pagoId)

    if (error) {
      console.error('Error al cancelar pago:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/pagos')
    return { success: true, data: { message: 'Pago cancelado' } }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// OBTENER PADRES CON ALUMNOS
// ============================================

export async function obtenerPadresConAlumnos(): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    const { data: padres, error } = await supabase
      .from('padres')
      .select(`
        id,
        user_id,
        profiles:user_id(id, nombre, apellidos, email),
        padre_alumno(
          alumno_id,
          alumnos:alumno_id(
            id, matricula, grado, grupo,
            user_id,
            profiles:user_id(nombre, apellidos)
          )
        )
      `)

    if (error) return { success: false, error: error.message }

    // Transformar al formato esperado por los componentes
    const padresCompletos = (padres || []).map(padre => {
      const profileData = Array.isArray(padre.profiles) ? padre.profiles[0] : padre.profiles;
      const padreAlumnoData = Array.isArray(padre.padre_alumno) ? padre.padre_alumno : [];

      return {
        id: padre.id,
        profiles: profileData || { nombre: 'Desconocido', apellidos: '', email: '' },
        padre_alumno: padreAlumnoData
          .filter((pa: any) => pa.alumnos !== null)
          .map((pa: any) => {
            const alumnoData = Array.isArray(pa.alumnos) ? pa.alumnos[0] : pa.alumnos;
            // Aplanar el profile anidado si existe
            if (alumnoData && alumnoData.profiles) {
              const alumnoProfile = Array.isArray(alumnoData.profiles) ? alumnoData.profiles[0] : alumnoData.profiles;
              alumnoData.profiles = alumnoProfile;
            }
            return {
              alumno_id: pa.alumno_id,
              alumnos: alumnoData
            }
          })
      }
    })

    return { success: true, data: padresCompletos }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// CREAR PREFERENCIA DE MERCADO PAGO
// ============================================

export async function crearPreferenciaMercadoPago(pagoId: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['padre'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase, userId } = auth.data

    // Obtener el pago
    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .select('*')
      .eq('id', pagoId)
      .single()

    if (pagoError || !pago) {
      return { success: false, error: 'Pago no encontrado' }
    }

    if (pago.estado !== 'pendiente' && pago.estado !== 'vencido') {
      return { success: false, error: 'Este pago ya fue procesado' }
    }

    // Verificar que el usuario sea el padre del pago
    const { data: padre } = await supabase
      .from('padres')
      .select('id, user_id')
      .eq('user_id', userId)
      .single()

    if (!padre || padre.id !== pago.padre_id) {
      return { success: false, error: 'No autorizado' }
    }

    // Obtener información del padre para el email
    const { data: padreProfile } = await supabase
      .from('profiles')
      .select('email, nombre, apellidos')
      .eq('id', padre.user_id)
      .single()

    // Obtener información del alumno
    const { data: alumno } = await supabase
      .from('alumnos')
      .select('matricula, user_id')
      .eq('id', pago.alumno_id)
      .single()

    const { data: alumnoProfile } = alumno ? await supabase
      .from('profiles')
      .select('nombre, apellidos')
      .eq('id', alumno.user_id)
      .single() : { data: null }

    // Importar dinámicamente el SDK de Mercado Pago
    const { mercadoPagoPreference } = await import('@/lib/mercadopago')

    // Crear la preferencia de pago
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const preference = await mercadoPagoPreference.create({
      body: {
        items: [
          {
            id: pagoId,
            title: pago.concepto || 'Pago',
            description: pago.descripcion || `Pago de ${pago.concepto || 'concepto'} - ${alumnoProfile?.nombre || ''} ${alumnoProfile?.apellidos || ''}`,
            quantity: 1,
            currency_id: 'MXN',
            unit_price: Number(pago.monto)
          }
        ],
        payer: {
          email: padreProfile?.email || '',
          name: padreProfile?.nombre || '',
          surname: padreProfile?.apellidos || ''
        },
        back_urls: {
          success: `${appUrl}/padre/pagos?status=success&payment_id={payment_id}`,
          failure: `${appUrl}/padre/pagos?status=failure`,
          pending: `${appUrl}/padre/pagos?status=pending`
        },
        auto_return: 'all',
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
        external_reference: pagoId,
        statement_descriptor: 'SISTEMA ESCOLAR',
        expires: false
      }
    })

    if (!preference.id) {
      return { success: false, error: 'Error al crear preferencia de pago' }
    }

    // Guardar la preferencia en la base de datos
    const { error: transError } = await supabase
      .from('transacciones_mercadopago')
      .insert({
        pago_id: pagoId,
        preference_id: preference.id,
        status: 'pending'
      })

    if (transError) {
      console.error('Error al guardar transacción:', transError)
      return { success: false, error: 'Error al crear preferencia de pago' }
    }

    return {
      success: true,
      data: {
        preference_id: preference.id,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point
      }
    }
  } catch (error: unknown) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado al crear preferencia de pago' }
  }
}

// ============================================
// CREAR PAGO CON CHECKOUT API (ORDERS)
// ============================================

export async function crearPagoCheckoutAPI(
  pagoId: string,
  paymentData: {
    token: string
    paymentMethodId: string
    issuerId?: string
    installments: number
    email: string
    identificationType: string
    identificationNumber: string
  }
): Promise<Result> {
  try {
    const auth = await requireServerRole(['padre'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase, userId } = auth.data

    // Obtener el pago
    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .select('*')
      .eq('id', pagoId)
      .single()

    if (pagoError || !pago) {
      return { success: false, error: 'Pago no encontrado' }
    }

    if (pago.estado !== 'pendiente' && pago.estado !== 'vencido') {
      return { success: false, error: 'Este pago ya fue procesado' }
    }

    // Verificar que el usuario sea el padre del pago
    const { data: padre } = await supabase
      .from('padres')
      .select('id, user_id')
      .eq('user_id', userId)
      .single()

    if (!padre || padre.id !== pago.padre_id) {
      return { success: false, error: 'No autorizado' }
    }

    // Obtener información del padre
    const { data: padreProfile } = await supabase
      .from('profiles')
      .select('email, nombre, apellidos')
      .eq('id', padre.user_id)
      .single()

    // Obtener información del alumno
    const { data: alumno } = await supabase
      .from('alumnos')
      .select('matricula, user_id')
      .eq('id', pago.alumno_id)
      .single()

    const { data: alumnoProfile } = alumno ? await supabase
      .from('profiles')
      .select('nombre, apellidos')
      .eq('id', alumno.user_id)
      .single() : { data: null }

    // Importar dinámicamente el SDK de Mercado Pago
    const { mercadoPagoPayment } = await import('@/lib/mercadopago')

    // Crear el pago usando la API de Orders
    const payment = await mercadoPagoPayment.create({
      body: {
        transaction_amount: Number(pago.monto),
        token: paymentData.token,
        description: pago.descripcion || `Pago de ${pago.concepto || 'concepto'} - ${alumnoProfile?.nombre || ''} ${alumnoProfile?.apellidos || ''}`,
        installments: paymentData.installments,
        payment_method_id: paymentData.paymentMethodId,
        issuer_id: paymentData.issuerId ? Number(paymentData.issuerId) : undefined,
        payer: {
          email: paymentData.email,
          identification: {
            type: paymentData.identificationType,
            number: paymentData.identificationNumber
          }
        },
        external_reference: pagoId,
        statement_descriptor: 'SISTEMA ESCOLAR',
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/mercadopago`
      }
    })

    if (!payment.id) {
      return { success: false, error: 'Error al procesar el pago' }
    }

    // Guardar la transacción en la base de datos
    const { error: transError } = await supabase
      .from('transacciones_mercadopago')
      .upsert({
        pago_id: pagoId,
        payment_id: String(payment.id),
        status: payment.status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        net_amount: payment.transaction_details?.net_received_amount,
        fee_amount: payment.fee_details?.reduce((sum: number, fee: { amount?: number }) => sum + (fee.amount || 0), 0) || 0,
        payer_email: payment.payer?.email,
        payer_identification: payment.payer?.identification?.number,
        payment_data: payment
      })

    if (transError) {
      console.error('Error al guardar transacción:', transError)
    }

    // Actualizar el estado del pago según el resultado
    if (payment.status === 'approved') {
      await supabase
        .from('pagos')
        .update({
          estado: 'pagado',
          metodo_pago: 'mercadopago',
          fecha_pago: new Date().toISOString(),
          referencia_pago: String(payment.id)
        })
        .eq('id', pagoId)
    }

    return {
      success: true,
      data: {
        payment_id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        payment_method_id: payment.payment_method_id,
        transaction_amount: payment.transaction_amount
      }
    }
  } catch (error: any) {
    console.error('Error al procesar pago:', error)
    return {
      success: false,
      error: error.message || 'Error inesperado al procesar el pago'
    }
  }
}

// ============================================
// OBTENER DATOS COMPLETOS DE PAGO PARA RECIBO
// ============================================

export async function obtenerDatosPagoParaRecibo(pagoId: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo', 'padre'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase, userId, role } = auth.data

    // 1. Obtener el pago con toda la información necesaria usando joins
    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .select(`
        *,
        padre:padres!padre_id (
          id, user_id,
          profiles!user_id (nombre, apellidos, email)
        ),
        alumno:alumnos!alumno_id (
          id, matricula, grado, grupo,
          profiles!user_id (nombre, apellidos)
        )
      `)
      .eq('id', pagoId)
      .single()

    if (pagoError || !pago) {
      return { success: false, error: 'Pago no encontrado' }
    }

    // 2. Seguridad: si es padre, verificar que sea el dueño del pago
    if (role === 'padre') {
      if (pago.padre?.user_id !== userId) {
        return { success: false, error: 'No autorizado para ver este recibo' }
      }
    }

    // 3. Verificar que el pago esté pagado
    if (pago.estado !== 'pagado') {
      return { success: false, error: 'El pago aún no ha sido procesado' }
    }

    // 4. Formatear datos para el recibo
    const alumno = pago.alumno
    const profiles = alumno?.profiles
    const gradoStr = (alumno?.grado || '').toLowerCase()
    let nivelEducativo = 'Nivel Básico'

    if (gradoStr.includes('prepa') || gradoStr.includes('bachillerato')) {
      nivelEducativo = 'Preparatoria'
    } else if (gradoStr.includes('secundaria')) {
      nivelEducativo = 'Secundaria'
    } else if (gradoStr.includes('primaria')) {
      nivelEducativo = 'Primaria'
    } else if (gradoStr.includes('preescolar') || gradoStr.includes('kinder')) {
      nivelEducativo = 'Preescolar'
    }

    const datosRecibo = {
      numeroRecibo: pago.id.substring(0, 8).toUpperCase(),
      fechaPago: new Date(pago.fecha_pago || '').toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      monto: Number(pago.monto),
      concepto: pago.concepto,
      descripcion: pago.descripcion || undefined,
      metodoPago: pago.metodo_pago || 'N/A',
      referencia: pago.referencia_pago || undefined,
      alumnoNombre: profiles?.nombre || '',
      alumnoApellidos: profiles?.apellidos || '',
      alumnoMatricula: alumno?.matricula,
      alumnoGrado: alumno?.grado,
      alumnoGrupo: alumno?.grupo,
      nivelEducativo: nivelEducativo,
      padreNombre: pago.padre?.profiles?.nombre || '',
      padreApellidos: pago.padre?.profiles?.apellidos || '',
      nombreEscuela: 'GRUPO EDUCATIVO SUD S. C.',
      rfcEscuela: 'GES130503G38',
      direccionEscuela: 'Paseo de la Candelaria Mz. 66 Lt. 11, Hacienda Ojo de Agua, Tecámac,\nEstado de México. C. P: 55770',
      logoEscuela: '/logo.png'
    }

    return { success: true, data: datosRecibo }
  } catch (error) {
    return { success: false, error: 'Error al obtener datos del recibo' }
  }
}

