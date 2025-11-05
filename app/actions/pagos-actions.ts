'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

interface Result {
  success: boolean
  data?: any
  error?: string
}

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
    const supabase = await createServerSupabaseClient()

    // Verificar que el usuario sea directivo
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo') {
      return { success: false, error: 'No autorizado' }
    }

    // Obtener el concepto
    const { data: concepto } = await supabase
      .from('conceptos_pago')
      .select('nombre')
      .eq('id', data.concepto_id)
      .single()

    if (!concepto) {
      return { success: false, error: 'Concepto no encontrado' }
    }

    // Verificar que el padre existe
    const { data: padre } = await supabase
      .from('padres')
      .select('id')
      .eq('id', data.padre_id)
      .single()

    if (!padre) {
      return { success: false, error: 'Padre no encontrado' }
    }

    // Verificar que el alumno existe y pertenece al padre
    console.log('🔍 Verificando relación padre-alumno')
    console.log('  padre_id:', data.padre_id)
    console.log('  alumno_id:', data.alumno_id)

    const { data: relacion, error: relacionError } = await supabase
      .from('padre_alumno')
      .select('*')
      .eq('padre_id', data.padre_id)
      .eq('alumno_id', data.alumno_id)
      .maybeSingle()

    console.log('  Relación encontrada:', relacion)
    console.log('  Error de relación:', relacionError)

    if (relacionError) {
      console.error('❌ Error al verificar relación:', relacionError)
      return { success: false, error: `Error al verificar relación: ${relacionError.message}` }
    }

    if (!relacion) {
      console.error('❌ No se encontró relación padre-alumno')
      return { success: false, error: 'El alumno no pertenece a este padre. Verifica que el padre esté asignado al alumno.' }
    }

    console.log('✅ Relación verificada correctamente')

    // LOG: Ver el objeto que vamos a insertar
    const pagoData = {
      concepto: concepto.nombre,
      padre_id: data.padre_id,
      alumno_id: data.alumno_id,
      descripcion: data.descripcion || null,
      monto: data.monto,
      fecha_vencimiento: data.fecha_vencimiento,
      estado: 'pendiente',
      creado_por: user.id
    }
    console.log('📝 Datos del pago a insertar:', JSON.stringify(pagoData, null, 2))

    // Crear el pago usando supabaseAdmin para bypasear RLS
    console.log('🔐 Usando supabaseAdmin para crear el pago...')
    const { data: pago, error: pagoError } = await supabaseAdmin
      .from('pagos')
      .insert(pagoData)
      .select()
      .single()

    if (pagoError) {
      console.error('❌ Error completo al crear pago:', JSON.stringify(pagoError, null, 2))
      return { success: false, error: pagoError.message }
    }

    revalidatePath('/directivo/pagos')
    return { success: true, data: pago }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado al crear pago' }
  }
}

// ============================================
// CREAR MÚLTIPLES PAGOS (DIRECTIVO)
// ============================================

export interface CrearPagosMasivosData {
  concepto_id: string
  padre_ids: string[] // Array de padre_id
  monto: number
  descripcion?: string
  fecha_vencimiento: string
}

