'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { Result } from '@/lib/types'

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface NivelEducativo {
  id: string
  nombre: string
  orden: number
  activo: boolean
}

export interface Grado {
  id: string
  nivel_id: string
  nombre: string
  nombre_completo: string
  orden: number
  activo: boolean
  niveles_educativos?: {
    nombre: string
  }
}

export interface Grupo {
  id: string
  nombre: string
  activo: boolean
}


// ============================================
// OBTENER DATOS
// ============================================

export async function obtenerNivelesEducativos(): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('niveles_educativos')
      .select('*')
      .eq('activo', true)
      .order('orden')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function obtenerGrados(): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('grados')
      .select(`
        *,
        niveles_educativos (
          nombre
        )
      `)
      .eq('activo', true)
      .order('orden')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function obtenerGradosPorNivel(nivelId: string): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('grados')
      .select('*')
      .eq('nivel_id', nivelId)
      .eq('activo', true)
      .order('orden')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function obtenerGrupos(): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('grupos')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================
// CREAR GRADO
// ============================================

export async function crearGrado(formData: FormData): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const nivel_id = formData.get('nivel_id') as string
    const nombre = formData.get('nombre') as string
    const orden = parseInt(formData.get('orden') as string)

    if (!nivel_id || !nombre || !orden) {
      return {
        success: false,
        error: 'Todos los campos son requeridos',
      }
    }

    // Obtener nombre del nivel para construir nombre_completo
    const { data: nivelData } = await supabase
      .from('niveles_educativos')
      .select('nombre')
      .eq('id', nivel_id)
      .single()

    if (!nivelData) {
      return { success: false, error: 'Nivel educativo no encontrado' }
    }

    const isNumeric = /^\d+$/.test(nombre)
    const nombre_completo = isNumeric
      ? `${nombre}° ${nivelData.nombre}`
      : `${nombre} ${nivelData.nombre}`

    const { error } = await supabase.from('grados').insert([
      {
        nivel_id,
        nombre,
        nombre_completo,
        orden,
        activo: true,
      },
    ])

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/grados-grupos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================
// CREAR GRUPO
// ============================================

export async function crearGrupo(formData: FormData): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const nombre = (formData.get('nombre') as string).toUpperCase()

    if (!nombre) {
      return {
        success: false,
        error: 'El nombre del grupo es requerido',
      }
    }

    const { error } = await supabase.from('grupos').insert([
      {
        nombre,
        activo: true,
      },
    ])

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/grados-grupos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================
// DESACTIVAR GRADO
// ============================================

export async function desactivarGrado(gradoId: string): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('grados')
      .update({ activo: false })
      .eq('id', gradoId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/grados-grupos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// ============================================
// DESACTIVAR GRUPO
// ============================================

export async function desactivarGrupo(grupoId: string): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('grupos')
      .update({ activo: false })
      .eq('id', grupoId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/directivo/grados-grupos')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
