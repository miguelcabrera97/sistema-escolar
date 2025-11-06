'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const AlumnoSchema = z.object({
  id: z.string().optional(),
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidos: z.string().min(1, 'Los apellidos son requeridos'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  matricula: z.string().min(1, 'La matrícula es requerida'),
  curp: z.string().length(18, 'El CURP debe tener exactamente 18 caracteres').optional().or(z.literal('')),
  grado: z.string().min(1, 'El grado es requerido'),
  grupo: z.string().min(1, 'El grupo es requerido'),
  id_padre: z.string().optional(),
})

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface Alumno {
  id: string
  matricula: string
  curp?: string
  grado: string
  grupo: string
  user_id: string
  profiles: {
    nombre: string
    apellidos: string
    email?: string
    activo: boolean
  }
}

export interface Maestro {
  id: string
  user_id: string
  especialidad?: string
  activo: boolean
  profiles: {
    nombre: string
    apellidos: string
    email?: string
  }
}

export interface Auxiliar {
  id: string
  user_id: string
  activo: boolean
  profiles: {
    nombre: string
    apellidos: string
    email?: string
  }
}

interface ActionResult {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
  error?: string
}

// ============================================
// FUNCIONES DE CONSULTA
// ============================================

export async function getPadres() {
  try {
    const supabase = await createServerSupabaseClient()

    console.log('[getPadres] Iniciando consulta...')

    const { data, error } = await supabase
      .from('padres')
      .select(`
        id,
        user_id,
        profiles:user_id(nombre, apellidos)
      `)

    if (error) {
      console.error('[getPadres] Error:', error)
      return []
    }

    if (!data) {
      console.log('[getPadres] No hay datos')
      return []
    }

    console.log('[getPadres] Datos obtenidos:', data.length, 'padres')

    // Mapear y ordenar en JavaScript
    const padres = data
      .map(p => ({
        id: p.id,
        nombre: p.profiles?.nombre || '',
        apellidos: p.profiles?.apellidos || ''
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    console.log('[getPadres] Padres procesados:', padres.length)

    return padres
  } catch (error) {
    console.error('[getPadres] Error inesperado:', error)
    return []
  }
}

export async function obtenerAlumnos(): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()

    console.log('[obtenerAlumnos] Iniciando consulta...')

    const { data, error } = await supabase
      .from('alumnos')
      .select(`
        id,
        matricula,
        curp,
        grado,
        grupo,
        user_id,
        profiles:user_id(nombre, apellidos, email, activo),
        padre_alumno(
          padre_id,
          padres(
            id,
            user_id,
            profiles:user_id(nombre, apellidos)
          )
        )
      `)
      .order('matricula')

    if (error) {
      console.error('[obtenerAlumnos] Error:', error)
      return { success: false, error: error.message }
    }

    console.log('[obtenerAlumnos] Datos obtenidos:', data?.length || 0, 'alumnos')

    return { success: true, data }
  } catch (error) {
    console.error('[obtenerAlumnos] Error inesperado:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function obtenerMaestros(): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('maestros')
      .select(`
        id,
        user_id,
        especialidad,
        profiles:user_id(nombre, apellidos, email, activo)
      `)
      .order('profiles(nombre)')

    if (error) {
      return { success: false, error: error.message }
    }

    // Transformar datos para que activo esté accesible
    const maestrosTransformados = data?.map(m => ({
      id: m.profiles.id || m.user_id,
      nombre: m.profiles.nombre,
      apellidos: m.profiles.apellidos,
      email: m.profiles.email,
      activo: m.profiles.activo,
      especialidad: m.especialidad
    })) || []

    return { success: true, data: maestrosTransformados }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function obtenerAuxiliares(): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('auxiliares_calificaciones')
      .select(`
        id,
        user_id,
        profiles:user_id(nombre, apellidos, email, activo)
      `)
      .order('profiles(nombre)')

    if (error) {
      return { success: false, error: error.message }
    }

    // Transformar datos para que activo esté accesible
    const auxiliaresTransformados = data?.map(a => ({
      id: a.profiles.id || a.user_id,
      nombre: a.profiles.nombre,
      apellidos: a.profiles.apellidos,
      email: a.profiles.email,
      activo: a.profiles.activo
    })) || []

    return { success: true, data: auxiliaresTransformados }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// CREAR ALUMNO
// ============================================

export async function crearAlumno(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const rawFormData = Object.fromEntries(formData.entries())

    // Validar con Zod
    const validatedFields = AlumnoSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { nombre, apellidos, email, password, matricula, curp, grado, grupo, id_padre } = validatedFields.data

    const supabase = await createServerSupabaseClient()

    // 1. Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password || 'temporal123',
      options: {
        data: {
          nombre: nombre,
          apellidos: apellidos,
          role: 'alumno',
        },
      },
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return {
        errors: { _form: [authError.message] },
      }
    }

    if (!authData.user) {
      return {
        errors: { _form: ['No se pudo crear el usuario'] },
      }
    }

    // 2. Crear perfil en profiles
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        nombre: nombre,
        apellidos: apellidos,
        email: email,
        role: 'alumno',
        activo: true,
      },
    ])

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Intentar eliminar el usuario de auth
      await supabase.auth.admin.deleteUser(authData.user.id)
      return {
        errors: { _form: [profileError.message] },
      }
    }

    // 3. Crear registro en alumnos
    const { error: alumnoError } = await supabase.from('alumnos').insert([
      {
        user_id: authData.user.id,
        matricula: matricula,
        curp: curp || null,
        grado: grado,
        grupo: grupo,
      },
    ])

    if (alumnoError) {
      console.error('Error creating alumno:', alumnoError)
      return {
        errors: { _form: [alumnoError.message] },
      }
    }

    // 4. Si hay padre asignado, crear relación en padre_alumno
    if (id_padre) {
      const { data: alumnoData } = await supabase
        .from('alumnos')
        .select('id')
        .eq('user_id', authData.user.id)
        .single()

      if (alumnoData) {
        await supabase.from('padre_alumno').insert([
          {
            padre_id: id_padre,
            alumno_id: alumnoData.id,
            parentesco: 'Padre/Madre',
          },
        ])
      }
    }

    revalidatePath('/directivo/usuarios')
    return {
      success: true,
      message: 'Alumno creado exitosamente',
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      errors: { _form: ['Error inesperado al crear alumno'] },
    }
  }
}

