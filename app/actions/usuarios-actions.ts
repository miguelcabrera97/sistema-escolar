'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// Tipos para los formularios
export interface CrearAlumnoData {
  email: string
  password: string
  nombre: string
  apellidos: string
  matricula: string
  grado: string
  grupo: string
  fecha_nacimiento?: string
  telefono?: string
}

export interface CrearMaestroData {
  email: string
  password: string
  nombre: string
  apellidos: string
  especialidad?: string
  telefono?: string
}

/**
 * Crear un nuevo alumno en el sistema
 * Solo puede ser ejecutado por usuarios con rol 'directivo'
 */
export async function crearAlumno(data: CrearAlumnoData) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verificar que el usuario sea directivo
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
      return { success: false, error: 'No autorizado. Solo directivos pueden crear alumnos.' }
    }

    // Verificar que la matrícula no exista
    const { data: existingMatricula } = await supabase
      .from('alumnos')
      .select('id')
      .eq('matricula', data.matricula)
      .single()

    if (existingMatricula) {
      return { success: false, error: 'La matrícula ya existe' }
    }

    // Crear usuario en Supabase Auth
    // Nota: Esto requiere que tengas configurado el service_role_key
    // o usar la función de admin de Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nombre: data.nombre,
          apellidos: data.apellidos,
          role: 'alumno'
        }
      }
    })

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Error al crear usuario' }
    }

    const userId = authData.user.id

    // Crear perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        role: 'alumno',
        telefono: data.telefono
      })

    if (profileError) {
      // Si falla, intentar eliminar el usuario de auth
      return { success: false, error: 'Error al crear perfil: ' + profileError.message }
    }

    // Crear registro de alumno
    const { error: alumnoError } = await supabase
      .from('alumnos')
      .insert({
        user_id: userId,
        matricula: data.matricula,
        grado: data.grado,
        grupo: data.grupo,
        fecha_nacimiento: data.fecha_nacimiento
      })

    if (alumnoError) {
      return { success: false, error: 'Error al crear alumno: ' + alumnoError.message }
    }

    // Revalidar las páginas que muestran alumnos
    revalidatePath('/directivo/alumnos')
    revalidatePath('/directivo')

    return {
      success: true,
      message: 'Alumno creado exitosamente',
      userId
    }

  } catch (error) {
    console.error('Error al crear alumno:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Crear un nuevo maestro en el sistema
 * Solo puede ser ejecutado por usuarios con rol 'directivo'
 */
export async function crearMaestro(data: CrearMaestroData) {
  try {
    const supabase = await createServerSupabaseClient()

    // Verificar que el usuario sea directivo
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
      return { success: false, error: 'No autorizado. Solo directivos pueden crear maestros.' }
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nombre: data.nombre,
          apellidos: data.apellidos,
          role: 'maestro'
        }
      }
    })

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Error al crear usuario' }
    }

    const userId = authData.user.id

    // Crear perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        role: 'maestro',
        telefono: data.telefono
      })

    if (profileError) {
      return { success: false, error: 'Error al crear perfil: ' + profileError.message }
    }

    // Si se proporcionó especialidad, crear registro adicional si tienes tabla de maestros
    // Si no tienes tabla maestros, puedes guardar la especialidad en profiles o crear la tabla

    // Revalidar las páginas que muestran maestros
    revalidatePath('/directivo/maestros')
    revalidatePath('/directivo')

    return {
      success: true,
      message: 'Maestro creado exitosamente',
      userId
    }

  } catch (error) {
    console.error('Error al crear maestro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Obtener lista de todos los alumnos (para directivo)
 */
export async function obtenerAlumnos() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado', data: [] }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo') {
      return { success: false, error: 'No autorizado', data: [] }
    }

    const { data: alumnos, error } = await supabase
      .from('alumnos')
      .select(`
        *,
        profiles (
          nombre,
          apellidos,
          email,
          telefono
        )
      `)
      .order('matricula')

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: alumnos || [] }

  } catch (error) {
    console.error('Error al obtener alumnos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: []
    }
  }
}

/**
 * Obtener lista de todos los maestros (para directivo)
 */
export async function obtenerMaestros() {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado', data: [] }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo') {
      return { success: false, error: 'No autorizado', data: [] }
    }

    const { data: maestros, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'maestro')
      .order('apellidos')

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: maestros || [] }

  } catch (error) {
    console.error('Error al obtener maestros:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: []
    }
  }
}
