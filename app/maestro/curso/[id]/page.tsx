'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, FileText, Plus, Eye, Edit, Trash2 } from 'lucide-react'
import { DialogoEditarTarea } from './DialogoEditarTarea'
import { eliminarTarea } from '@/app/actions/tareas-actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Curso {
  id: string
  nombre: string
  descripcion: string | null
  grado: string
  grupo: string
}

interface Alumno {
  id: string
  matricula: string
  profiles: {
    nombre: string
    apellidos: string
    email: string
  }
}

interface Tarea {
  id: string
  titulo: string
  descripcion: string | null
  fecha_entrega: string
  archivo_url: string | null
  puntos_maximos?: number
}

export default function CursoDetalle() {
  const router = useRouter()
  const params = useParams()
  const cursoId = params.id as string

  const [curso, setCurso] = useState<Curso | null>(null)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado para modales
  const [tareaAEditar, setTareaAEditar] = useState<Tarea | null>(null)
  const [tareaAEliminar, setTareaAEliminar] = useState<Tarea | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const handleEliminar = async () => {
    if (!tareaAEliminar) return
    try {
      setEliminando(true)
      const res = await eliminarTarea(tareaAEliminar.id)
      if (res.success) {
        setTareaAEliminar(null)
        cargarDatos() // recargar la lista
      } else {
        alert(res.error || 'Error al eliminar')
      }
    } catch (err) {
      console.error(err)
      alert('Error inesperado')
    } finally {
      setEliminando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [cursoId])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Cargar información del curso
      const { data: cursoData, error: cursoError } = await supabase
        .from('cursos')
        .select('id, nombre, descripcion, grado, grupo')
        .eq('id', cursoId)
        .eq('maestro_id', user.id) // Verificar que el maestro sea el dueño
        .single()

      if (cursoError) {
        console.error('Error al cargar curso:', cursoError)
        setError('No tienes acceso a este curso o no existe')
        return
      }

      if (cursoData) {
        setCurso(cursoData)
      }

      // Cargar alumnos inscritos
      const { data: alumnosData, error: alumnosError } = await supabase
        .from('inscripciones')
        .select(`
          alumno_id,
          alumnos!inner (
            id,
            matricula,
            profiles!inner (
              nombre,
              apellidos,
              email
            )
          )
        `)
        .eq('curso_id', cursoId)

      if (alumnosError) {
        console.error('Error al cargar alumnos:', alumnosError)
      } else if (alumnosData) {
        // Transformar los datos para que coincidan con la interfaz
        const alumnosFormateados = alumnosData.map((item: any) => ({
          id: item.alumnos.id,
          matricula: item.alumnos.matricula,
          profiles: Array.isArray(item.alumnos.profiles) ? item.alumnos.profiles[0] : item.alumnos.profiles
        }))

        // Ordenar alfabéticamente en memoria
        alumnosFormateados.sort((a, b) => {
          const nombreA = `${a.profiles.nombre} ${a.profiles.apellidos}`.toLowerCase()
          const nombreB = `${b.profiles.nombre} ${b.profiles.apellidos}`.toLowerCase()
          return nombreA.localeCompare(nombreB)
        })

        setAlumnos(alumnosFormateados)
      }

      // Cargar tareas del curso
      const { data: tareasData, error: tareasError } = await supabase
        .from('tareas')
        .select('id, titulo, descripcion, fecha_entrega, archivo_url, puntos_maximos')
        .eq('curso_id', cursoId)
        .order('fecha_entrega', { ascending: false })

      if (tareasError) {
        console.error('Error al cargar tareas:', tareasError)
      } else if (tareasData) {
        setTareas(tareasData)
      }

    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar los datos del curso')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando curso...</p>
        </div>
      </div>
    )
  }

  if (error || !curso) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{error || 'Curso no encontrado'}</p>
              <Button onClick={() => router.push('/maestro')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/maestro')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {curso.nombre}
                </h1>
                <p className="text-gray-600">
                  {curso.grado} {curso.grupo}
                </p>
              </div>
            </div>
            <Button onClick={() => router.push('/maestro/crear-tarea')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Descripción del curso */}
        {curso.descripcion && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{curso.descripcion}</p>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alumnos Inscritos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alumnos.length}</div>
              <p className="text-xs text-muted-foreground">Total en el curso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Creadas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tareas.length}</div>
              <p className="text-xs text-muted-foreground">Total de tareas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Alumnos */}
          <Card>
            <CardHeader>
              <CardTitle>Alumnos Inscritos</CardTitle>
              <CardDescription>
                {alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''} en este curso
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alumnos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay alumnos inscritos en este curso
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matrícula</TableHead>
                        <TableHead>Nombre</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alumnos.map((alumno) => (
                        <TableRow key={alumno.id}>
                          <TableCell className="font-medium">
                            {alumno.matricula}
                          </TableCell>
                          <TableCell>
                            {alumno.profiles.nombre} {alumno.profiles.apellidos}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Tareas */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Tareas del Curso</CardTitle>
                  <CardDescription>
                    {tareas.length} tarea{tareas.length !== 1 ? 's' : ''} creada{tareas.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push('/maestro/crear-tarea')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tareas.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay tareas creadas para este curso
                </p>
              ) : (
                <div className="space-y-4">
                  {tareas.map((tarea) => (
                    <div
                      key={tarea.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold">{tarea.titulo}</h3>
                        {tarea.descripcion && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {tarea.descripcion}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {new Date(tarea.fecha_entrega).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Badge>
                          {tarea.archivo_url && (
                            <Badge variant="secondary">Con archivo adjunto</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Editar tarea"
                          onClick={() => setTareaAEditar(tarea)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar tarea"
                          onClick={() => setTareaAEliminar(tarea)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/maestro/tarea/${tarea.id}/entregas`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Entregas
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Modales */}
      {tareaAEditar && (
        <DialogoEditarTarea
          tarea={tareaAEditar}
          open={!!tareaAEditar}
          onOpenChange={(open) => !open && setTareaAEditar(null)}
          onSuccess={cargarDatos}
        />
      )}

      <AlertDialog open={!!tareaAEliminar} onOpenChange={(open: boolean) => !open && !eliminando && setTareaAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Apunto de eliminar la tarea "{tareaAEliminar?.titulo}". 
              Esta acción no se puede deshacer y eliminará las notas de todos los alumnos
              vinculadas a esta tarea.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e: React.MouseEvent) => { e.preventDefault(); handleEliminar(); }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={eliminando}
            >
              {eliminando ? 'Eliminando...' : 'Sí, Eliminar Tarea'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
