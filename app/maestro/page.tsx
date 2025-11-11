'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, FileText, Users, Plus, Lock } from 'lucide-react'

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

      const { data: cursosData } = await supabase
        .from('cursos')
        .select('id, nombre, descripcion, grado, grupo')
        .eq('maestro_id', user.id)
        .order('nombre')

      if (cursosData) {
        setCursos(cursosData)
      }

      const { data: tareasData } = await supabase
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
        .in('curso_id', cursosData?.map(c => c.id) || [])
        .order('fecha_entrega', { ascending: true })
        .limit(5)

      if (tareasData) {
        setTareas(tareasData)
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
                {maestro?.nombre} {maestro?.apellidos}
              </h1>
              <p className="text-gray-600">Panel de Maestro</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/maestro/cambiar-password')}>
                <Lock className="h-4 w-4 mr-2" />
                Cambiar Contraseña
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cursos.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tienes cursos asignados</p>
                ) : (
                  cursos.map((curso) => (
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tareas.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No has creado tareas aún</p>
                ) : (
                  tareas.map((tarea) => (
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
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/maestro/tarea/${tarea.id}/entregas`)}
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