// ============================================
// EDITAR ALUMNO
// ============================================

export async function editarAlumno(prevState: any, formData: FormData): Promise<ActionResult> {
  try {
    const rawFormData = Object.fromEntries(formData.entries())

    const validatedFields = AlumnoSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { id, nombre, apellidos, email, matricula, curp, grado, grupo, id_padre } = validatedFields.data

    if (!id) {
      return {
        errors: { _form: ['El ID del alumno es requerido'] },
      }
    }

    const supabase = await createServerSupabaseClient()

    // 1. Obtener user_id del alumno
    const { data: alumnoData, error: alumnoQueryError } = await supabase
      .from('alumnos')
      .select('user_id, id')
      .eq('id', id)
      .single()

    if (alumnoQueryError || !alumnoData) {
      return {
        errors: { _form: ['Alumno no encontrado'] },
      }
    }

    // 2. Actualizar profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nombre: nombre,
        apellidos: apellidos,
        email: email,
      })
      .eq('id', alumnoData.user_id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return {
        errors: { _form: [profileError.message] },
      }
    }

    // 3. Actualizar alumnos
    const { error: alumnoError } = await supabase
      .from('alumnos')
      .update({
        matricula: matricula,
        curp: curp || null,
        grado: grado,
        grupo: grupo,
      })
      .eq('id', id)

    if (alumnoError) {
      console.error('Error updating alumno:', alumnoError)
      return {
        errors: { _form: [alumnoError.message] },
      }
    }

    // 4. Actualizar relación con padre
    // Primero eliminar relaciones existentes
    await supabase.from('padre_alumno').delete().eq('alumno_id', alumnoData.id)

    // Si hay padre asignado, crear nueva relación
    if (id_padre) {
      await supabase.from('padre_alumno').insert([
        {
          padre_id: id_padre,
          alumno_id: alumnoData.id,
          parentesco: 'Padre/Madre',
        },
      ])
    }

    revalidatePath('/directivo/usuarios')
    return {
      success: true,
      message: 'Alumno actualizado exitosamente',
    }
  } catch (error) {
    console.error('Error:', error)
    return {
      errors: { _form: ['Error inesperado al actualizar alumno'] },
    }
  }
}

// ============================================
// ACTIVAR/DESACTIVAR USUARIO
// ============================================

