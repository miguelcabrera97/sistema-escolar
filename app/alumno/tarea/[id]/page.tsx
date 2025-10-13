
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, FileText, Calendar, Target } from 'lucide-react'

export default function DetalleTarea() {
  const params = useParams()
  const router = useRouter()
  const tareaId = params.id as string

  const [tarea, setTarea] = useState<any>(null)
  const [entrega, setEntrega] = useState<any>(null)
  const [alumno, setAlumno] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [comentarios, setComentarios] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [tareaId])

  const cargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Obtener datos del alumno
      const { data: alumnoData } = await supabase
        .from('alumnos')
        .select('id')
        .eq('user_id', user.id)
        .single()

      setAlumno(alumnoData)

      // Obtener tarea con información del curso
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

      // Verificar si ya hay una entrega
      const { data: entregaData } = await supabase
        .from('entregas')
        .select('*')
        .eq('tarea_id', tareaId)
        .eq('alumno_id', alumnoData?.id)
        .maybeSingle()

      setEntrega(entregaData)
      if (entregaData?.comentarios) {
        setComentarios(entregaData.comentarios)
      }

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let archivoUrl = entrega?.archivo_url

      // Si hay un archivo nuevo, subirlo
      if (archivo) {
        const fileExt = archivo.name.split('.').pop()
        const fileName = `${alumno.id}/${tareaId}/${Date.now()}.${fileExt}`

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('tareas')
          .upload(fileName, archivo)

        if (uploadError) throw uploadError

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('tareas')
          .getPublicUrl(fileName)

        archivoUrl = publicUrl
      }

      // Crear o actualizar la entrega
      if (entrega) {
        // Actualizar entrega existente
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
        // Crear nueva entrega
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

      // Recargar datos
      await cargarDatos()
      setArchivo(null)
      alert('Tarea entregada exitosamente')

    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al entregar la tarea: ' + error.message)
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

  if (!tarea) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Tarea no encontrada</p>
      </div>
    )
  }

  const fechaVencida = new Date(tarea.fecha_entrega) < new Date()
  const puedeEntregar = !fechaVencida || entrega?.status !== 'calificada'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Información de la tarea */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl">{tarea.titulo}</CardTitle>
                <CardDescription className="mt-2">
                  {tarea.cursos?.nombre} - {tarea.cursos?.grado} {tarea.cursos?.grupo}
                </CardDescription>
              </div>
              {entrega && (
                <Badge 
                  variant={
                    entrega.status === 'calificada' ? 'default' :
                    entrega.status === 'entregada' ? 'secondary' :
                    'destructive'
                  }
                >
                  {entrega.status === 'calificada' ? `Calificada: ${entrega.calificacion}/${tarea.puntos_maximos}` :
                   entrega.status === 'entregada' ? 'Entregada' :
                   'Pendiente'}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Descripción:</h3>
              <p className="text-gray-700 whitespace-pre-wrap">
                {tarea.descripcion || 'Sin descripción'}
              </p>
            </div>

            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>
                  Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span>Puntos: {tarea.puntos_maximos}</span>
              </div>
            </div>

            {fechaVencida && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                ⚠️ La fecha de entrega ha pasado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Retroalimentación del maestro (si existe) */}
        {entrega?.retroalimentacion && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Retroalimentación del Maestro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {entrega.retroalimentacion}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Formulario de entrega */}
        {puedeEntregar && (
          <Card>
            <CardHeader>
              <CardTitle>
                {entrega ? 'Actualizar Entrega' : 'Entregar Tarea'}
              </CardTitle>
              <CardDescription>
                {entrega 
                  ? 'Puedes actualizar tu entrega antes de que el maestro la califique'
                  : 'Sube tu trabajo y agrega comentarios'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Archivo actual */}
                {entrega?.archivo_url && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-900">
                        Ya subiste un archivo
                      </span>
                      <a 
                        href={entrega.archivo_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline ml-auto"
                      >
                        Ver archivo
                      </a>
                    </div>
                  </div>
                )}

                {/* Subir archivo */}
                <div>
                  <Label htmlFor="archivo">
                    {entrega?.archivo_url ? 'Cambiar archivo' : 'Subir archivo'}
                  </Label>
                  <input
                    id="archivo"
                    type="file"
                    onChange={handleFileChange}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formatos: PDF, Word, imágenes, ZIP (máx. 10MB)
                  </p>
                </div>

                {/* Comentarios */}
                <div>
                  <Label htmlFor="comentarios">Comentarios (opcional)</Label>
                  <textarea
                    id="comentarios"
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                    placeholder="Agrega cualquier comentario sobre tu entrega..."
                    className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={uploading || (!archivo && !entrega)}
                  className="w-full"
                >
                  {uploading ? (
                    'Subiendo...'
                  ) : entrega ? (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Actualizar Entrega
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Entregar Tarea
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Entrega calificada - no se puede modificar */}
        {entrega?.status === 'calificada' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-2xl font-bold text-green-600">
                    {entrega.calificacion}
                  </span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Tarea Calificada</h3>
                <p className="text-gray-600 text-sm">
                  Esta tarea ya ha sido calificada y no se puede modificar
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}