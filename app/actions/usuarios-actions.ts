'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireServerRole } from '@/lib/auth-server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Result } from '@/lib/types'

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

import { Alumno, Maestro, Auxiliar } from '@/app/types/usuarios'


// ============================================
// FUNCIONES DE CONSULTA
// ============================================

export async function getPadres() {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success || !auth.data) return []
    const { supabase } = auth.data

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

      return []
    }



    // Mapear y ordenar en JavaScript
    const padres = data
      .map(p => {
        const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
        return {
          id: p.id,
          user_id: p.user_id,
          nombre: profile?.nombre || '',
          apellidos: profile?.apellidos || ''
        }
      })
      .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''))



    return padres
  } catch (error) {
    console.error('[getPadres] Error inesperado:', error)
    return []
  }
}

// ============================================
// RESTABLECER CONTRASEÑA (GENÉRICO)
// ============================================

export async function restablecerPasswordUsuario(userId: string, nuevaPassword: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }

    // 2. Actualizar contraseña usando supabaseAdmin DIRECTAMENTE con el user_id
    // Ya no buscamos en la tabla específica porque el user_id es el id de auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: nuevaPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return { success: false, error: 'Error al actualizar la contraseña: ' + updateError.message }
    }

    return {
      success: true,
      message: 'Contraseña actualizada correctamente'
    }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado al restablecer contraseña' }
  }
}

export async function obtenerAlumnos(): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

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
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }



    return { success: true, data }
  } catch (error) {
    console.error('[obtenerAlumnos] Error inesperado:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function obtenerAlumnosPorGradoGrupo(grado?: string, grupo?: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    let query = supabase
      .from('alumnos')
      .select(`
        id,
        matricula,
        curp,
        grado,
        grupo,
        user_id,
        profiles:user_id(nombre, apellidos, email, activo)
      `)

    if (grado) {
      query = query.eq('grado', grado)
    }

    if (grupo) {
      query = query.eq('grupo', grupo)
    }

    const { data, error } = await query.order('grado').order('grupo').order('matricula')

    if (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }

    return { success: true, data: data || [] }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function obtenerMaestros(): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

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
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }

    // Transformar datos para que activo esté accesible
    const maestrosTransformados = data?.map(m => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
      return {
        id: m.user_id,
        user_id: m.user_id,
        nombre: profile?.nombre || '',
        apellidos: profile?.apellidos || '',
        email: profile?.email || '',
        activo: profile?.activo || false,
        especialidad: m.especialidad
      }
    }) || []

    return { success: true, data: maestrosTransformados }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function obtenerAuxiliares(): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    const { data, error } = await supabase
      .from('auxiliares_calificaciones')
      .select(`
        id,
        user_id,
        profiles:user_id(nombre, apellidos, email, activo)
      `)
      .order('profiles(nombre)')

    if (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }

    // Transformar datos para que activo esté accesible
    const auxiliaresTransformados = data?.map(a => {
      const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
      return {
        id: a.id,
        user_id: a.user_id,
        nombre: profile?.nombre || '',
        apellidos: profile?.apellidos || '',
        email: profile?.email || '',
        activo: profile?.activo || false
      }
    }) || []

    return { success: true, data: auxiliaresTransformados }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

// ============================================
// CREAR ALUMNO
// ============================================

export async function crearAlumno(prevState: Result | null | undefined, formData: FormData): Promise<Result> {
  try {
    const rawFormData = Object.fromEntries(formData.entries())

    // Validar con Zod
    const validatedFields = AlumnoSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { nombre, apellidos, email, password, matricula, curp, grado, grupo, id_padre } = validatedFields.data

    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    // 1. Crear usuario en auth con email confirmado automáticamente
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password || 'temporal123',
      email_confirm: true,
      user_metadata: {
        nombre: nombre,
        apellidos: apellidos,
        role: 'alumno',
      },
    })

    if (authError) {
      return {
        success: false,
        errors: { _form: [authError.message] },
      }
    }

    if (!authData.user) {
      return {
        success: false,
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
      // Intentar eliminar el usuario de auth
      await supabase.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
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
      return {
        success: false,
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
      success: false,
      errors: { _form: ['Error inesperado al crear alumno'] },
    }
  }
}

