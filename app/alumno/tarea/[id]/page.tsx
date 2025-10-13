'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, FileText, Calendar, Award } from 'lucide-react'

interface Profile {
  nombre: string
  apellidos: string
}

interface Curso {
  nombre: string
  grado: string
  grupo: string
}

interface Tarea {
  id: string
  titulo: string
  descripcion: string
  fecha_vencimiento: string
  puntos_maximos: number
  cursos: Curso
}

interface Alumno {
  id: string
  matricula: string
}

interface Entrega {
  id: string
  archivo_url: string | null
  comentarios: string | null
  status: string
  calificacion: number | null
  retroalimentacion: string | null
  fecha_entrega: string | null
}

export default function TareaDetalle() {
  const params = useParams()
  const router = useRouter()
  const tareaId = params.id as string

  const [tarea, setTarea] = useState<Tarea | null>(null)
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [entrega, setEntrega] = useState<Entrega | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  const [archivo, setArchivo] = useState<File | null>(null)
  const [comentarios, setComentarios] = useState('')

  const cargarDatos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: alumnoData } = await supabase
        .from('alumnos')
        .select('id, matricula')
        .eq('user_id', user.id)
        .single()

      if (!alumnoData) {
        alert('No se encontró información del alumno')
        return
      }

      setAlumno(alumnoData)

      const { data: tareaData } = await supabase
        .from('tareas')
        .select(`
          *,
          cursos (
            nombre,
            grado,
            grupo
          )
        `)
        .eq('id', tareaId)
        .single()

      setTarea(tareaData)

      const { data: entregaData } = await supabase
        .from('entregas')
        .select('*')
        .eq('tarea_id', tareaId)
        .eq('alumno_id', alumnoData.id)
        .single()

      if (entregaData) {
        setEntrega(entregaData)
        setComentarios(entregaData.comentarios || '')
      }

    } catch (error) {
      const err = error as Error
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [tareaId, router])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      if (!alumno) {
        throw new Error('No se encontró información del alumno')
      }

      let archivoUrl = entrega?.archivo_url

      if (archivo) {
        const fileExt = archivo.name.split('.').pop()
        const fileName = `${alumno.id}/${tareaId}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('tareas')
          .upload(fileName, archivo, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Error al subir:', uploadError)
          throw uploadError
        }

        const { data } = supabase.storage
          .from('tareas')
          .getPublicUrl(fileName)

        archivoUrl = data.publicUrl
      }

      if (entrega) {
        const { error } = await supabase
          .from('entregas')
          .update({
            comentarios,
            archivo_url: archivoUrl,
            status: 'entregada',
            fecha_entrega: new Date().toISOString()
          })
          .eq('id', entrega.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('entregas')
          .insert({
            tarea_id: tareaId,
            alumno_id: alumno.id,
            comentarios,
            archivo_url: archivoUrl,
            status: 'entregada',
            fecha_entrega: new Date().toISOString()
          })

        if (error) throw error
      }

      await cargarDatos()
      setArchivo(null)
      alert('Tarea entregada exitosamente')

    } catch (error) {
      const err = error as Error
      console.error('Error completo:', err)
      alert('Error al entregar la tarea: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  const vencida = tarea ? new Date(tarea.fecha_vencimiento) < new Date() : false
  const puedeEntregar = !entrega || (entrega.status !== 'calificada')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{tarea?.titulo}</CardTitle>
                <CardDescription>
                  {tarea?.cursos.nombre} - {tarea?.cursos.grado} {tarea?.cursos.grupo}
                </CardDescription>
              </div>
              <Badge variant={
                entrega?.status === 'calificada' ? 'default' :
                entrega?.status === 'entregada' ? 'secondary' :
                vencida ? 'destructive' : 'outline'
              }>
                {entrega?.status === 'calificada' ? `Calificada: ${entrega.calificacion}/${tarea?.puntos_maximos}` :
                 entrega?.status === 'entregada' ? 'Entregada' :
                 vencida ? 'Vencida' : 'Pendiente'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Descripción:</h3>
              <p className="text-gray-700">{tarea?.descripcion}</p>
            </div>

            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>Vencimiento: {tarea ? new Date(tarea.fecha_vencimiento).toLocaleDateString() : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-500" />
                <span>Puntos: {tarea?.puntos_maximos}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {entrega?.status === 'calificada' && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-green-600" />
                Tarea Calificada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Tu calificación:</span>
                <span className="text-3xl font-bold text-green-600">
                  {entrega.calificacion} / {tarea?.puntos_maximos}
                </span>
              </div>
              
              {entrega.retroalimentacion && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">
                    Retroalimentación del maestro:
                  </h4>
                  <p className="text-gray-600 bg-white p-3 rounded border">
                    {entrega.retroalimentacion}
                  </p>
                </div>
              )}

              {entrega.archivo_url && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">
                    Tu entrega:
                  </h4>
                  
                    <Button
  variant="link"
  onClick={() => window.open(entrega.archivo_url || '', '_blank')}
  className="inline-flex items-center gap-2 p-0 h-auto"
>
  <FileText className="h-4 w-4" />
  Ver archivo entregado
</Button>
                </div>
              )}

              {entrega.comentarios && (
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">
                    Tus comentarios:
                  </h4>
                  <p className="text-gray-600 bg-white p-3 rounded border">
                    {entrega.comentarios}
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-500 italic mt-4">
                Tarea Calificada - No se puede modificar
              </p>
            </CardContent>
          </Card>
        )}

        {puedeEntregar && (
          <Card>
            <CardHeader>
              <CardTitle>
                {entrega ? 'Actualizar Entrega' : 'Entregar Tarea'}
              </CardTitle>
              <CardDescription>
                {entrega 
                  ? 'Puedes actualizar tu entrega hasta que el maestro la califique'
                  : 'Sube tu trabajo y agrega comentarios si es necesario'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="archivo">Archivo</Label>
                  <Input
                    id="archivo"
                    type="file"
                    onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                    disabled={uploading}
                  />
                  {entrega?.archivo_url && !archivo && (
                    <p className="text-sm text-gray-600 mt-2">
                      <FileText className="inline h-3 w-3 mr-1" />
                      Ya has subido un archivo. Selecciona uno nuevo para reemplazarlo.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="comentarios">Comentarios (opcional)</Label>
                  <textarea
                    id="comentarios"
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                    placeholder="Agrega comentarios sobre tu entrega..."
                    className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]"
                    disabled={uploading}
                  />
                </div>

                <Button type="submit" disabled={uploading || (!archivo && !comentarios && !entrega)}>
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {entrega ? 'Actualizar Entrega' : 'Entregar Tarea'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}