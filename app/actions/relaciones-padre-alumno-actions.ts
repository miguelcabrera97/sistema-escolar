'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

interface Result<T = any> {
  success: boolean
  data?: T
  error?: string
}

// ============================================
// OBTENER PADRES SIN ALUMNOS
// ============================================

export async function obtenerPadresConAlumnosBusqueda(): Promise<Result<any[]>> {
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
    const { data: padres } = await supabase
      .from('padres')
      .select('id, user_id')

    if (!padres) return { success: true, data: [] }

    // Obtener profiles de padres
    const padreUserIds = padres.map(p => p.user_id)
    const { data: padreProfiles } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos, email')
      .in('id', padreUserIds)

    // Obtener relaciones existentes
    const padreIds = padres.map(p => p.id)
    const { data: relaciones } = await supabase
      .from('padre_alumno')
      .select('padre_id, alumno_id')
      .in('padre_id', padreIds)

    // Filtrar padres con alumnos
    const padresConAlumnosSet = new Set(relaciones?.map(r => r.padre_id) || [])

    const padresConAlumnos = padres
      .filter(p => padresConAlumnosSet.has(p.id))
      .map(padre => {
        const profile = padreProfiles?.find(pp => pp.id === padre.user_id)
        return {
          id: padre.id,
          user_id: padre.user_id,
          profiles: profile || { nombre: 'Desconocido', apellidos: '', email: '' }
        }
      })

    return { success: true, data: padresConAlumnos }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function obtenerPadresSinAlumnos(): Promise<Result<any[]>> {
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
    const { data: padres } = await supabase
      .from('padres')
      .select('id, user_id')

    if (!padres) return { success: true, data: [] }

    // Obtener profiles de padres
    const padreUserIds = padres.map(p => p.user_id)
    const { data: padreProfiles } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos, email')
      .in('id', padreUserIds)

    // Obtener relaciones existentes
    const padreIds = padres.map(p => p.id)
    const { data: relaciones } = await supabase
      .from('padre_alumno')
      .select('padre_id, alumno_id')
      .in('padre_id', padreIds)

    // Filtrar padres sin alumnos
    const padresConAlumnos = new Set(relaciones?.map(r => r.padre_id) || [])

    const padresSinAlumnos = padres
      .filter(p => !padresConAlumnos.has(p.id))
      .map(padre => {
        const profile = padreProfiles?.find(pp => pp.id === padre.user_id)
        return {
          id: padre.id,
          user_id: padre.user_id,
          profiles: profile || { nombre: 'Desconocido', apellidos: '', email: '' }
        }
      })

    return { success: true, data: padresSinAlumnos }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// OBTENER ALUMNOS SIN PADRE
// ============================================

export async function obtenerAlumnosSinPadre(): Promise<Result<any[]>> {
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

    // Obtener todos los alumnos
    const { data: alumnos } = await supabase
      .from('alumnos')
      .select('id, matricula, grado, grupo, user_id')

    if (!alumnos) return { success: true, data: [] }

    // Obtener profiles de alumnos
    const alumnoUserIds = alumnos.map(a => a.user_id)
    const { data: alumnoProfiles } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos')
      .in('id', alumnoUserIds)

    // Obtener relaciones existentes
    const alumnoIds = alumnos.map(a => a.id)
    const { data: relaciones } = await supabase
      .from('padre_alumno')
      .select('alumno_id')
      .in('alumno_id', alumnoIds)

    // Filtrar alumnos sin padres
    const alumnosConPadre = new Set(relaciones?.map(r => r.alumno_id) || [])

    const alumnosSinPadre = alumnos
      .filter(a => !alumnosConPadre.has(a.id))
      .map(alumno => {
        const profile = alumnoProfiles?.find(ap => ap.id === alumno.user_id)
        return {
          id: alumno.id,
          matricula: alumno.matricula,
          grado: alumno.grado,
          grupo: alumno.grupo,
          profiles: profile || { nombre: 'Desconocido', apellidos: '' }
        }
      })

    return { success: true, data: alumnosSinPadre }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// OBTENER TODAS LAS RELACIONES
// ============================================

export async function obtenerTodasLasRelaciones(): Promise<Result<any[]>> {
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

    // Obtener todas las relaciones
    const { data: relaciones } = await supabase
      .from('padre_alumno')
      .select('id, padre_id, alumno_id, parentesco')

    if (!relaciones || relaciones.length === 0) {
      return { success: true, data: [] }
    }

    // Obtener información de padres
    const padreIds = [...new Set(relaciones.map(r => r.padre_id))]
    const { data: padres } = await supabase
      .from('padres')
      .select('id, user_id')
      .in('id', padreIds)

    const padreUserIds = padres?.map(p => p.user_id) || []
    const { data: padreProfiles } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos, email')
      .in('id', padreUserIds)

    // Obtener información de alumnos
    const alumnoIds = [...new Set(relaciones.map(r => r.alumno_id))]
    const { data: alumnos } = await supabase
      .from('alumnos')
      .select('id, matricula, grado, grupo, user_id')
      .in('id', alumnoIds)

    const alumnoUserIds = alumnos?.map(a => a.user_id) || []
    const { data: alumnoProfiles } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos')
      .in('id', alumnoUserIds)

    // Combinar datos
    const relacionesCompletas = relaciones.map(rel => {
      const padre = padres?.find(p => p.id === rel.padre_id)
      const padreProfile = padreProfiles?.find(pp => pp.id === padre?.user_id)

      const alumno = alumnos?.find(a => a.id === rel.alumno_id)
      const alumnoProfile = alumnoProfiles?.find(ap => ap.id === alumno?.user_id)

      return {
        id: rel.id,
        parentesco: rel.parentesco,
        padre: padre ? {
          id: padre.id,
          profiles: padreProfile || { nombre: 'Desconocido', apellidos: '', email: '' }
        } : null,
        alumno: alumno ? {
          id: alumno.id,
          matricula: alumno.matricula,
          grado: alumno.grado,
          grupo: alumno.grupo,
          profiles: alumnoProfile || { nombre: 'Desconocido', apellidos: '' }
        } : null
      }
    })

    return { success: true, data: relacionesCompletas }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// CREAR RELACIÓN PADRE-ALUMNO
// ============================================

export async function crearRelacionPadreAlumno(
  padreId: string,
  alumnoId: string,
  parentesco: string = 'Padre/Madre'
): Promise<Result> {
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

    // Verificar que no exista ya la relación
    const { data: existente } = await supabase
      .from('padre_alumno')
      .select('id')
      .eq('padre_id', padreId)
      .eq('alumno_id', alumnoId)
      .single()

    if (existente) {
      return { success: false, error: 'Esta relación ya existe' }
    }

    // Crear la relación
    const { data, error } = await supabase
      .from('padre_alumno')
      .insert({
        padre_id: padreId,
        alumno_id: alumnoId,
        parentesco: parentesco
      })
      .select()
      .single()

    if (error) {
      console.error('Error al crear relación:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/relaciones-padre-alumno')
    return { success: true, data }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// ELIMINAR RELACIÓN PADRE-ALUMNO
// ============================================

export async function eliminarRelacionPadreAlumno(relacionId: string): Promise<Result> {
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
      .from('padre_alumno')
      .delete()
      .eq('id', relacionId)

    if (error) {
      console.error('Error al eliminar relación:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/relaciones-padre-alumno')
    return { success: true, data: { message: 'Relación eliminada' } }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
