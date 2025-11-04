'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react'

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

// NOTA: Solo incluimos nombre y apellidos - SIN información de contacto
interface Alumno {
  id: string
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

export default function AuxiliarEntregasTarea() {
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
      // Obtener información de la tarea
      const { data: tareaData } = await supabase
        .from('tareas')
        .select('*, cursos (id, nombre, grado, grupo)')
        .eq('id', tareaId)
        .single()

      setTarea(tareaData)

      // Obtener entregas - SOLO con nombre y apellidos (sin matrícula ni contacto)
      const { data: entregasData } = await supabase
        .from('entregas')
        .select('id, status, calificacion, retroalimentacion, fecha_entrega, archivo_url, comentarios, alumnos (id, profiles (nombre, apellidos))')
        .eq('tarea_id', tareaId)
        .order('fecha_entrega', { ascending: false })

      setEntregas(entregasData || [])
    } catch (error) {
      console.error('Error:', error)
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
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar la calificación')
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
            <CardDescription>{tarea?.cursos?.nombre} - {tarea?.cursos?.grado}° {tarea?.cursos?.grupo}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500">Total</div>
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
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entregas de Alumnos</CardTitle>
            <CardDescription className="text-yellow-600">
              ⚠️ Acceso restringido: Solo puedes ver nombres para fines de calificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entregas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No hay entregas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entregas.map((entrega) => (
                  <div key={entrega.id} className="border rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                      <div>
                        {/* SOLO nombre y apellidos - SIN matrícula ni información de contacto */}
                        <h3 className="font-semibold">{entrega.alumnos?.profiles?.nombre} {entrega.alumnos?.profiles?.apellidos}</h3>
                        <p className="text-xs text-gray-400">Información de contacto restringida</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {entrega.status === 'calificada' && tarea && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">{entrega.calificacion}/{tarea.puntos_maximos}</div>
                            <div className="text-xs text-gray-500">Calificación</div>
                          </div>
                        )}
                        <Badge variant={entrega.status === 'calificada' ? 'default' : entrega.status === 'entregada' ? 'secondary' : 'destructive'}>
                          {entrega.status === 'calificada' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {entrega.status === 'entregada' && <Clock className="h-3 w-3 mr-1" />}
                          {entrega.status === 'pendiente' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {entrega.status === 'calificada' ? 'Calificada' : entrega.status === 'entregada' ? 'Entregada' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>

                    {entrega.status !== 'pendiente' && (
                      <div className="p-4 space-y-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Entregado:</span> {entrega.fecha_entrega ? new Date(entrega.fecha_entrega).toLocaleString('es-MX') : 'N/A'}
                        </div>

                        {entrega.archivo_url && (
                          <Button variant="link" onClick={() => window.open(entrega.archivo_url || '', '_blank')} className="p-0 h-auto">
                            <FileText className="h-4 w-4 mr-2" />
                            Ver archivo
                          </Button>
                        )}

                        {entrega.comentarios && (
                          <div className="p-3 bg-gray-50 rounded">
                            <div className="text-xs font-medium text-gray-500 mb-1">Comentarios:</div>
                            <p className="text-sm text-gray-700">{entrega.comentarios}</p>
                          </div>
                        )}

                        {calificando === entrega.id ? (
                          <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                            <div>
                              <Label>Calificación (0-{tarea?.puntos_maximos})</Label>
                              <Input
                                type="number"
                                min="0"
                                max={tarea?.puntos_maximos}
                                value={formCalificar.calificacion}
                                onChange={(e) => setFormCalificar({ ...formCalificar, calificacion: e.target.value })}
                              />
                            </div>
                            <div>
                              <Label>Retroalimentación</Label>
                              <textarea
                                value={formCalificar.retroalimentacion}
                                onChange={(e) => setFormCalificar({ ...formCalificar, retroalimentacion: e.target.value })}
                                className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={() => guardarCalificacion(entrega.id)} className="flex-1">Guardar</Button>
                              <Button variant="outline" onClick={cancelarCalificacion}>Cancelar</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {entrega.retroalimentacion && (
                              <div className="p-3 bg-blue-50 rounded">
                                <div className="text-xs font-medium text-blue-600 mb-1">Retroalimentación:</div>
                                <p className="text-sm text-gray-700">{entrega.retroalimentacion}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              {entrega.status === 'entregada' && <Button size="sm" onClick={() => iniciarCalificacion(entrega)}>Calificar</Button>}
                              {entrega.status === 'calificada' && <Button size="sm" variant="outline" onClick={() => iniciarCalificacion(entrega)}>Editar</Button>}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