// ============================================
// EDITAR ALUMNO
// ============================================

export async function editarAlumno(prevState: Result | null | undefined, formData: FormData): Promise<Result> {
  try {
    const rawFormData = Object.fromEntries(formData.entries())

    const validatedFields = AlumnoSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { id, nombre, apellidos, email, matricula, curp, grado, grupo, id_padre } = validatedFields.data

    if (!id) {
      return {
        success: false,
        errors: { _form: ['El ID del alumno es requerido'] },
      }
    }

    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    // 1. Obtener user_id del alumno
    const { data: alumnoData, error: alumnoQueryError } = await supabase
      .from('alumnos')
      .select('user_id, id')
      .eq('id', id)
      .single()

    if (alumnoQueryError || !alumnoData) {
      return {
        success: false,
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
      return {
        success: false,
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
      return {
        success: false,
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
      success: false,
      errors: { _form: ['Error inesperado al actualizar alumno'] },
    }
  }
}

// ============================================
// ACTIVAR/DESACTIVAR USUARIO
// ============================================

async function toggleActivoUsuario(
  tabla: 'alumnos' | 'maestros' | 'auxiliares_calificaciones',
  id: string,
  activo: boolean,
  etiqueta: string
): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    const { data } = await supabase.from(tabla).select('user_id').eq('id', id).single()
    if (!data) return { success: false, error: `${etiqueta} no encontrado` }

    const { error } = await supabase.from('profiles').update({ activo }).eq('id', data.user_id)
    if (error) return { success: false, error: error.message }

    revalidatePath('/directivo/usuarios')
    return { success: true, message: `${etiqueta} ${activo ? 'activado' : 'desactivado'} exitosamente` }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function toggleActivoAlumno(id: string, activo: boolean): Promise<Result> {
  return toggleActivoUsuario('alumnos', id, activo, 'Alumno')
}

export async function toggleActivoMaestro(id: string, activo: boolean): Promise<Result> {
  return toggleActivoUsuario('maestros', id, activo, 'Maestro')
}

export async function toggleActivoAuxiliar(id: string, activo: boolean): Promise<Result> {
  return toggleActivoUsuario('auxiliares_calificaciones', id, activo, 'Auxiliar')
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

export async function crearMaestro(data: CrearMaestroData): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    // 1. Crear usuario en auth con email confirmado automáticamente
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        nombre: data.nombre,
        apellidos: data.apellidos,
        role: 'maestro',
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

export async function editarMaestro(data: EditarMaestroData): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

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

export async function crearAuxiliar(data: CrearAuxiliarData): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    // 1. Crear usuario en auth con email confirmado automáticamente
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        nombre: data.nombre,
        apellidos: data.apellidos,
        role: 'auxiliar_calificaciones',
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

// ============================================
// PADRES Y DIRECTIVOS
// ============================================

const PadreDirectivoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidos: z.string().min(1, 'Los apellidos son requeridos'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  telefono: z.string().optional(),
  role: z.enum(['padre', 'directivo']),
})

export async function crearPadreODirectivo(prevState: Result | null | undefined, formData: FormData): Promise<Result> {
  try {
    const rawFormData = Object.fromEntries(formData.entries())

    const validatedFields = PadreDirectivoSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }

    const { nombre, apellidos, email, password, telefono, role } = validatedFields.data

    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    // 1. Crear usuario en auth con email confirmado automáticamente
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        nombre: nombre,
        apellidos: apellidos,
        role: role,
      },
    })

    if (authError) {
      return {
        success: false,
        errors: { _form: [authError.message] },
      }
    }

    if (!authData.user) {
      return {
        success: false,
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
        telefono: telefono || null,
        role: role,
        activo: true,
      },
    ])

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        errors: { _form: [profileError.message] },
      }
    }

    // 3. Si es padre, crear registro en tabla padres
    if (role === 'padre') {
      const { error: padreError } = await supabase.from('padres').insert([
        {
          user_id: authData.user.id,
        },
      ])

      if (padreError) {
        return {
          success: false,
          errors: { _form: [padreError.message] },
        }
      }
    }

    revalidatePath('/directivo/usuarios')
    return { success: true, message: `${role === 'padre' ? 'Padre' : 'Directivo'} creado exitosamente` }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function obtenerPadresYDirectivos(): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos, email, telefono, role, activo')
      .in('role', ['padre', 'directivo'])
      .order('role')
      .order('nombre')

    if (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }

    return { success: true, data: data || [] }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// ============================================