export async function crearPagosMasivos(data: CrearPagosMasivosData): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    // Verificar que el usuario sea directivo
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo') {
      return { success: false, error: 'No autorizado' }
    }

    // Obtener el concepto
    const { data: concepto } = await supabase
      .from('conceptos_pago')
      .select('nombre')
      .eq('id', data.concepto_id)
      .single()

    if (!concepto) {
      return { success: false, error: 'Concepto no encontrado' }
    }

    // Obtener los alumnos de cada padre
    const { data: relaciones } = await supabase
      .from('padre_alumno')
      .select('padre_id, alumno_id')
      .in('padre_id', data.padre_ids)

    if (!relaciones || relaciones.length === 0) {
      return { success: false, error: 'No se encontraron alumnos para los padres seleccionados' }
    }

    // Crear un pago por cada relación padre-alumno
    const pagos = relaciones.map(rel => ({
      concepto: concepto.nombre,  // Usar 'concepto' en lugar de 'concepto_id' y 'concepto_nombre'
      padre_id: rel.padre_id,
      alumno_id: rel.alumno_id,
      descripcion: data.descripcion || null,
      monto: data.monto,
      fecha_vencimiento: data.fecha_vencimiento,
      estado: 'pendiente',
      creado_por: user.id
    }))

    const { data: pagosCreados, error: pagosError } = await supabase
      .from('pagos')
      .insert(pagos)
      .select()

    if (pagosError) {
      console.error('Error al crear pagos:', pagosError)
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
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado al crear pagos' }
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
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo') {
      return { success: false, error: 'No autorizado' }
    }

    // Primero obtenemos los pagos
    let query = supabase
      .from('pagos')
      .select('*')
      .order('created_at', { ascending: false })

    // Aplicar filtros si existen
    if (filtros?.estado) {
      query = query.eq('estado', filtros.estado)
    }

    if (filtros?.fecha_desde) {
      query = query.gte('fecha_vencimiento', filtros.fecha_desde)
    }

    if (filtros?.fecha_hasta) {
      query = query.lte('fecha_vencimiento', filtros.fecha_hasta)
    }

    const { data: pagos, error: pagosError } = await query

    if (pagosError) {
      console.error('Error al obtener pagos:', pagosError)
      return { success: false, error: pagosError.message }
    }

    if (!pagos || pagos.length === 0) {
      return { success: true, data: [] }
    }

    // Obtener IDs únicos de padres y alumnos
    const padreIds = [...new Set(pagos.map(p => p.padre_id))]
    const alumnoIds = [...new Set(pagos.map(p => p.alumno_id))]

    // Obtener información de padres
    const { data: padres } = await supabase
      .from('padres')
      .select('id, user_id')
      .in('id', padreIds)

    // Obtener profiles de padres
    const padreUserIds = padres?.map(p => p.user_id).filter(Boolean) || []
    const { data: padreProfiles } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos, email')
      .in('id', padreUserIds)

    // Obtener información de alumnos
    const { data: alumnos } = await supabase
      .from('alumnos')
      .select('id, matricula, grado, grupo, user_id')
      .in('id', alumnoIds)

    // Obtener profiles de alumnos
    const alumnoUserIds = alumnos?.map(a => a.user_id).filter(Boolean) || []
    const { data: alumnoProfiles } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos')
      .in('id', alumnoUserIds)

    // Combinar todos los datos
    const pagosCompletos = pagos.map(pago => {
      const padre = padres?.find(p => p.id === pago.padre_id)
      const padreProfile = padreProfiles?.find(pp => pp.id === padre?.user_id)

      const alumno = alumnos?.find(a => a.id === pago.alumno_id)
      const alumnoProfile = alumnoProfiles?.find(ap => ap.id === alumno?.user_id)

      return {
        ...pago,
        padres: padre ? {
          id: padre.id,
          profiles: padreProfile || { nombre: 'Desconocido', apellidos: '', email: '' }
        } : null,
        alumnos: alumno ? {
          id: alumno.id,
          matricula: alumno.matricula,
          grado: alumno.grado,
          grupo: alumno.grupo,
          profiles: alumnoProfile || { nombre: 'Desconocido', apellidos: '' }
        } : null
      }
    })

    return { success: true, data: pagosCompletos }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function obtenerPagosPadre(): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    // Obtener el ID del padre
    const { data: padre } = await supabase
      .from('padres')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!padre) {
      return { success: false, error: 'No se encontró el perfil del padre' }
    }

    // Obtener los pagos del padre
    const { data: pagos, error: pagosError } = await supabase
      .from('pagos')
      .select('*')
      .eq('padre_id', padre.id)
      .order('fecha_vencimiento', { ascending: true })

    if (pagosError) {
      console.error('Error al obtener pagos:', pagosError)
      return { success: false, error: pagosError.message }
    }

    if (!pagos || pagos.length === 0) {
      return { success: true, data: [] }
    }

    // Obtener IDs únicos de alumnos
    const alumnoIds = [...new Set(pagos.map(p => p.alumno_id))]

    // Obtener información de alumnos
    const { data: alumnos } = await supabase
      .from('alumnos')
      .select('id, matricula, grado, grupo, user_id')
      .in('id', alumnoIds)

    // Obtener profiles de alumnos
    const alumnoUserIds = alumnos?.map(a => a.user_id).filter(Boolean) || []
    const { data: alumnoProfiles } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos')
      .in('id', alumnoUserIds)

    // Combinar datos
    const pagosCompletos = pagos.map(pago => {
      const alumno = alumnos?.find(a => a.id === pago.alumno_id)
      const alumnoProfile = alumnoProfiles?.find(ap => ap.id === alumno?.user_id)

      return {
        ...pago,
        alumnos: alumno ? {
          id: alumno.id,
          matricula: alumno.matricula,
          grado: alumno.grado,
          grupo: alumno.grupo,
          profiles: alumnoProfile || { nombre: 'Desconocido', apellidos: '' }
        } : null
      }
    })

    return { success: true, data: pagosCompletos }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
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
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    // Obtener el pago
    const { data: pago } = await supabase
      .from('pagos')
      .select('id, padre_id, estado')
      .eq('id', pagoId)
      .single()

    if (!pago) {
      return { success: false, error: 'Pago no encontrado' }
    }

    if (pago.estado !== 'pendiente' && pago.estado !== 'vencido') {
      return { success: false, error: 'Este pago ya fue procesado' }
    }

    // Verificar que el usuario sea el padre del pago
    const { data: padre } = await supabase
      .from('padres')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!padre || padre.id !== pago.padre_id) {
      return { success: false, error: 'No autorizado' }
    }

    // Actualizar el pago
    const { error: updateError } = await supabase
      .from('pagos')
      .update({
        estado: 'pagado',
        metodo_pago: 'manual',
        fecha_pago: new Date().toISOString(),
        referencia_pago: referencia,
        comprobante_url: comprobanteUrl || null
      })
      .eq('id', pagoId)

    if (updateError) {
      console.error('Error al actualizar pago:', updateError)
      return { success: false, error: updateError.message }
    }

    revalidatePath('/padre/pagos')
    return { success: true, data: { message: 'Pago registrado exitosamente' } }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// VERIFICAR PAGO MANUAL (DIRECTIVO)
