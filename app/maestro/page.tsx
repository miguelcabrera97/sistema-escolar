'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, ClipboardList, Users, LogOut, Plus } from 'lucide-react'

export default function MaestroDashboard() {
  const [maestro, setMaestro] = useState<any>(null)
  const [cursos, setCursos] = useState<any[]>([])
  const [tareas, setTareas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    obtenerDatos()
  }, [])

  const obtenerDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Obtener datos del maestro
      const { data: maestroData } = await supabase
        .from('maestros')
        .select('*, profiles(*)')
        .eq('user_id', user.id)
        .single()

      setMaestro(maestroData)

      // Obtener cursos del maestro
      const { data: cursosData } = await supabase
        .from('cursos')
        .select(`
          id,
          nombre,
          descripcion,
          grado,
          grupo,
          ciclo_escolar
        `)
        .eq('maestro_id', maestroData?.id)

      setCursos(cursosData || [])

      // Obtener tareas del maestro con entregas
      const { data: tareasData } = await supabase
        .from('tareas')
        .select(`
          id,
          titulo,
          descripcion,
          fecha_entrega,
          puntos_maximos,
          created_at,
          cursos (
            nombre,
            grado,
            grupo
          ),
          entregas (
            id,
            status
          )
        `)
        .in('curso_id', cursosData?.map(c => c.id) || [])
        .order('fecha_entrega', { ascending: true })

      setTareas(tareasData || [])

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const contarEntregasPorStatus = (entregas: any[]) => {
    return {
      total: entregas.length,
      pendientes: entregas.filter(e => e.status === 'pendiente').length,
      entregadas: entregas.filter(e => e.status === 'entregada').length,
      calificadas: entregas.filter(e => e.status === 'calificada').length,
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Panel de Maestro - {maestro?.profiles?.nombre} 👨‍🏫
            </h1>
            <p className="text-sm text-gray-500">
              Especialidad: {maestro?.especialidad}
            </p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Cards de resumen */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mis Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.length}</div>
              <p className="text-xs text-muted-foreground">Cursos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tareas Publicadas</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tareas.length}</div>
              <p className="text-xs text-muted-foreground">Tareas activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Por Calificar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tareas.reduce((acc, t) => acc + contarEntregasPorStatus(t.entregas || []).entregadas, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Entregas pendientes</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de tareas */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Mis Tareas</CardTitle>
                <CardDescription>Gestiona las tareas de tus cursos</CardDescription>
              </div>
              <Button onClick={() => router.push('/maestro/crear-tarea')}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Tarea
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tareas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tienes tareas publicadas aún</p>
                <Button className="mt-4" onClick={() => router.push('/maestro/crear-tarea')}>
                  Crear tu primera tarea
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tareas.map((tarea) => {
                  const stats = contarEntregasPorStatus(tarea.entregas || [])
                  const fechaVencida = new Date(tarea.fecha_entrega) < new Date()
                  
                  return (
                    <div
                      key={tarea.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{tarea.titulo}</h3>
                          {fechaVencida && (
                            <Badge variant="destructive">Vencida</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {tarea.descripcion}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            📚 {tarea.cursos?.nombre} - {tarea.cursos?.grado} {tarea.cursos?.grupo}
                          </span>
                          <span>
                            📅 Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString('es-MX')}
                          </span>
                          <span>
                            🎯 {tarea.puntos_maximos} puntos
                          </span>
                        </div>
                        
                        {/* Estadísticas de entregas */}
                        <div className="flex gap-2 mt-3">
                          <Badge variant="outline">
                            {stats.total} entregas
                          </Badge>
                          {stats.entregadas > 0 && (
                            <Badge variant="secondary">
                              {stats.entregadas} por calificar
                            </Badge>
                          )}
                          {stats.calificadas > 0 && (
                            <Badge variant="default">
                              {stats.calificadas} calificadas
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button 
  size="sm" 
  variant="outline"
  onClick={() => router.push(`/maestro/tarea/${tarea.id}/entregas`)}
>
  Ver Entregas
</Button>
                        <Button size="sm">
                          Editar
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de cursos */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Cursos</CardTitle>
            <CardDescription>Cursos que impartes</CardDescription>
          </CardHeader>
          <CardContent>
            {cursos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tienes cursos asignados aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cursos.map((curso) => (
                  <div
                    key={curso.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-semibold">{curso.nombre}</h3>
                      <p className="text-sm text-gray-500">{curso.descripcion}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {curso.grado} {curso.grupo} • Ciclo: {curso.ciclo_escolar}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Ver Alumnos</Button>
                      <Button size="sm">Gestionar</Button>
                    </div>
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