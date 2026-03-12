'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ClipboardList, Clock, CheckCircle, AlertCircle } from 'lucide-react'

const supabase = createClient()

interface Tarea {
  id: string
  titulo: string
  descripcion: string
  fecha_entrega: string
  puntos_maximos: number
  pendientes: number
  entregadas: number
  calificadas: number
}

interface Curso {
  id: string
  nombre: string
  grado: string
  grupo: string
}

export default function TareasCursoPage() {
  const params = useParams()
  const router = useRouter()
  const cursoId = params.cursoId as string

  const [curso, setCurso] = useState<Curso | null>(null)
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'auxiliar_calificaciones') {
        router.push('/login')
        return
      }

      // Datos del curso
      const { data: cursoData } = await supabase
        .from('cursos')
        .select('id, nombre, grado, grupo')
        .eq('id', cursoId)
        .single()

      if (cursoData) setCurso(cursoData)

      // Todas las tareas de ese curso
      const { data: tareasData, error } = await supabase
        .from('tareas')
        .select('id, titulo, descripcion, fecha_entrega, puntos_maximos')
        .eq('curso_id', cursoId)
        .order('fecha_entrega', { ascending: false })

      if (error) { console.error('Error cargando tareas:', error); return }

      if (!tareasData || tareasData.length === 0) {
        setTareas([])
        return
      }

      // Para cada tarea, obtener conteo de entregas por estado
      const tareasConStats = await Promise.all(
        tareasData.map(async (t) => {
          const { data: entregas } = await supabase
            .from('entregas')
            .select('status')
            .eq('tarea_id', t.id)

          const lista = entregas || []
          return {
            ...t,
            pendientes: lista.filter(e => e.status === 'pendiente').length,
            entregadas: lista.filter(e => e.status === 'entregada').length,
            calificadas: lista.filter(e => e.status === 'calificada').length,
          }
        })
      )

      setTareas(tareasConStats)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [cursoId, router])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Cargando tareas…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {curso ? `${curso.nombre}` : 'Tareas del Curso'}
          </h1>
          {curso && (
            <p className="text-sm text-gray-500">{curso.grado}° {curso.grupo}</p>
          )}
        </div>
      </div>

      {/* Lista de tareas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-teal-600" />
            Tareas ({tareas.length})
          </CardTitle>
          <CardDescription>
            Selecciona una tarea para ver y calificar las entregas de los alumnos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tareas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No hay tareas en este curso</p>
              <p className="text-sm mt-1">Los maestros aún no han publicado tareas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tareas.map((tarea) => (
                <div
                  key={tarea.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <h3 className="font-semibold text-gray-900 truncate">{tarea.titulo}</h3>
                    {tarea.descripcion && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{tarea.descripcion}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Fecha de entrega: {new Date(tarea.fecha_entrega).toLocaleDateString('es-MX')}
                      {' · '}
                      {tarea.puntos_maximos} pts
                    </p>
                    {/* Mini stats de entregas */}
                    <div className="flex gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        {tarea.calificadas} calificadas
                      </span>
                      <span className="flex items-center gap-1 text-xs text-yellow-600">
                        <Clock className="h-3 w-3" />
                        {tarea.entregadas} por calificar
                      </span>
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {tarea.pendientes} sin entregar
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tarea.entregadas > 0 && (
                      <Badge variant="secondary" className="text-yellow-700 bg-yellow-50">
                        {tarea.entregadas} por calificar
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      onClick={() => router.push(`/auxiliar/tarea/${tarea.id}/entregas`)}
                    >
                      Ver Entregas
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
