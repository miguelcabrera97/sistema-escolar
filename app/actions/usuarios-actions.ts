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

export interface EditarAlumnoData {
  id: string
  nombre: string
  apellidos: string
  matricula: string
  grado: string
  grupo: string
  fecha_nacimiento?: string
  telefono?: string
  email: string
}

export interface EditarMaestroData {
  id: string
  nombre: string
  apellidos: string
  email: string
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
        telefono: data.telefono || null
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
        fecha_nacimiento: data.fecha_nacimiento || null
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
        telefono: data.telefono || null
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

/**
 * Editar información de un alumno existente
 * Solo puede ser ejecutado por usuarios con rol 'directivo'
 */
export async function editarAlumno(data: EditarAlumnoData) {
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
      return { success: false, error: 'No autorizado. Solo directivos pueden editar alumnos.' }
    }

    // Verificar que el alumno exista
    const { data: existingAlumno } = await supabase
      .from('alumnos')
      .select('user_id')
      .eq('id', data.id)
      .single()

    if (!existingAlumno) {
      return { success: false, error: 'Alumno no encontrado' }
    }

    // Verificar que la matrícula no esté en uso por otro alumno
    const { data: matriculaCheck } = await supabase
      .from('alumnos')
      .select('id')
      .eq('matricula', data.matricula)
      .neq('id', data.id)
      .single()

    if (matriculaCheck) {
      return { success: false, error: 'La matrícula ya está en uso por otro alumno' }
    }

    // Actualizar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        telefono: data.telefono || null
      })
      .eq('id', existingAlumno.user_id)

    if (profileError) {
      return { success: false, error: 'Error al actualizar perfil: ' + profileError.message }
    }

    // Actualizar información del alumno
    const { error: alumnoError } = await supabase
      .from('alumnos')
      .update({
        matricula: data.matricula,
        grado: data.grado,
        grupo: data.grupo,
        fecha_nacimiento: data.fecha_nacimiento || null
      })
      .eq('id', data.id)

    if (alumnoError) {
      return { success: false, error: 'Error al actualizar alumno: ' + alumnoError.message }
    }

    // Revalidar las páginas
    revalidatePath('/directivo/alumnos')
    revalidatePath('/directivo/usuarios')
    revalidatePath('/directivo')

    return {
      success: true,
      message: 'Alumno actualizado exitosamente'
    }

  } catch (error) {
    console.error('Error al editar alumno:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Editar información de un maestro existente
 * Solo puede ser ejecutado por usuarios con rol 'directivo'
 */
export async function editarMaestro(data: EditarMaestroData) {
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
      return { success: false, error: 'No autorizado. Solo directivos pueden editar maestros.' }
    }

    // Verificar que el maestro exista y tenga rol de maestro
    const { data: existingMaestro } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', data.id)
      .single()

    if (!existingMaestro) {
      return { success: false, error: 'Maestro no encontrado' }
    }

    if (existingMaestro.role !== 'maestro') {
      return { success: false, error: 'El usuario no es un maestro' }
    }

    // Actualizar perfil del maestro
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        telefono: data.telefono || null
      })
      .eq('id', data.id)

    if (profileError) {
      return { success: false, error: 'Error al actualizar maestro: ' + profileError.message }
    }

    // Revalidar las páginas
    revalidatePath('/directivo/usuarios')
    revalidatePath('/directivo')

    return {
      success: true,
      message: 'Maestro actualizado exitosamente'
    }

  } catch (error) {
    console.error('Error al editar maestro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Obtener datos completos de un alumno para edición
 */
export async function obtenerAlumnoPorId(alumnoId: string) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado', data: null }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo') {
      return { success: false, error: 'No autorizado', data: null }
    }

    const { data: alumno, error } = await supabase
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
      .eq('id', alumnoId)
      .single()

    if (error || !alumno) {
      return { success: false, error: 'Alumno no encontrado', data: null }
    }

    return { success: true, data: alumno }

  } catch (error) {
    console.error('Error al obtener alumno:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: null
    }
  }
}

/**
 * Obtener datos completos de un maestro para edición
 */
export async function obtenerMaestroPorId(maestroId: string) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'No autenticado', data: null }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'directivo') {
      return { success: false, error: 'No autorizado', data: null }
    }

    const { data: maestro, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', maestroId)
      .eq('role', 'maestro')
      .single()

    if (error || !maestro) {
      return { success: false, error: 'Maestro no encontrado', data: null }
    }

    return { success: true, data: maestro }

  } catch (error) {
    console.error('Error al obtener maestro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: null
    }
  }
}
