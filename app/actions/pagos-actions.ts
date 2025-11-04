'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

interface Result {
  success: boolean
  data?: any
  error?: string
}

async function checkDirectivoRole() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'directivo') {
    return { success: false, error: 'No autorizado' }
  }

  return { success: true, user }
}

export async function obtenerPagosDirectivo(): Promise<Result> {
  try {
    const authResult = await checkDirectivoRole()
    if (!authResult.success) return authResult

    const { data: pagos, error } = await supabase
      .from('pagos')
      .select('*, alumnos(id, matricula, grado, grupo, profiles(nombre, apellidos))')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: 'Error al obtener los pagos' }
    }

    return { success: true, data: pagos }
  } catch (error) {
    console.error('Error en obtenerPagosDirectivo:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function crearPagoDirectivo(formData: FormData): Promise<Result> {
  try {
    const authResult = await checkDirectivoRole()
    if (!authResult.success) return authResult

    const alumno_id = formData.get('alumno_id') as string
    const concepto = formData.get('concepto') as string
    const descripcion = formData.get('descripcion') as string
    const monto = formData.get('monto') as string
    const fecha_entrega = formData.get('fecha_entrega') as string

    if (!alumno_id || !concepto || !monto || !fecha_entrega) {
      return { success: false, error: 'Faltan campos requeridos' }
    }

    const { error } = await supabase
      .from('pagos')
      .insert({
        alumno_id,
        concepto,
        descripcion: descripcion || null,
        monto: parseFloat(monto),
        fecha_entrega,
        status: 'pendiente'
      })

    if (error) {
      return { success: false, error: 'Error al crear el pago' }
    }

    revalidatePath('/directivo/pagos')
    return { success: true, data: { message: 'Pago creado exitosamente' } }

  } catch (error) {
    console.error('Error en crearPagoDirectivo:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function marcarPagoComoPagado(pagoId: string): Promise<Result> {
  try {
    const authResult = await checkDirectivoRole()
    if (!authResult.success) return authResult

    if (!pagoId) {
      return { success: false, error: 'ID de pago no proporcionado' }
    }

    const { error } = await supabase
      .from('pagos')
      .update({
        status: 'pagado',
        fecha_pago: new Date().toISOString()
      })
      .eq('id', pagoId)

    if (error) {
      return { success: false, error: 'Error al actualizar el pago' }
    }

    revalidatePath('/directivo/pagos')
    revalidatePath('/padre/pagos') // Revalidar la vista del padre también
    return { success: true, data: { message: 'Pago marcado como pagado' } }

  } catch (error) {
    console.error('Error en marcarPagoComoPagado:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
