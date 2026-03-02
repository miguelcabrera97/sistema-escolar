'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { requireServerRole } from '@/lib/auth-server'
import { Result } from '@/lib/types'
import { revalidatePath } from 'next/cache'

// ===== CREAR CURSO =====

interface CrearCursoData {
  nombre: string
  descripcion?: string
  grado: string
  grupo: string
  maestro_id: string
}

export async function crearCurso(data: CrearCursoData): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase } = auth.data

    // Verificar que el maestro existe y está activo
    const { data: maestro, error: maestroError } = await supabase
      .from('profiles')
      .select('id, role, activo')
      .eq('id', data.maestro_id)
      .eq('role', 'maestro')
      .single()

    if (maestroError || !maestro) {
      console.error('Error al verificar maestro:', maestroError)
      return { success: false, error: 'El maestro seleccionado no existe en la base de datos' }
    }

    if (!maestro.activo) {
      return { success: false, error: 'El maestro seleccionado está inactivo' }
    }

    // Crear el curso
    const { data: curso, error } = await supabase
      .from('cursos')
      .insert({
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        grado: data.grado,
        grupo: data.grupo,
        maestro_id: data.maestro_id
      })
      .select()
      .single()

    if (error) {
      console.error('Error al crear curso:', error)
      console.error('Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return { success: false, error: `Error de base de datos: ${error.message}. Verifica que el maestro exista en auth.users` }
    }

    revalidatePath('/directivo/cursos')
    return { success: true, data: curso }
  } catch (error) {
    console.error('Error general:', error)
    return { success: false, error: 'Error al crear el curso' }
  }
}

// ===== OBTENER CURSOS DEL AUXILIAR =====

export async function obtenerCursosAuxiliar(auxiliarId: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['auxiliar_calificaciones'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase } = auth.data

    // Obtener cursos asignados al auxiliar
    const { data: cursosAsignados, error } = await supabase
      .from('curso_auxiliares')
      .select(`
          curso_id,
          cursos (
            id,
            nombre,
            descripcion,
            grado,
            grupo,
            maestro_id,
            created_at
          )
        `)
      .eq('auxiliar_id', auxiliarId)

    if (error) {
      console.error('Error al obtener cursos del auxiliar:', error)
      return { success: false, error: error.message }
    }

    // Extraer solo los datos del curso
    const cursosRaw = cursosAsignados as any[]
    const cursosManaged = cursosRaw?.map(ca => ca.cursos).filter(c => c !== null) || []

    // Obtener información de los maestros
    if (cursosManaged.length > 0) {
      const maestroIds = cursosManaged.map(c => c.maestro_id).filter(Boolean)

      if (maestroIds.length > 0) {
        const { data: maestros } = await supabase
          .from('profiles')
          .select('id, nombre, apellidos')
          .in('id', maestroIds)

        // Combinar información
        const cursosConMaestro = cursosManaged.map(curso => {
          const maestro = maestros?.find(m => m.id === curso.maestro_id)
          return {
            ...curso,
            maestro: maestro ? {
              id: maestro.id,
              nombre: maestro.nombre,
              apellidos: maestro.apellidos
            } : null
          }
        })

        return { success: true, data: cursosConMaestro }
      }
    }

    return { success: true, data: cursosManaged }
  } catch (error) {
    console.error('Error general:', error)
    return { success: false, error: 'Error al obtener cursos del auxiliar' }
  }
}

// ===== OBTENER CURSOS =====

export async function obtenerCursos(): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo', 'maestro', 'auxiliar_calificaciones'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase } = auth.data

    // Obtener cursos
    const { data: cursos, error: cursosError } = await supabase
      .from('cursos')
      .select('*')
      .order('grado', { ascending: true })
      .order('grupo', { ascending: true })
      .order('nombre', { ascending: true })

    if (cursosError) {
      console.error('[obtenerCursos] Error en consulta de cursos:', cursosError)
      return { success: false, error: `Error al obtener cursos: ${cursosError.message}` }
    }

    if (!cursos || cursos.length === 0) {
      console.log('[obtenerCursos] No hay cursos en la base de datos')
      return { success: true, data: [] }
    }

    console.log('[obtenerCursos] Cursos obtenidos:', cursos.length, 'cursos')

    // Obtener los maestros (profiles) de esos cursos
    const maestroIds = cursos.map(c => c.maestro_id).filter(Boolean)

    if (maestroIds.length === 0) {
      console.log('[obtenerCursos] No hay maestros asignados')
      return { success: true, data: cursos.map(c => ({ ...c, maestro_profiles: null })) }
    }

    const { data: maestros, error: maestrosError } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos, email, activo')
      .in('id', maestroIds)

    if (maestrosError) {
      console.error('[obtenerCursos] Error al obtener maestros:', maestrosError)
      // Continuar sin los datos de maestros
    }

    // Combinar datos
    const cursosConMaestros = cursos.map(curso => {
      const maestro = maestros?.find(m => m.id === curso.maestro_id)
      return {
        ...curso,
        maestro_profiles: maestro || null
      }
    })

    console.log('[obtenerCursos] Cursos con maestros:', cursosConMaestros.length)

    return { success: true, data: cursosConMaestros }

  } catch (error) {
    return { success: false, error: 'Error al obtener cursos' }
  }
}

