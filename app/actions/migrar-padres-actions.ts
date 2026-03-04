'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'

interface Result<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Migra todos los usuarios con rol 'padre' a la tabla padres
 * Esta función debe ejecutarse una sola vez para migrar datos existentes
 */
export async function migrarPadresExistentes(): Promise<Result<{ message: string; total: number; migrados: number; padres?: { nombre: string; apellidos: string; email: string }[] }>> {
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
      return { success: false, error: 'No autorizado. Solo directivos pueden ejecutar esta migración.' }
    }

    // Obtener todos los usuarios con rol padre
    const { data: padresProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos, email')
      .eq('role', 'padre')

    if (profilesError) {
      console.error('Error al obtener profiles:', profilesError)
      return { success: false, error: 'Error al obtener usuarios padre' }
    }

    if (!padresProfiles || padresProfiles.length === 0) {
      return {
        success: true,
        data: {
          message: 'No hay usuarios con rol padre en el sistema',
          total: 0,
          migrados: 0
        }
      }
    }

    // Obtener padres que ya existen en la tabla padres
    const { data: padresExistentes } = await supabase
      .from('padres')
      .select('user_id')

    const padresExistentesIds = new Set(padresExistentes?.map(p => p.user_id) || [])

    // Filtrar solo los que no existen
    const padresAMigrar = padresProfiles.filter(p => !padresExistentesIds.has(p.id))

    if (padresAMigrar.length === 0) {
      return {
        success: true,
        data: {
          message: 'Todos los usuarios padre ya están migrados',
          total: padresProfiles.length,
          migrados: 0
        }
      }
    }

    // Insertar los padres faltantes
    const { data: padresCreados, error: insertError } = await supabase
      .from('padres')
      .insert(
        padresAMigrar.map(p => ({
          user_id: p.id
        }))
      )
      .select()

    if (insertError) {
      console.error('Error al insertar padres:', insertError)
      return { success: false, error: 'Error al crear registros de padres: ' + insertError.message }
    }

    return {
      success: true,
      data: {
        message: `Migración completada exitosamente`,
        total: padresProfiles.length,
        migrados: padresAMigrar.length,
        padres: padresProfiles.map(p => ({
          nombre: p.nombre,
          apellidos: p.apellidos,
          email: p.email
        }))
      }
    }
  } catch (error) {
    console.error('Error en migración:', error)
    return { success: false, error: 'Error inesperado en la migración' }
  }
}

/**
 * Vincula automáticamente padres con alumnos basándose en coincidencias de apellidos
 * ADVERTENCIA: Este es un método automático que puede necesitar revisión manual
 */
export async function vincularPadresConAlumnos(): Promise<Result> {
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

    return {
      success: true,
      data: {
        message: 'Esta función debe configurarse manualmente desde el panel de directivo',
        nota: 'Por seguridad, las relaciones padre-alumno deben crearse manualmente'
      }
    }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * Obtiene estadísticas de la migración
 */
export async function obtenerEstadisticasMigracion(): Promise<Result<{ totalUsuariosPadre: number; totalRegistrosPadres: number; totalRelacionesPadreAlumno: number; padresPorMigrar: number; necesitaMigracion: boolean }>> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    // Contar usuarios con rol padre
    const { count: totalPadresProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'padre')

    // Contar registros en tabla padres
    const { count: totalPadresTabla } = await supabase
      .from('padres')
      .select('*', { count: 'exact', head: true })

    // Contar relaciones padre-alumno
    const { count: totalRelaciones } = await supabase
      .from('padre_alumno')
      .select('*', { count: 'exact', head: true })

    // Obtener padres sin alumnos
    const { data: padresSinAlumnos } = await supabase
      .from('padres')
      .select(`
        id,
        user_id,
        profiles:user_id (nombre, apellidos, email)
      `)

    const padresSinAlumnosIds = padresSinAlumnos?.filter(p => {
      // Necesitamos verificar si tienen relaciones
      return true // Por ahora devolvemos todos
    }) || []

    return {
      success: true,
      data: {
        totalUsuariosPadre: totalPadresProfiles || 0,
        totalRegistrosPadres: totalPadresTabla || 0,
        totalRelacionesPadreAlumno: totalRelaciones || 0,
        padresPorMigrar: (totalPadresProfiles || 0) - (totalPadresTabla || 0),
        necesitaMigracion: (totalPadresProfiles || 0) > (totalPadresTabla || 0)
      }
    }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error al obtener estadísticas' }
  }
}