// FUNCIONES PARA PADRES
// ============================================

export async function editarPadre(prevState: Result | null | undefined, formData: FormData): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    const id = formData.get('id') as string
    const nombre = formData.get('nombre') as string
    const apellidos = formData.get('apellidos') as string
    const email = formData.get('email') as string
    const telefono = formData.get('telefono') as string

    if (!id || !nombre || !apellidos || !email) {
      return { success: false, error: 'Faltan campos requeridos' }
    }

    // Actualizar perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nombre,
        apellidos,
        email,
        telefono: telefono || null
      })
      .eq('id', id)

    if (profileError) {
      return { success: false, error: profileError.message }
    }

    revalidatePath('/directivo/usuarios')
    return { success: true, message: 'Padre actualizado exitosamente' }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function toggleActivoPadre(id: string, activo: boolean): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    // Actualizar el campo activo en profiles
    const { error } = await supabase
      .from('profiles')
      .update({ activo })
      .eq('id', id)

    if (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }

    revalidatePath('/directivo/usuarios')
    return { success: true, message: `Padre ${activo ? 'activado' : 'desactivado'} exitosamente` }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function desactivarPadre(id: string): Promise<Result> {
  return toggleActivoPadre(id, false)
}

export async function reactivarPadre(id: string): Promise<Result> {
  return toggleActivoPadre(id, true)
}

// ============================================
// ALIAS DE COMPATIBILIDAD (FASE 3.2)
// ============================================

export async function desactivarAlumno(id: string) { return toggleActivoAlumno(id, false) }
export async function reactivarAlumno(id: string) { return toggleActivoAlumno(id, true) }
export async function desactivarMaestro(id: string) { return toggleActivoMaestro(id, false) }
export async function reactivarMaestro(id: string) { return toggleActivoMaestro(id, true) }
export async function desactivarAuxiliar(id: string) { return toggleActivoAuxiliar(id, false) }
export async function reactivarAuxiliar(id: string) { return toggleActivoAuxiliar(id, true) }

// ============================================
// RESTABLECER CONTRASEÑA (ADMINISTRATIVO)
// ============================================

export async function restablecerPasswordAlumno(alumnoId: string, nuevaPassword: string): Promise<Result> {
  try {
    const auth = await requireServerRole(['directivo'])
    if (!auth.success) return { success: false, error: auth.error }
    if (!auth.data) return { success: false, error: 'No autorizado' }
    const { supabase } = auth.data

    // 2. Obtener el user_id del alumno
    const { data: alumnoData, error: alumnoError } = await supabase
      .from('alumnos')
      .select('user_id, profiles(nombre, apellidos)')
      .eq('id', alumnoId)
      .single()

    if (alumnoError || !alumnoData) {
      return { success: false, error: 'Alumno no encontrado' }
    }

    // 3. Actualizar contraseña usando supabaseAdmin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      alumnoData.user_id,
      { password: nuevaPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return { success: false, error: 'Error al actualizar la contraseña: ' + updateError.message }
    }

    const profile = Array.isArray(alumnoData.profiles) ? alumnoData.profiles[0] : alumnoData.profiles
    return {
      success: true,
      message: `Contraseña actualizada correctamente para ${profile?.nombre || 'el alumno'}`
    }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado al restablecer contraseña' }
  }
}
