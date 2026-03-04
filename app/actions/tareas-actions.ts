'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

interface Result<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface CrearTareaData {
  curso_id: string
  titulo: string
  descripcion: string
  fecha_entrega: string
  archivo_url?: string | null
}

export async function crearTareaArchivo(
  tareaId: string,
  archivoUrl: string,
  nombreArchivo: string,
  tipoArchivo: string,
  tamanoArchivo: number
): Promise<Result<any>> {
  try {
    const supabase = await createServerSupabaseClient()

    // Verificar que el usuario está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    // Verificar que el usuario es maestro o auxiliar
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'maestro' && profile.role !== 'auxiliar')) {
      return { success: false, error: 'No autorizado. Solo maestros y auxiliares pueden crear tareas.' }
    }

    // Insertar el archivo en la tabla 'tarea_archivos'
    const { data: tareaArchivo, error: archivoError } = await supabaseAdmin
      .from('tarea_archivos')
      .insert({
        tarea_id: tareaId,
        url: archivoUrl,
        nombre: nombreArchivo,
        tipo: tipoArchivo,
        tamano: tamanoArchivo,
      })
      .select()
      .single()

    if (archivoError) {
      console.error('❌ Error al crear registro de archivo de tarea:', archivoError)
      return { success: false, error: archivoError.message }
    }

    console.log('✅ Registro de archivo de tarea creado exitosamente:', tareaArchivo.id)
    return { success: true, data: tareaArchivo }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado al crear registro de archivo de tarea' }
  }
}

export async function crearTarea(data: CrearTareaData): Promise<Result> {
  try {
    const supabase = await createServerSupabaseClient()

    // Verificar que el usuario está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'No autenticado' }

    // Verificar que el usuario es maestro o auxiliar
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'maestro' && profile.role !== 'auxiliar')) {
      return { success: false, error: 'No autorizado. Solo maestros y auxiliares pueden crear tareas.' }
    }

    // Verificar que el curso pertenece al maestro
    const { data: curso } = await supabase
      .from('cursos')
      .select('id')
      .eq('id', data.curso_id)
      .eq('maestro_id', user.id)
      .single()

    if (!curso) {
      return { success: false, error: 'Curso no encontrado o no tienes permisos para crear tareas en este curso' }
    }

    console.log('✅ Usuario y curso verificados')
    console.log('📝 Creando tarea con datos:', data)

    // Crear la tarea usando supabaseAdmin para bypasear RLS
    const { data: tarea, error: tareaError } = await supabaseAdmin
      .from('tareas')
      .insert({
        curso_id: data.curso_id,
        titulo: data.titulo,
        descripcion: data.descripcion,
        fecha_entrega: data.fecha_entrega,
        archivo_url: data.archivo_url || null
      })
      .select()
      .single()

    if (tareaError) {
      console.error('❌ Error al crear tarea:', tareaError)
      return { success: false, error: tareaError.message }
    }

    console.log('✅ Tarea creada exitosamente:', tarea.id)

    revalidatePath('/maestro')
    return { success: true, data: tarea }
  } catch (error) {
    console.error('Error:', error)
    return { success: false, error: 'Error inesperado al crear tarea' }
  }
}

export async function subirArchivoTarea(
  file: File,
  userId: string
): Promise<Result<{ publicUrl: string }>> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `maestros/${userId}/${Date.now()}.${fileExt}`

    console.log('📤 Subiendo archivo:', fileName)

    // Usar supabaseAdmin para subir el archivo y bypasear políticas de storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('tareas')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Error al subir archivo:', uploadError)
      return { success: false, error: uploadError.message }
    }

    const { data } = supabaseAdmin.storage
      .from('tareas')
      .getPublicUrl(fileName)

    console.log('✅ Archivo subido:', data.publicUrl)

    return { success: true, data: { publicUrl: data.publicUrl } }
  } catch (error: unknown) {
    console.error('Error:', error)
    return { success: false, error: (error instanceof Error ? error.message : String(error)) || 'Error al subir archivo' }
  }
}
