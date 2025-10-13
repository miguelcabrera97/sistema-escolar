'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, ClipboardList, FileText, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AlumnoDashboard() {
  const [alumno, setAlumno] = useState<any>(null)
  const [tareas, setTareas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    obtenerDatos()
  }, [])

  const obtenerDatos = async () => {
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Obtener datos del alumno
      const { data: alumnoData } = await supabase
        .from('alumnos')
        .select('*, profiles(*)')
        .eq('user_id', user.id)
        .single()

      setAlumno(alumnoData)

      // Obtener tareas pendientes
      const { data: tareasData } = await supabase
        .from('tareas')
        .select(`
          *,
          cursos(nombre),
          entregas(status, calificacion)
        `)
        .order('fecha_entrega', { ascending: true })
        .limit(5)

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hola, {alumno?.profiles?.nombre} 👋
            </h1>
            <p className="text-sm text-gray-500">
              Matrícula: {alumno?.matricula} | {alumno?.grado} {alumno?.grupo}
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
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">Cursos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tareas.filter(t => t.entregas?.length === 0).length}
              </div>
              <p className="text-xs text-muted-foreground">Por entregar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.5</div>
              <p className="text-xs text-muted-foreground">Último periodo</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de tareas */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Tareas</CardTitle>
            <CardDescription>Tareas por entregar pronto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tareas.map((tarea) => (
                <div
                  key={tarea.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold">{tarea.titulo}</h3>
                    <p className="text-sm text-gray-500">{tarea.cursos?.nombre}</p>
                    <p className="text-xs text-gray-400">
                      Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tarea.entregas?.length > 0 ? (
                      <>
                        {tarea.entregas[0].status === 'calificada' ? (
                          <Badge variant="default">
                            Calificada: {tarea.entregas[0].calificacion}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Entregada</Badge>
                        )}
                      </>
                    ) : (
                      <Badge variant="destructive">Pendiente</Badge>
                    )}
                    <Button size="sm">Ver detalles</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}