// ===== OBTENER CURSO POR ID =====

export async function obtenerCursoPorId(cursoId: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo', 'maestro', 'auxiliar_calificaciones', 'padre', 'alumno'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase } = auth.data

    const { data: curso, error } = await supabase
      .from('cursos')
      .select(`
        id,
        nombre,
        descripcion,
        grado,
        grupo,
        maestro_id,
        created_at,
        maestro_profiles:profiles!cursos_maestro_id_fkey(
          id,
          nombre,
          apellidos,
          email
        )
      `)
      .eq('id', cursoId)
      .single()

    if (error) {
      console.error('Error al obtener curso:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/cursos')
    return { success: true, data: curso }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error al obtener curso' }
  }
}

// ===== EDITAR CURSO =====

interface EditarCursoData {
  id: string
  nombre: string
  descripcion?: string
  grado: string
  grupo: string
  maestro_id: string
}

export async function editarCurso(data: EditarCursoData): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase } = auth.data

    // Verificar que el maestro existe y está activo
    const { data: maestro, error: maestroError } = await supabase
      .from('profiles')
      .select('id, role, activo')
      .eq('id', data.maestro_id)
      .eq('role', 'maestro')
      .single()

    if (maestroError || !maestro) {
      return { success: false, error: 'El maestro seleccionado no existe' }
    }

    if (!maestro.activo) {
      return { success: false, error: 'El maestro seleccionado está inactivo' }
    }

    // Actualizar el curso
    const { data: curso, error } = await supabase
      .from('cursos')
      .update({
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        grado: data.grado,
        grupo: data.grupo,
        maestro_id: data.maestro_id
      })
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      console.error('Error al editar curso:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/cursos')
    return { success: true, data: curso }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error al editar el curso' }
  }
}

// ===== ELIMINAR CURSO =====

export async function eliminarCurso(cursoId: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase } = auth.data

    // Verificar si hay tareas asociadas
    const { data: tareas, error: tareasError } = await supabase
      .from('tareas')
      .select('id')
      .eq('curso_id', cursoId)
      .limit(1)

    if (tareasError) {
      return { success: false, error: 'Error al verificar tareas del curso' }
    }

    if (tareas && tareas.length > 0) {
      return {
        success: false,
        error: 'No se puede eliminar el curso porque tiene tareas asociadas'
      }
    }

    // Eliminar inscripciones primero
    const { error: inscripcionesError } = await supabase
      .from('inscripciones')
      .delete()
      .eq('curso_id', cursoId)

    if (inscripcionesError) {
      return { success: false, error: 'Error al eliminar inscripciones' }
    }

    // Eliminar el curso
    const { error } = await supabase
      .from('cursos')
      .delete()
      .eq('id', cursoId)

    if (error) {
      console.error('Error al eliminar curso:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error al eliminar el curso' }
  }
}

// ===== INSCRIBIR ALUMNOS =====

interface InscribirAlumnosData {
  curso_id: string
  alumno_ids: string[]
}

export async function inscribirAlumnos(data: InscribirAlumnosData): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase } = auth.data

    // Verificar que el curso existe y obtener su grado y grupo
    const { data: curso, error: cursoError } = await supabase
      .from('cursos')
      .select('id, grado, grupo')
      .eq('id', data.curso_id)
      .single()

    if (cursoError || !curso) {
      return { success: false, error: 'El curso no existe' }
    }

    // Verificar que los alumnos existen
    const { data: alumnos, error: alumnosError } = await supabase
      .from('alumnos')
      .select('id, grado, grupo')
      .in('id', data.alumno_ids)

    if (alumnosError) {
      return { success: false, error: 'Error al verificar alumnos' }
    }

    // Obtener inscripciones existentes
    const { data: inscripcionesExistentes } = await supabase
      .from('inscripciones')
      .select('alumno_id')
      .eq('curso_id', data.curso_id)

    const alumnosYaInscritos = new Set(
      inscripcionesExistentes?.map(i => i.alumno_id) || []
    )

    // Filtrar alumnos que no están inscritos
    const alumnosNuevos = data.alumno_ids.filter(
      id => !alumnosYaInscritos.has(id)
    )

    if (alumnosNuevos.length === 0) {
      return {
        success: false,
        error: 'Todos los alumnos seleccionados ya están inscritos en este curso'
      }
    }

    // Crear inscripciones
    const inscripciones = alumnosNuevos.map(alumno_id => ({
      curso_id: data.curso_id,
      alumno_id: alumno_id
    }))

    const { data: nuevasInscripciones, error } = await supabase
      .from('inscripciones')
      .insert(inscripciones)
      .select()

    if (error) {
      console.error('Error al inscribir alumnos:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/directivo/cursos/${data.curso_id}`)
    return {
      success: true,
      data: {
        inscritos: nuevasInscripciones?.length || 0,
        yaInscritos: data.alumno_ids.length - alumnosNuevos.length
      }
    }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error al inscribir alumnos' }
  }
}

