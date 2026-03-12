'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, FileText, ClipboardCheck, GraduationCap, Search } from 'lucide-react'

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
  maestro: {
    nombre: string
    apellidos: string
  } | null
}

interface Tarea {
  id: string
  titulo: string
  fecha_entrega: string
  puntos_maximos: number
  cursos: {
    nombre: string
    grado: string
    grupo: string
  }
}

interface EstadisticasEntregas {
  pendientes: number
  entregadas: number
  calificadas: number
}

export default function AuxiliarDashboard() {
  const router = useRouter()
  const [auxiliar, setAuxiliar] = useState<Profile | null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasEntregas>({
    pendientes: 0,
    entregadas: 0,
    calificadas: 0
  })
  const [loading, setLoading] = useState(true)
  const [busquedaCurso, setBusquedaCurso] = useState('')

  const obtenerDatos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Obtener datos del perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nombre, apellidos')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setAuxiliar(profileData)
      }

      // Obtener TODOS los cursos (acceso global)
      const { data: cursosData } = await supabase
        .from('cursos')
        .select(`
            id,
            nombre,
            descripcion,
            grado,
            grupo,
            maestro_id
        `)
        .order('grado')
        .order('grupo')

      if (cursosData && cursosData.length > 0) {
        const maestroIds = cursosData.map((c: any) => c.maestro_id).filter(Boolean)

        // Obtener info de maestros si hay IDs
        let maestros: any[] = []
        if (maestroIds.length > 0) {
          const { data: maestrosData } = await supabase
            .from('profiles')
            .select('id, nombre, apellidos')
            .in('id', maestroIds)

          if (maestrosData) maestros = maestrosData
        }

        const cursosConMaestro = cursosData.map((curso: any) => {
          const maestro = maestros.find(m => m.id === curso.maestro_id)
          return {
            ...curso,
            maestro: maestro ? {
              nombre: maestro.nombre,
              apellidos: maestro.apellidos
            } : null
          }
        })

        setCursos(cursosConMaestro)
      }

      // Obtener TODAS las tareas del sistema (sin filtrar por maestro)
      const { data: tareasData, error: tareasError } = await supabase
        .from('tareas')
        .select(`
          id,
          titulo,
          fecha_entrega,
          puntos_maximos,
          cursos (
            nombre,
            grado,
            grupo
          )
        `)
        .order('fecha_entrega', { ascending: false })
        .limit(10)

      if (tareasError) console.error('Error cargando tareas:', tareasError)

      if (tareasData) {
        const tareasProcesadas = tareasData.map((t: any) => ({
          ...t,
          cursos: Array.isArray(t.cursos) ? t.cursos[0] : t.cursos
        }))
        setTareas(tareasProcesadas)
      }

      // Obtener estadísticas de entregas
      const { data: entregasData } = await supabase
        .from('entregas')
        .select('status')

      if (entregasData) {
        const stats = {
          pendientes: entregasData.filter(e => e.status === 'pendiente').length,
          entregadas: entregasData.filter(e => e.status === 'entregada').length,
          calificadas: entregasData.filter(e => e.status === 'calificada').length
        }
        setEstadisticas(stats)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {auxiliar?.nombre} {auxiliar?.apellidos}
              </h1>
              <p className="text-gray-600">Auxiliar de Calificaciones</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/auxiliar/boletas')}>
                <FileText className="mr-2 h-4 w-4" />
                Gestionar Boletas
              </Button>
              <Button variant="outline" onClick={() => {
                supabase.auth.signOut()
                router.push('/login')
              }}>
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cursos</CardTitle>
              <GraduationCap className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.length}</div>
              <p className="text-xs text-muted-foreground">Disponibles en el sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.pendientes}</div>
              <p className="text-xs text-muted-foreground">Entregas sin realizar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregadas</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.entregadas}</div>
              <p className="text-xs text-muted-foreground">Por calificar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificadas</CardTitle>
              <BookOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.calificadas}</div>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Grid con dos columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cursos Asignados */}
          <Card>
            <CardHeader>
              <CardTitle>Todos los Cursos</CardTitle>
              <CardDescription>Acceso global a cursos del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por curso, grado, grupo o maestro…"
                  value={busquedaCurso}
                  onChange={(e) => setBusquedaCurso(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="space-y-4">
                {(() => {
                  const query = busquedaCurso.toLowerCase()
                  const cursosFiltrados = query
                    ? cursos.filter(c =>
                        c.nombre.toLowerCase().includes(query) ||
                        String(c.grado).includes(query) ||
                        c.grupo.toLowerCase().includes(query) ||
                        (c.maestro && `${c.maestro.nombre} ${c.maestro.apellidos}`.toLowerCase().includes(query))
                      )
                    : cursos
                  return cursosFiltrados.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      {cursos.length === 0 ? 'No hay cursos asignados aún' : 'Sin resultados para tu búsqueda'}
                    </p>
                  ) : (
                    cursosFiltrados.map((curso) => (
                    <div key={curso.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div>
                        <h3 className="font-semibold">{curso.nombre}</h3>
                        <p className="text-sm text-gray-600">
                          {curso.grado}° {curso.grupo}
                        </p>
                        {curso.maestro && (
                          <p className="text-xs text-gray-500">
                            Maestro: {curso.maestro.nombre} {curso.maestro.apellidos}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/auxiliar/curso/${curso.id}`)}
                      >
                        Ver Tareas
                      </Button>
                    </div>
                    ))
                  )
                })()} 
              </div>
            </CardContent>
          </Card>

          {/* Tareas Recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Tareas Recientes</CardTitle>
              <CardDescription>Últimas tareas del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tareas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No hay tareas en el sistema</p>
                ) : (
                  tareas.map((tarea) => (
                    <div key={tarea.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div>
                        <h3 className="font-semibold">{tarea.titulo}</h3>
                        <p className="text-sm text-gray-600">
                          {tarea.cursos.nombre} - {tarea.cursos.grado}° {tarea.cursos.grupo}
                        </p>
                        <p className="text-xs text-gray-500">
                          Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString('es-MX')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Puntos: {tarea.puntos_maximos}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => router.push(`/auxiliar/tarea/${tarea.id}/entregas`)}
                      >
                        Ver Entregas
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
