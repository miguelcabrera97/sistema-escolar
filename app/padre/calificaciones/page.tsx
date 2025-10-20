'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Award, BookOpen, TrendingUp, FileText, User } from 'lucide-react'

interface Profile {
  nombre: string
  apellidos: string
}

interface Alumno {
  id: string
  matricula: string
  grado: string
  grupo: string
  profiles: Profile
}

interface Curso {
  id: string
  nombre: string
  descripcion: string
  maestro_profiles: Profile
}

interface Entrega {
  id: string
  status: string
  calificacion: number | null
  retroalimentacion: string | null
  fecha_entrega: string | null
}

interface Tarea {
  id: string
  titulo: string
  descripcion: string
  fecha_vencimiento: string
  puntos_maximos: number
  curso_id: string
  entregas: Entrega[]
}

interface CalificacionPorCurso {
  curso: Curso
  tareas: Tarea[]
  promedio: number
  tareasCalificadas: number
  totalTareas: number
}

export default function CalificacionesPadre() {
  const router = useRouter()
  const [hijos, setHijos] = useState<Alumno[]>([])
  const [hijoSeleccionado, setHijoSeleccionado] = useState<string>('')
  const [calificacionesPorCurso, setCalificacionesPorCurso] = useState<CalificacionPorCurso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarHijos()
  }, [])

  useEffect(() => {
    if (hijoSeleccionado) {
      cargarCalificaciones(hijoSeleccionado)
    }
  }, [hijoSeleccionado])

  const cargarHijos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Obtener hijos del padre
      const { data: hijosData } = await supabase
        .from('alumnos')
        .select('*, profiles(nombre, apellidos)')
        .eq('padre_id', user.id)

      if (hijosData && hijosData.length > 0) {
        setHijos(hijosData)
        setHijoSeleccionado(hijosData[0].id) // Seleccionar el primer hijo por defecto
      }

    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar información de los hijos')
    } finally {
      setLoading(false)
    }
  }

  const cargarCalificaciones = async (alumnoId: string) => {
    try {
      setLoading(true)

      // Obtener cursos inscritos del hijo
      const { data: inscripcionesData } = await supabase
        .from('inscripciones')
        .select(`
          cursos (
            id,
            nombre,
            descripcion,
            maestro_profiles:profiles!cursos_maestro_id_fkey(nombre, apellidos)
          )
        `)
        .eq('alumno_id', alumnoId)

      if (!inscripcionesData) {
        setCalificacionesPorCurso([])
        return
      }

      // Para cada curso, obtener tareas y calificaciones
      const calificaciones: CalificacionPorCurso[] = []

      for (const inscripcion of inscripcionesData) {
        const curso = inscripcion.cursos

        // Obtener tareas del curso
        const { data: tareasData } = await supabase
          .from('tareas')
          .select(`
            *,
            entregas!entregas_tarea_id_fkey(
              id,
              status,
              calificacion,
              retroalimentacion,
              fecha_entrega,
              alumno_id
            )
          `)
          .eq('curso_id', curso.id)
          .order('fecha_vencimiento', { ascending: false })

        if (tareasData) {
          // Filtrar solo las entregas del hijo seleccionado
          const tareasConEntregas = tareasData.map(tarea => ({
            ...tarea,
            entregas: tarea.entregas?.filter((e: Entrega & { alumno_id: string }) =>
              e.alumno_id === alumnoId
            ) || []
          }))

          // Calcular promedio del curso
          const tareasCalificadas = tareasConEntregas.filter(t => {
            const entrega = t.entregas.find((e: Entrega) => e.id)
            return entrega && entrega.calificacion !== null
          })

          const promedio = tareasCalificadas.length > 0
            ? tareasCalificadas.reduce((sum, t) => {
                const entrega = t.entregas.find((e: Entrega) => e.id)
                return sum + (entrega?.calificacion || 0)
              }, 0) / tareasCalificadas.length
            : 0

          calificaciones.push({
            curso,
            tareas: tareasConEntregas,
            promedio,
            tareasCalificadas: tareasCalificadas.length,
            totalTareas: tareasConEntregas.length
          })
        }
      }

      setCalificacionesPorCurso(calificaciones)

    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar las calificaciones')
    } finally {
      setLoading(false)
    }
  }

  if (loading && hijos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (hijos.length === 0) {
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
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No tienes hijos registrados en el sistema</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const hijoActual = hijos.find(h => h.id === hijoSeleccionado)

  // Calcular promedio general
  const totalCalificaciones = calificacionesPorCurso.reduce((sum, c) => sum + c.tareasCalificadas, 0)
  const promedioGeneral = totalCalificaciones > 0
    ? calificacionesPorCurso.reduce((sum, c) => sum + (c.promedio * c.tareasCalificadas), 0) / totalCalificaciones
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Selector de hijo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-blue-600" />
              Calificaciones de mis Hijos
            </CardTitle>
            <CardDescription>
              Consulta el rendimiento académico de tus hijos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Seleccionar hijo:
              </label>
              <Select value={hijoSeleccionado} onValueChange={setHijoSeleccionado}>
                <SelectTrigger className="w-full md:w-96">
                  <SelectValue placeholder="Selecciona un hijo" />
                </SelectTrigger>
                <SelectContent>
                  {hijos.map((hijo) => (
                    <SelectItem key={hijo.id} value={hijo.id}>
                      {hijo.profiles.nombre} {hijo.profiles.apellidos} - {hijo.matricula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{promedioGeneral.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Promedio General</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{calificacionesPorCurso.length}</div>
                  <div className="text-sm text-gray-600">Cursos</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{totalCalificaciones}</div>
                  <div className="text-sm text-gray-600">Tareas Calificadas</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">
                    {calificacionesPorCurso.reduce((sum, c) => sum + c.totalTareas, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total de Tareas</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información del hijo seleccionado */}
        {hijoActual && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <User className="h-12 w-12 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold">
                    {hijoActual.profiles.nombre} {hijoActual.profiles.apellidos}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Matrícula: {hijoActual.matricula} • Grado: {hijoActual.grado}° {hijoActual.grupo}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calificaciones por curso */}
        {calificacionesPorCurso.map((calCurso) => (
          <Card key={calCurso.curso.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {calCurso.curso.nombre}
                  </CardTitle>
                  <CardDescription>
                    Profesor: {calCurso.curso.maestro_profiles.nombre} {calCurso.curso.maestro_profiles.apellidos}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{calCurso.promedio.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">Promedio</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                {calCurso.tareasCalificadas} de {calCurso.totalTareas} tareas calificadas
              </div>

              {calCurso.tareas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No hay tareas en este curso</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarea</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Entregada</TableHead>
                        <TableHead>Calificación</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Retroalimentación</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calCurso.tareas.map((tarea) => {
                        const entrega = tarea.entregas.find(e => e.id)
                        const calificacionPorcentaje = entrega?.calificacion
                          ? ((entrega.calificacion / tarea.puntos_maximos) * 100).toFixed(0)
                          : null

                        return (
                          <TableRow key={tarea.id}>
                            <TableCell className="font-medium">{tarea.titulo}</TableCell>
                            <TableCell>
                              {new Date(tarea.fecha_vencimiento).toLocaleDateString('es-MX')}
                            </TableCell>
                            <TableCell>
                              {entrega?.fecha_entrega
                                ? new Date(entrega.fecha_entrega).toLocaleDateString('es-MX')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {entrega?.calificacion !== null && entrega?.calificacion !== undefined ? (
                                <div>
                                  <span className="font-bold text-lg">{entrega.calificacion}</span>
                                  <span className="text-gray-500">/{tarea.puntos_maximos}</span>
                                  <Badge
                                    variant={
                                      parseInt(calificacionPorcentaje || '0') >= 90 ? 'default' :
                                      parseInt(calificacionPorcentaje || '0') >= 70 ? 'secondary' :
                                      'destructive'
                                    }
                                    className="ml-2"
                                  >
                                    {calificacionPorcentaje}%
                                  </Badge>
                                </div>
                              ) : (
                                <span className="text-gray-400">Sin calificar</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  entrega?.status === 'calificada' ? 'default' :
                                  entrega?.status === 'entregada' ? 'secondary' :
                                  'outline'
                                }
                              >
                                {entrega?.status === 'calificada' ? 'Calificada' :
                                 entrega?.status === 'entregada' ? 'Entregada' :
                                 'Pendiente'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {entrega?.retroalimentacion ? (
                                <div className="max-w-xs">
                                  <p className="text-sm text-gray-600">
                                    {entrega.retroalimentacion}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {calificacionesPorCurso.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">El alumno no está inscrito en ningún curso</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
