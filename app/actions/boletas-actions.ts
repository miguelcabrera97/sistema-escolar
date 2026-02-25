'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireServerRole } from '@/lib/auth-server'
import { Result } from '@/lib/types'
import { revalidatePath } from 'next/cache'

/**
 * Subir una boleta en PDF para un alumno
 */
export async function subirBoleta(formData: FormData): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo', 'auxiliar_calificaciones'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase, userId } = auth.data

    const alumno_id = formData.get('alumno_id') as string
    const periodo = formData.get('periodo') as string
    const ciclo_escolar = formData.get('ciclo_escolar') as string
    const notas = formData.get('notas') as string
    const archivo = formData.get('archivo') as File

    if (!alumno_id || !periodo || !ciclo_escolar || !archivo) {
      return { success: false, error: 'Faltan campos requeridos' }
    }

    // Validar que sea PDF
    if (archivo.type !== 'application/pdf') {
      return { success: false, error: 'El archivo debe ser un PDF' }
    }

    // Validar tamaño (máximo 10MB)
    if (archivo.size > 10 * 1024 * 1024) {
      return { success: false, error: 'El archivo no debe superar 10MB' }
    }

    // Generar nombre único para el archivo (siempre con timestamp para evitar duplicados)
    const timestamp = Date.now()
    const fileName = `${alumno_id}_${periodo}_${ciclo_escolar}_${timestamp}.pdf`
    const filePath = `${alumno_id}/${fileName}`

    // Subir archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('boletas')
      .upload(filePath, archivo, {
        contentType: 'application/pdf',
        upsert: false // No reemplazar, crear siempre nuevo
      })

    if (uploadError) {
      console.error('Error al subir archivo:', uploadError)
      return { success: false, error: 'Error al subir el archivo: ' + uploadError.message }
    }

    // Obtener URL pública del archivo
    const { data: { publicUrl } } = supabase.storage
      .from('boletas')
      .getPublicUrl(filePath)

    // Crear nuevo registro (siempre insertar, nunca actualizar)
    const boletaData = {
      alumno_id,
      periodo,
      ciclo_escolar,
      archivo_url: publicUrl,
      archivo_nombre: archivo.name,
      subido_por: userId,
      notas: notas || null
    }

    const { error: insertError } = await supabase
      .from('boletas')
      .insert(boletaData)

    if (insertError) {
      console.error('Error al crear boleta:', insertError)
      return { success: false, error: 'Error al guardar la boleta' }
    }

    revalidatePath('/directivo/boletas')
    return { success: true, data: { message: 'Boleta subida exitosamente' } }

  } catch (error) {
    console.error('Error en subirBoleta:', error)
    return { success: false, error: 'Error inesperado al subir la boleta' }
  }
}

/**
 * Obtener todas las boletas de un alumno
 */
