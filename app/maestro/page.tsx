'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, FileText, Users, Plus, Lock, Edit, Trash2, Search } from 'lucide-react'
import { DialogoEditarTarea } from './curso/[id]/DialogoEditarTarea'
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

interface Profile {
  nombre: string
  apellidos: string
}

interface Curso {
  id: string
  nombre: string
  descripcion: string
  grado: string
  grupo: string
  _count?: {
    inscripciones: number
  }
}

interface Tarea {
  id: string
  titulo: string
  descripcion: string | null
  fecha_entrega: string
  puntos_maximos: number
  cursos: {
    nombre: string
    grado: string
    grupo: string
  }
}

export default function MaestroDashboard() {
  const router = useRouter()
  const [maestro, setMaestro] = useState<Profile | null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)

  const getSaludo = () => {
    const hora = new Date().getHours()
    if (hora < 12) return 'Buenos días'
    if (hora < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  // Estado modales
  const [tareaAEditar, setTareaAEditar] = useState<Tarea | null>(null)
  const [tareaAEliminar, setTareaAEliminar] = useState<Tarea | null>(null)
  const [eliminando, setEliminando] = useState(false)
  
  // Estado filtros de búsqueda
  const [searchCurso, setSearchCurso] = useState('')
  const [searchTarea, setSearchTarea] = useState('')

  const handleEliminar = async () => {
    if (!tareaAEliminar) return
    try {
      setEliminando(true)
      const res = await eliminarTarea(tareaAEliminar.id)
      if (res.success) {
        setTareaAEliminar(null)
        obtenerDatos()
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

  const obtenerDatos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nombre, apellidos')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setMaestro(profileData)
      }

      const { data: rawCursosData } = await supabase
        .from('cursos')
        .select('id, nombre, descripcion, grado, grupo')
        .eq('maestro_id', user.id)
        .order('nombre')

      let cursosData = rawCursosData || []

      // Obtener el conteo de alumnos para cada curso
      if (cursosData.length > 0) {
        cursosData = await Promise.all(
          cursosData.map(async (curso) => {
            const { count: totalAlumnos } = await supabase
              .from('inscripciones')
              .select('*', { count: 'exact', head: true })
              .eq('curso_id', curso.id)

            return {
              ...curso,
              _count: { inscripciones: totalAlumnos ?? 0 }
            }
          })
        )
      }

      setCursos(cursosData)

      const cursosIds = cursosData.map(c => c.id)

      const { data: tareasData } = await supabase
        .from('tareas')
        .select(`
          id,
          titulo,
          descripcion,
          fecha_entrega,
          puntos_maximos,
          cursos (
            nombre,
            grado,
            grupo
          )
        `)
        .in('curso_id', cursosIds)
        .order('fecha_entrega', { ascending: false })
        .limit(5)

      if (tareasData) {
        const tareasProcesadas = tareasData.map((t: any) => ({
          ...t,
          cursos: Array.isArray(t.cursos) ? t.cursos[0] : t.cursos
        }))
        setTareas(tareasProcesadas)
      }

    } catch (err) {
      const error = err as Error
      console.error('Error:', error)
      alert('Error al cargar los datos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    obtenerDatos()
  }, [obtenerDatos])

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

  // Filtrado de listas
  const cursosFiltrados = cursos.filter(curso => 
    curso.nombre.toLowerCase().includes(searchCurso.toLowerCase()) ||
    curso.grado.toLowerCase().includes(searchCurso.toLowerCase()) ||
    curso.grupo.toLowerCase().includes(searchCurso.toLowerCase())
  )

  const tareasFiltradas = tareas.filter(tarea => 
    tarea.titulo.toLowerCase().includes(searchTarea.toLowerCase()) ||
    tarea.cursos.nombre.toLowerCase().includes(searchTarea.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {getSaludo()}, {maestro?.nombre?.split(' ')[0] || ''} 👋
          </h1>
          <p className="text-sm text-gray-600 mt-1">Panel de Maestro</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mis Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.length}</div>
              <p className="text-xs text-muted-foreground">Activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Creadas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tareas.length}</div>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cursos.reduce((sum, c) => sum + (c._count?.inscripciones || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">En todos los cursos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Mis Cursos</CardTitle>
                  <CardDescription>Cursos que impartes</CardDescription>
                </div>
                <Button size="sm" onClick={() => router.push('/maestro/crear-tarea')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarea
                </Button>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar curso por nombre, grado o grupo..."
                  className="pl-9"
                  value={searchCurso}
                  onChange={(e) => setSearchCurso(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {cursosFiltrados.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No se encontraron cursos</p>
                ) : (
                  cursosFiltrados.map((curso) => (
                    <div key={curso.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{curso.nombre}</h3>
                        <p className="text-sm text-gray-600">
                          {curso.grado} {curso.grupo}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/maestro/curso/${curso.id}`)}
                      >
                        Ver
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tareas Recientes</CardTitle>
              <CardDescription>Últimas tareas creadas</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Buscar tarea por título o curso..."
                  className="pl-9"
                  value={searchTarea}
                  onChange={(e) => setSearchTarea(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {tareasFiltradas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No se encontraron tareas</p>
                ) : (
                  tareasFiltradas.map((tarea) => (
                    <div key={tarea.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{tarea.titulo}</h3>
                        <p className="text-sm text-gray-600">
                          {tarea.cursos.nombre} - {tarea.cursos.grado} {tarea.cursos.grupo}
                        </p>
                        <p className="text-xs text-gray-500">
                          Fecha: {new Date(tarea.fecha_entrega).toLocaleDateString()}
                        </p>
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
                          Entregas
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
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
          onSuccess={obtenerDatos}
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