// ===== OBTENER ALUMNOS INSCRITOS =====

export async function obtenerAlumnosInscritos(cursoId: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo', 'maestro', 'auxiliar_calificaciones'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase } = auth.data

    // Obtener inscripciones primero
    const { data: inscripciones, error: inscripcionesError } = await supabase
      .from('inscripciones')
      .select('id, alumno_id, created_at')
      .eq('curso_id', cursoId)
      .order('created_at', { ascending: false })

    if (inscripcionesError) {
      console.error('Error al obtener inscripciones:', inscripcionesError)
      return { success: false, error: inscripcionesError.message }
    }

    if (!inscripciones || inscripciones.length === 0) {
      return { success: true, data: [] }
    }

    // Obtener datos de los alumnos
    const alumnoIds = inscripciones.map(i => i.alumno_id)

    const { data: alumnos, error: alumnosError } = await supabase
      .from('alumnos')
      .select(`
        id,
        matricula,
        grado,
        grupo,
        user_id
      `)
      .in('id', alumnoIds)

    if (alumnosError) {
      console.error('Error al obtener alumnos:', alumnosError)
      return { success: false, error: alumnosError.message }
    }

    // Obtener profiles de los alumnos
    const userIds = alumnos?.map(a => a.user_id).filter(Boolean) || []

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos, email, activo')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error al obtener profiles:', profilesError)
    }

    // Combinar datos
    const inscripcionesCompletas = inscripciones.map(inscripcion => {
      const alumno = alumnos?.find(a => a.id === inscripcion.alumno_id)
      const profile = profiles?.find(p => p.id === alumno?.user_id)

      return {
        id: inscripcion.id,
        alumno_id: inscripcion.alumno_id,
        created_at: inscripcion.created_at,
        alumnos: alumno ? {
          id: alumno.id,
          matricula: alumno.matricula,
          grado: alumno.grado,
          grupo: alumno.grupo,
          profiles: profile || {
            nombre: 'Desconocido',
            apellidos: '',
            email: '',
            activo: false
          }
        } : null
      }
    }).filter(i => i.alumnos !== null)

    return { success: true, data: inscripcionesCompletas }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error al obtener alumnos inscritos' }
  }
}

// ===== DESINSCRIBIR ALUMNO =====

export async function desinscribirAlumno(inscripcionId: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase } = auth.data

    const { error } = await supabase
      .from('inscripciones')
      .delete()
      .eq('id', inscripcionId)

    if (error) {
      console.error('Error al desinscribir alumno:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error al desinscribir alumno' }
  }
}

// ===== OBTENER ALUMNOS DISPONIBLES (NO INSCRITOS) =====

export async function obtenerAlumnosDisponibles(cursoId: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success || !auth.data) return { success: false, error: auth.error || 'No autorizado' }
    const { supabase } = auth.data

    // Obtener todos los alumnos
    const { data: todosAlumnos, error: alumnosError } = await supabase
      .from('alumnos')
      .select('id, matricula, grado, grupo, user_id')

    if (alumnosError) {
      console.error('Error al obtener alumnos:', alumnosError)
      return { success: false, error: 'Error al obtener alumnos' }
    }

    if (!todosAlumnos || todosAlumnos.length === 0) {
      return { success: true, data: [] }
    }

    // Obtener profiles de los alumnos
    const userIds = todosAlumnos.map(a => a.user_id).filter(Boolean)

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos, email, activo')
      .in('id', userIds)
      .eq('activo', true)

    if (profilesError) {
      console.error('Error al obtener profiles:', profilesError)
    }

    // Filtrar solo alumnos con profiles activos
    const alumnosActivos = todosAlumnos
      .map(alumno => {
        const profile = profiles?.find(p => p.id === alumno.user_id)
        if (!profile) return null

        return {
          id: alumno.id,
          matricula: alumno.matricula,
          grado: alumno.grado,
          grupo: alumno.grupo,
          profiles: profile
        }
      })
      .filter(Boolean)

    // Obtener alumnos ya inscritos en este curso
    const { data: inscritos, error: inscritosError } = await supabase
      .from('inscripciones')
      .select('alumno_id')
      .eq('curso_id', cursoId)

    if (inscritosError) {
      console.error('Error al obtener inscritos:', inscritosError)
      return { success: false, error: 'Error al obtener inscritos' }
    }

    const alumnosInscritosIds = new Set(inscritos?.map(i => i.alumno_id) || [])

    // Filtrar alumnos no inscritos
    const alumnosDisponibles = alumnosActivos.filter(
      alumno => alumno && !alumnosInscritosIds.has(alumno.id)
    )

    return { success: true, data: alumnosDisponibles }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error al obtener alumnos disponibles' }
  }
}