export async function toggleActivoAlumno(id: string, activo: boolean): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()

    // Obtener user_id del alumno
    const { data: alumnoData } = await supabase
      .from('alumnos')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!alumnoData) {
      return { success: false, error: 'Alumno no encontrado' }
    }

    // Actualizar el campo activo en profiles
    const { error } = await supabase
      .from('profiles')
      .update({ activo })
      .eq('id', alumnoData.user_id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/usuarios')
    return { success: true, message: `Alumno ${activo ? 'activado' : 'desactivado'} exitosamente` }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function toggleActivoMaestro(id: string, activo: boolean): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()

    // Obtener user_id del maestro
    const { data: maestroData } = await supabase
      .from('maestros')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!maestroData) {
      return { success: false, error: 'Maestro no encontrado' }
    }

    // Actualizar el campo activo en profiles
    const { error } = await supabase
      .from('profiles')
      .update({ activo })
      .eq('id', maestroData.user_id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/usuarios')
    return { success: true, message: `Maestro ${activo ? 'activado' : 'desactivado'} exitosamente` }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function toggleActivoAuxiliar(id: string, activo: boolean): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()

    // Obtener user_id del auxiliar
    const { data: auxiliarData } = await supabase
      .from('auxiliares_calificaciones')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!auxiliarData) {
      return { success: false, error: 'Auxiliar no encontrado' }
    }

    // Actualizar el campo activo en profiles
    const { error } = await supabase
      .from('profiles')
      .update({ activo })
      .eq('id', auxiliarData.user_id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/usuarios')
    return { success: true, message: `Auxiliar ${activo ? 'activado' : 'desactivado'} exitosamente` }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// FUNCIONES DE COMPATIBILIDAD (LEGACY)
// ============================================

export async function desactivarAlumno(id: string): Promise<ActionResult> {
  return toggleActivoAlumno(id, false)
}

export async function reactivarAlumno(id: string): Promise<ActionResult> {
  return toggleActivoAlumno(id, true)
}

export async function desactivarMaestro(id: string): Promise<ActionResult> {
  return toggleActivoMaestro(id, false)
}

export async function reactivarMaestro(id: string): Promise<ActionResult> {
  return toggleActivoMaestro(id, true)
}

// ============================================
// TIPOS LEGACY (COMPATIBILIDAD)
// ============================================

export interface CrearMaestroData {
  email: string
  password: string
  nombre: string
  apellidos: string
  especialidad?: string
  telefono?: string
}

export interface EditarMaestroData {
  id: string
  nombre: string
  apellidos: string
  email: string
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

// ============================================
// FUNCIONES DE MAESTROS (LEGACY)
// ============================================

export async function crearMaestro(data: CrearMaestroData): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nombre: data.nombre,
          apellidos: data.apellidos,
          role: 'maestro',
        },
      },
    })

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Error al crear usuario' }
    }

    // 2. Crear perfil
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        role: 'maestro',
        activo: true,
      },
    ])

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: profileError.message }
    }

    // 3. Crear maestro
    const { error: maestroError } = await supabase.from('maestros').insert([
      {
        user_id: authData.user.id,
        especialidad: data.especialidad || null,
      },
    ])

    if (maestroError) {
      return { success: false, error: maestroError.message }
    }

    revalidatePath('/directivo/usuarios')
    return { success: true, message: 'Maestro creado exitosamente' }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function editarMaestro(data: EditarMaestroData): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Obtener user_id del maestro
    const { data: maestroData } = await supabase
      .from('maestros')
      .select('user_id')
      .eq('id', data.id)
      .single()

    if (!maestroData) {
      return { success: false, error: 'Maestro no encontrado' }
    }

    // 2. Actualizar profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
      })
      .eq('id', maestroData.user_id)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    // 3. Actualizar maestro
    const { error: maestroError } = await supabase
      .from('maestros')
      .update({
        especialidad: data.especialidad || null,
      })
      .eq('id', data.id)

    if (maestroError) {
      return { success: false, error: maestroError.message }
    }

    revalidatePath('/directivo/usuarios')
    return { success: true, message: 'Maestro actualizado exitosamente' }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// FUNCIONES DE AUXILIARES (LEGACY)
// ============================================

export async function crearAuxiliar(data: CrearAuxiliarData): Promise<ActionResult> {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          nombre: data.nombre,
          apellidos: data.apellidos,
          role: 'auxiliar_calificaciones',
        },
      },
    })

    if (authError || !authData.user) {
      return { success: false, error: authError?.message || 'Error al crear usuario' }
    }

    // 2. Crear perfil
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        role: 'auxiliar_calificaciones',
        activo: true,
      },
    ])

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: profileError.message }
    }

    // 3. Crear auxiliar
    const { error: auxiliarError } = await supabase.from('auxiliares_calificaciones').insert([
      {
        user_id: authData.user.id,
      },
    ])

    if (auxiliarError) {
      return { success: false, error: auxiliarError.message }
    }

    revalidatePath('/directivo/usuarios')
    return { success: true, message: 'Auxiliar creado exitosamente' }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}