// ============================================

export async function verificarPagoManual(pagoId: string, aprobar: boolean): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo') {
      return { success: false, error: 'No autorizado' }
    }

    const updateData: any = {
      pagado_verificado_por: user.id
    }

    if (!aprobar) {
      // Rechazar el pago
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

    if (error) {
      console.error('Error al verificar pago:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/pagos')
    return {
      success: true,
      data: { message: aprobar ? 'Pago verificado' : 'Pago rechazado' }
    }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// CANCELAR PAGO (DIRECTIVO)
// ============================================

export async function cancelarPago(pagoId: string): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo') {
      return { success: false, error: 'No autorizado' }
    }

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
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo') {
      return { success: false, error: 'No autorizado' }
    }

    // Obtener todos los padres
    const { data: padres, error: padresError } = await supabase
      .from('padres')
      .select('id, user_id')

    if (padresError) {
      console.error('Error al obtener padres:', padresError)
      return { success: false, error: padresError.message }
    }

    if (!padres || padres.length === 0) {
      return { success: true, data: [] }
    }

    // Obtener profiles de padres
    const padreUserIds = padres.map(p => p.user_id).filter(Boolean)
    const { data: padreProfiles } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos, email')
      .in('id', padreUserIds)

    // Obtener relaciones padre-alumno
    const padreIds = padres.map(p => p.id)
    const { data: relaciones } = await supabase
      .from('padre_alumno')
      .select('padre_id, alumno_id')
      .in('padre_id', padreIds)

    // Obtener información de alumnos
    const alumnoIds = relaciones?.map(r => r.alumno_id).filter(Boolean) || []
    const { data: alumnos } = await supabase
      .from('alumnos')
      .select('id, matricula, grado, grupo, user_id')
      .in('id', alumnoIds)

    // Obtener profiles de alumnos
    const alumnoUserIds = alumnos?.map(a => a.user_id).filter(Boolean) || []
    const { data: alumnoProfiles } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos')
      .in('id', alumnoUserIds)

    // Combinar todos los datos
    const padresCompletos = padres.map(padre => {
      const padreProfile = padreProfiles?.find(pp => pp.id === padre.user_id)
      const padreRelaciones = relaciones?.filter(r => r.padre_id === padre.id) || []

      const padre_alumno = padreRelaciones.map(rel => {
        const alumno = alumnos?.find(a => a.id === rel.alumno_id)
        const alumnoProfile = alumnoProfiles?.find(ap => ap.id === alumno?.user_id)

        return {
          alumno_id: rel.alumno_id,
          alumnos: alumno ? {
            id: alumno.id,
            matricula: alumno.matricula,
            grado: alumno.grado,
            grupo: alumno.grupo,
            profiles: alumnoProfile || { nombre: 'Desconocido', apellidos: '' }
          } : null
        }
      }).filter(pa => pa.alumnos !== null)

      return {
        id: padre.id,
        profiles: padreProfile || { nombre: 'Desconocido', apellidos: '', email: '' },
        padre_alumno
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
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

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
      .eq('user_id', user.id)
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
        auto_return: 'approved',
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
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado al crear preferencia de pago' }
  }
}

// ============================================
// OBTENER DATOS COMPLETOS DE PAGO PARA RECIBO
// ============================================

export async function obtenerDatosPagoParaRecibo(pagoId: string): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    // Obtener el pago con toda la información necesaria
    const { data: pago, error: pagoError } = await supabase
      .from('pagos')
      .select(`
        id,
        concepto,
        descripcion,
        monto,
        estado,
        metodo_pago,
        fecha_pago,
        referencia_pago,
        padre_id,
        alumno_id
      `)
      .eq('id', pagoId)
      .single()

    if (pagoError || !pago) {
      return { success: false, error: 'Pago no encontrado' }
    }

    // Verificar que el pago esté pagado
    if (pago.estado !== 'pagado') {
      return { success: false, error: 'El pago aún no ha sido procesado' }
    }

    // Obtener información del padre
    const { data: padre } = await supabase
      .from('padres')
      .select('id, user_id')
      .eq('id', pago.padre_id)
      .single()

    if (!padre) {
      return { success: false, error: 'Padre no encontrado' }
    }

    const { data: padreProfile } = await supabase
      .from('profiles')
      .select('nombre, apellidos, email')
      .eq('id', padre.user_id)
      .single()

    // Obtener información del alumno
    const { data: alumno } = await supabase
      .from('alumnos')
      .select('id, matricula, grado, grupo, user_id')
      .eq('id', pago.alumno_id)
      .single()

    if (!alumno) {
      return { success: false, error: 'Alumno no encontrado' }
    }

    const { data: alumnoProfile } = await supabase
      .from('profiles')
      .select('nombre, apellidos')
      .eq('id', alumno.user_id)
      .single()

    // Verificar autorización
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const esDirectivo = profile?.role === 'directivo'
    const esPadre = padre.user_id === user.id

    if (!esDirectivo && !esPadre) {
      return { success: false, error: 'No autorizado para ver este recibo' }
    }

    // Formatear datos para el recibo
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
      alumnoNombre: alumnoProfile?.nombre || '',
      alumnoApellidos: alumnoProfile?.apellidos || '',
      alumnoMatricula: alumno.matricula,
      alumnoGrado: alumno.grado,
      alumnoGrupo: alumno.grupo,
      padreNombre: padreProfile?.nombre || '',
      padreApellidos: padreProfile?.apellidos || '',
      nombreEscuela: 'SISTEMA ESCOLAR', // Puedes hacer esto configurable
      direccionEscuela: '', // Puedes hacer esto configurable
      telefonoEscuela: '' // Puedes hacer esto configurable
    }

    return { success: true, data: datosRecibo }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
