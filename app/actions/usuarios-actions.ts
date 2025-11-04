'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { User, SupabaseClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Tipo para teléfonos de emergencia
export interface TelefonoEmergencia {
  nombre: string
  numero: string
}

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
  curp?: string
  nombre_tutor?: string
  informacion_medica?: string
  telefonos_emergencia?: TelefonoEmergencia[]
}

export interface CrearMaestroData {
  email: string
  password: string
  nombre: string
  apellidos: string
  especialidad?: string
  telefono?: string
}

export interface CrearAuxiliarData {
  email: string
  password: string
  nombre: string
  apellidos: string
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
  curp?: string
  nombre_tutor?: string
  informacion_medica?: string
  telefonos_emergencia?: TelefonoEmergencia[]
}

export interface EditarMaestroData {
  id: string
  nombre: string
  apellidos: string
  email: string
  especialidad?: string
  telefono?: string
}

type UserRole = 'alumno' | 'maestro' | 'auxiliar_calificaciones' | 'directivo'

/**
 * Helper para verificar que el usuario actual es un directivo.
 * Lanza un error si no está autenticado o no tiene el rol correcto.
 */
async function requireDirectivoRole(supabase: SupabaseClient): Promise<User> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || profile?.role !== 'directivo') {
    throw new Error('No autorizado. Se requiere rol de directivo.')
  }

  return user
}

/**
 * Crear un nuevo alumno en el sistema
 * Solo puede ser ejecutado por usuarios con rol 'directivo'
 */
export async function crearAlumno(data: CrearAlumnoData) {
  const supabase = await createServerSupabaseClient()
  try {
    await requireDirectivoRole(supabase)
    // Verificar que la matrícula no exista
    const { data: existingMatricula } = await supabase
      .from('alumnos')
      .select('id')
      .eq('matricula', data.matricula)
      .single()

    if (existingMatricula) {
      return { success: false, error: 'La matrícula ya existe' }
    }

    // Crear usuario y perfil de forma transaccional
    const userResult = await crearUsuario(data, 'alumno')
    if (!userResult.success) return userResult

    // Crear registro de alumno
    const { error: alumnoError } = await supabase
      .from('alumnos')
      .insert({
        user_id: userResult.userId,
        matricula: data.matricula,
        grado: data.grado,
        grupo: data.grupo,
        fecha_nacimiento: data.fecha_nacimiento || null,
        curp: data.curp || null,
        nombre_tutor: data.nombre_tutor || null,
        informacion_medica: data.informacion_medica || null,
        telefonos_emergencia: data.telefonos_emergencia || []
      })

    if (alumnoError) {
      // Si la creación del alumno falla, eliminamos el usuario y perfil creados.
      const adminSupabase = await createServerSupabaseClient(true) // Usar service_role
      await adminSupabase.auth.admin.deleteUser(userResult.userId)
      await supabase.from('profiles').delete().eq('id', userResult.userId)

      return { success: false, error: 'Error al crear alumno: ' + alumnoError.message }
    }

    // Revalidar las páginas que muestran alumnos
    revalidatePath('/directivo/alumnos')
    revalidatePath('/directivo')

    return {
      success: true,
      message: 'Alumno creado exitosamente'
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
 * Función genérica para crear un usuario en Auth y su perfil en la tabla `profiles`.
 * Es más atómica: si la creación del perfil falla, elimina el usuario de Auth.
 */
async function crearUsuario(
  data: CrearAlumnoData | CrearMaestroData | CrearAuxiliarData,
  role: UserRole
) {
  const supabase = await createServerSupabaseClient()
  const adminSupabase = await createServerSupabaseClient(true) // Cliente con service_role para admin actions

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        nombre: data.nombre,
        apellidos: data.apellidos,
        role: role
      }
    }
  })

  if (authError || !authData.user) {
    return { success: false, error: authError?.message || 'Error al crear usuario en Auth' }
  }

  const userId = authData.user.id

  // 2. Crear perfil en la tabla `profiles`
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      nombre: data.nombre,
      apellidos: data.apellidos,
      email: data.email,
      role: role,
      telefono: data.telefono || null,
      activo: true // Aseguramos que el campo 'activo' tenga un valor por defecto
    })

  if (profileError) {
    // Si la creación del perfil falla, eliminamos el usuario de Auth para mantener la consistencia.
    await adminSupabase.auth.admin.deleteUser(userId)
    return { success: false, error: 'Error al crear perfil: ' + profileError.message }
  }

  return { success: true, userId }
}

/**
 * Crear un nuevo auxiliar de calificaciones en el sistema
 * Solo puede ser ejecutado por usuarios con rol 'directivo'
 */