export async function obtenerBoletasAlumno(alumnoId: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo', 'padre', 'alumno'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase, userId, role } = auth.data

    const { data: alumno } = await supabase.from('alumnos').select('user_id').eq('id', alumnoId).single()

    const esDirectivo = role === 'directivo'
    const esAlumno = alumno?.user_id === userId

    // Verificar si es padre del alumno
    let esPadre = false
    if (!esDirectivo && !esAlumno) {
      const { data: padreData } = await supabase
        .from('padres')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (padreData) {
        const { data: relacion } = await supabase
          .from('padre_alumno')
          .select('padre_id')
          .eq('padre_id', padreData.id)
          .eq('alumno_id', alumnoId)
          .single()

        esPadre = !!relacion
      }
    }

    if (!esDirectivo && !esPadre && !esAlumno) {
      return { success: false, error: 'No autorizado para ver estas boletas' }
    }

    const { data: boletas, error } = await supabase
      .from('boletas')
      .select(`
        id,
        periodo,
        ciclo_escolar,
        archivo_url,
        archivo_nombre,
        fecha_subida,
        notas,
        subido_por,
        profiles:subido_por(nombre, apellidos)
      `)
      .eq('alumno_id', alumnoId)
      .order('fecha_subida', { ascending: false })

    if (error) {
      console.error('Error al obtener boletas:', error)
      return { success: false, error: 'Error al obtener las boletas' }
    }

    // Formatear datos
    const boletasFormateadas = boletas?.map(b => {
      const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles
      return {
        ...b,
        subido_por_nombre: profile ? `${profile.nombre} ${profile.apellidos}` : 'Sistema'
      }
    }) || []

    return { success: true, data: boletasFormateadas }

  } catch (error) {
    console.error('Error en obtenerBoletasAlumno:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Obtener boletas de todos los alumnos (para directivo)
 */
export async function obtenerTodasLasBoletas(): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    // Verificar que sea directivo
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo' && profile?.role !== 'auxiliar_calificaciones') {
      return { success: false, error: 'No autorizado' }
    }

    const { data: boletas, error } = await supabase
      .from('boletas')
      .select(`
        id,
        alumno_id,
        periodo,
        ciclo_escolar,
        archivo_url,
        archivo_nombre,
        fecha_subida,
        notas,
        alumnos (
          matricula,
          grado,
          grupo,
          profiles:user_id(nombre, apellidos)
        ),
        profiles:subido_por(nombre, apellidos)
      `)
      .order('fecha_subida', { ascending: false })

    if (error) {
      console.error('Error al obtener boletas:', error)
      return { success: false, error: 'Error al obtener las boletas' }
    }

    return { success: true, data: boletas }

  } catch (error) {
    console.error('Error en obtenerTodasLasBoletas:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Eliminar una boleta
 */
export async function eliminarBoleta(boletaId: string): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado' }
    }

    // Verificar que sea directivo
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo' && profile?.role !== 'auxiliar_calificaciones') {
      return { success: false, error: 'No autorizado' }
    }

    // Obtener la boleta para eliminar el archivo del storage
    const { data: boleta } = await supabase
      .from('boletas')
      .select('archivo_url')
      .eq('id', boletaId)
      .single()

    if (boleta) {
      // Extraer el path del archivo
      const filePath = boleta.archivo_url.split('/boletas/')[1]
      if (filePath) {
        await supabase.storage
          .from('boletas')
          .remove([filePath])
      }
    }

    // Eliminar registro de la base de datos
    const { error } = await supabase
      .from('boletas')
      .delete()
      .eq('id', boletaId)

    if (error) {
      console.error('Error al eliminar boleta:', error)
      return { success: false, error: 'Error al eliminar la boleta' }
    }

    return { success: true, data: { message: 'Boleta eliminada exitosamente' } }

  } catch (error) {
    console.error('Error en eliminarBoleta:', error)
    return { success: false, error: 'Error inesperado al eliminar la boleta' }
  }
}

/**
 * Obtener URL firmada para descargar boleta (con expiración)
 */
export async function obtenerUrlDescargaBoleta(boletaId: string): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()
    // Obtener información de la boleta
    const { data: boleta, error } = await supabase
      .from('boletas')
      .select('archivo_url')
      .eq('id', boletaId)
      .single()

    if (error || !boleta) {
      return { success: false, error: 'Boleta no encontrada' }
    }

    // Extraer el path del archivo
    const filePath = boleta.archivo_url.split('/boletas/')[1]

    if (!filePath) {
      return { success: false, error: 'Ruta de archivo inválida' }
    }

    // Generar URL firmada (válida por 1 hora)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('boletas')
      .createSignedUrl(filePath, 3600)

    if (signedError || !signedUrlData) {
      console.error('Error al generar URL firmada:', signedError)
      return { success: false, error: 'Error al generar enlace de descarga' }
    }

    return { success: true, data: { url: signedUrlData.signedUrl } }

  } catch (error) {
    console.error('Error en obtenerUrlDescargaBoleta:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
