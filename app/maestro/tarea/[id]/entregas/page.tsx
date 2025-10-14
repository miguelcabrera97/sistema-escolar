'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Profile {
  nombre: string
  apellidos: string
}

interface Curso {
  id: string
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
  profiles: Profile
}

interface Entrega {
  id: string
  status: string
  calificacion: number | null
  retroalimentacion: string | null
  fecha_entrega: string | null
  archivo_url: string | null
  comentarios: string | null
  alumnos: Alumno
}

export default function EntregasTarea() {
  const params = useParams()
  const router = useRouter()
  const tareaId = params.id as string

  const [tarea, setTarea] = useState<Tarea | null>(null)
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)
  const [calificando, setCalificando] = useState<string | null>(null)
  const [formCalificar, setFormCalificar] = useState({
    calificacion: '',
    retroalimentacion: ''
  })

  const cargarDatos = useCallback(async () => {
    try {
      const { data: tareaData } = await supabase
        .from('tareas')
        .select('*, cursos (id, nombre, grado, grupo)')
        .eq('id', tareaId)
        .single()

      setTarea(tareaData)

      const { data: entregasData } = await supabase
        .from('entregas')
        .select(`
          *,
          alumnos (
            id,
            matricula,
            profiles (
              nombre,
              apellidos
            )
          )
        `)
        .eq('tarea_id', tareaId)
        .order('fecha_entrega', { ascending: false })

      setEntregas(entregasData || [])

    } catch (error) {
      const err = error as Error
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [tareaId])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const iniciarCalificacion = (entrega: Entrega) => {
    setCalificando(entrega.id)
    setFormCalificar({
      calificacion: entrega.calificacion?.toString() || '',
      retroalimentacion: entrega.retroalimentacion || ''
    })
  }

  const cancelarCalificacion = () => {
    setCalificando(null)
    setFormCalificar({ calificacion: '', retroalimentacion: '' })
  }

  const guardarCalificacion = async (entregaId: string) => {
    try {
      const calificacion = parseInt(formCalificar.calificacion)

      if (!tarea) return

      if (isNaN(calificacion) || calificacion < 0 || calificacion > tarea.puntos_maximos) {
        alert(`La calificación debe estar entre 0 y ${tarea.puntos_maximos}`)
        return
      }

      const { error } = await supabase
        .from('entregas')
        .update({
          calificacion,
          retroalimentacion: formCalificar.retroalimentacion,
          status: 'calificada'
        })
        .eq('id', entregaId)

      if (error) throw error

      alert('Calificación guardada exitosamente')
      setCalificando(null)
      await cargarDatos()

    } catch (err) {
      const error = err as Error
      console.error('Error:', error)
      alert('Error al guardar la calificación: ' + error.message)
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

  const stats = {
    total: entregas.length,
    pendientes: entregas.filter(e => e.status === 'pendiente').length,
    entregadas: entregas.filter(e => e.status === 'entregada').length,
    calificadas: entregas.filter(e => e.status === 'calificada').length,
  }

  const promedio = entregas
    .filter(e => e.calificacion !== null)
    .reduce((sum, e) => sum + (e.calificacion || 0), 0) / (entregas.filter(e => e.calificacion !== null).length || 1)

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

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{tarea?.titulo}</CardTitle>
            <CardDescription>
              {tarea?.cursos?.nombre} - {tarea?.cursos?.grado} {tarea?.cursos?.grupo}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500">Total Entregas</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.entregadas}</div>
                <div className="text-xs text-gray-500">Por Calificar</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.calificadas}</div>
                <div className="text-xs text-gray-500">Calificadas</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.pendientes}</div>
                <div className="text-xs text-gray-500">No Entregadas</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {promedio.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Promedio</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entregas de Alumnos</CardTitle>
            <CardDescription>
              Revisa y califica las entregas de tus estudiantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entregas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>Aún no hay entregas para esta tarea</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entregas.map((entrega) => (
                  <div
                    key={entrega.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {entrega.alumnos?.profiles?.nombre} {entrega.alumnos?.profiles?.apellidos}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Matrícula: {entrega.alumnos?.matricula}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {entrega.status === 'calificada' && tarea && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {entrega.calificacion}/{tarea.puntos_maximos}
                            </div>
                            <div className="text-xs text-gray-500">Calificación</div>
                          </div>
                        )}
                        <Badge
                          variant={
                            entrega.status === 'calificada' ? 'default' :
                            entrega.status === 'entregada' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {entrega.status === 'calificada' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {entrega.status === 'entregada' && <Clock className="h-3 w-3 mr-1" />}
                          {entrega.status === 'pendiente' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {entrega.status === 'calificada' ? 'Calificada' :
                           entrega.status === 'entregada' ? 'Entregada' :
                           'Pendiente'}
                        </Badge>
                      </div>
                    </div>

                    {entrega.status !== 'pendiente' && (
                      <div className="p-4 space-y-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Entregado:</span>{' '}
                          {entrega.fecha_entrega ? new Date(entrega.fecha_entrega).toLocaleString('es-MX') : 'N/A'}
                        </div>

                        {entrega.archivo_url && (
                          <div>
                            <Button
                              variant="link"
                              onClick={() => window.open(entrega.archivo_url || '', '_blank')}
                              className="inline-flex items-center gap-2 p-0 h-auto"
                            >
                              Ver archivo entregado
                            </Button>
                          </div>
                        )}

                        {entrega.comentarios && (
                          <div className="p-3 bg-gray-50 rounded">
                            <div className="text-xs font-medium text-gray-500 mb-1">
                              Comentarios del alumno:
                            </div>
                            <p className="text-sm text-gray-700">{entrega.comentarios}</p>
                          </div>
                        )}

                        {calificando === entrega.id ? (
                          <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`cal-${entrega.id}`}>
                                  Calificación (0-{tarea?.puntos_maximos})
                                </Label>
                                <Input
                                  id={`cal-${entrega.id}`}
                                  type="number"
                                  min="0"
                                  max={tarea?.puntos_maximos}
                                  value={formCalificar.calificacion}
                                  onChange={(e) => setFormCalificar({
                                    ...formCalificar,
                                    calificacion: e.target.value
                                  })}
                                  placeholder="0"
                                />
                              </div>
                            </div>

                            <div>
                              <Label htmlFor={`retro-${entrega.id}`}>
                                Retroalimentación