export async function crearAuxiliar(data: CrearAuxiliarData) {
  const supabase = await createServerSupabaseClient()
  try {
    await requireDirectivoRole(supabase)

    const result = await crearUsuario(data, 'auxiliar_calificaciones')
    if (!result.success) return result

    // Revalidar las páginas que muestran usuarios
    revalidatePath('/directivo/usuarios')
    revalidatePath('/directivo')

    return {
      success: true,
      message: 'Auxiliar de calificaciones creado exitosamente'
    }

  } catch (error) {
    console.error('Error al crear auxiliar:', error)
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
  const supabase = await createServerSupabaseClient()
  try {
    await requireDirectivoRole(supabase)

    const result = await crearUsuario(data, 'maestro')
    if (!result.success) return result

    // Si se proporcionó especialidad, crear registro adicional si tienes tabla de maestros
    // Si no tienes tabla maestros, puedes guardar la especialidad en profiles o crear la tabla

    // Revalidar las páginas que muestran maestros
    revalidatePath('/directivo/maestros')
    revalidatePath('/directivo')

    return {
      success: true,
      message: 'Maestro creado exitosamente'
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
          telefono,
          activo
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
 * Obtener lista de todos los auxiliares de calificaciones (para directivo)
 */
export async function obtenerAuxiliares() {
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

    const { data: auxiliares, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'auxiliar_calificaciones')
      .order('apellidos')

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: auxiliares || [] }

  } catch (error) {
    console.error('Error al obtener auxiliares:', error)
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
        fecha_nacimiento: data.fecha_nacimiento || null,
        curp: data.curp || null,
        nombre_tutor: data.nombre_tutor || null,
        informacion_medica: data.informacion_medica || null,
        telefonos_emergencia: data.telefonos_emergencia || []
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

/**
 * Desactivar un alumno (soft delete)
 * Solo puede ser ejecutado por usuarios con rol 'directivo'
 */
export async function desactivarAlumno(alumnoId: string) {
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
      return { success: false, error: 'No autorizado. Solo directivos pueden desactivar alumnos.' }
    }

    // Verificar que el alumno exista
    const { data: existingAlumno } = await supabase
      .from('alumnos')
      .select('user_id')
      .eq('id', alumnoId)
      .single()

    if (!existingAlumno) {
      return { success: false, error: 'Alumno no encontrado' }
    }

    // Marcar perfil como inactivo
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ activo: false })
      .eq('id', existingAlumno.user_id)

    if (profileError) {
      return { success: false, error: 'Error al desactivar alumno: ' + profileError.message }
    }

    // Revalidar las páginas
    revalidatePath('/directivo/alumnos')
    revalidatePath('/directivo/usuarios')
    revalidatePath('/directivo')

    return {
      success: true,
      message: 'Alumno desactivado exitosamente'
    }

  } catch (error) {
    console.error('Error al desactivar alumno:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Desactivar un maestro (soft delete)
 * Solo puede ser ejecutado por usuarios con rol 'directivo'
 */
export async function desactivarMaestro(maestroId: string) {
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
      return { success: false, error: 'No autorizado. Solo directivos pueden desactivar maestros.' }
    }

    // Verificar que el maestro exista y tenga rol de maestro
    const { data: existingMaestro } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', maestroId)
      .single()

    if (!existingMaestro) {
      return { success: false, error: 'Maestro no encontrado' }
    }

    if (existingMaestro.role !== 'maestro') {
      return { success: false, error: 'El usuario no es un maestro' }
    }

    // Marcar perfil como inactivo
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ activo: false })
      .eq('id', maestroId)

    if (profileError) {
      return { success: false, error: 'Error al desactivar maestro: ' + profileError.message }
    }

    // Revalidar las páginas
    revalidatePath('/directivo/usuarios')
    revalidatePath('/directivo')

    return {
      success: true,
      message: 'Maestro desactivado exitosamente'
    }

  } catch (error) {
    console.error('Error al desactivar maestro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Reactivar un alumno
 * Solo puede ser ejecutado por usuarios con rol 'directivo'
 */
export async function reactivarAlumno(alumnoId: string) {
  try {
    const supabase = await createServerSupabaseClient()

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

    const { data: existingAlumno } = await supabase
      .from('alumnos')
      .select('user_id')
      .eq('id', alumnoId)
      .single()

    if (!existingAlumno) {
      return { success: false, error: 'Alumno no encontrado' }
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ activo: true })
      .eq('id', existingAlumno.user_id)

    if (profileError) {
      return { success: false, error: 'Error al reactivar alumno: ' + profileError.message }
    }

    revalidatePath('/directivo/alumnos')
    revalidatePath('/directivo/usuarios')
    revalidatePath('/directivo')

    return {
      success: true,
      message: 'Alumno reactivado exitosamente'
    }

  } catch (error) {
    console.error('Error al reactivar alumno:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

/**
 * Reactivar un maestro
 * Solo puede ser ejecutado por usuarios con rol 'directivo'
 */
export async function reactivarMaestro(maestroId: string) {
  try {
    const supabase = await createServerSupabaseClient()

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

    const { data: existingMaestro } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', maestroId)
      .single()

    if (!existingMaestro || existingMaestro.role !== 'maestro') {
      return { success: false, error: 'Maestro no encontrado' }
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ activo: true })
      .eq('id', maestroId)

    if (profileError) {
      return { success: false, error: 'Error al reactivar maestro: ' + profileError.message }
    }

    revalidatePath('/directivo/usuarios')
    revalidatePath('/directivo')

    return {
      success: true,
      message: 'Maestro reactivado exitosamente'
    }

  } catch (error) {
    console.error('Error al reactivar maestro:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
