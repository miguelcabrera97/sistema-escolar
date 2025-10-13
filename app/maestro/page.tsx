'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase' // ← CAMBIO AQUÍ
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, ClipboardList, Users, LogOut } from 'lucide-react'

export default function MaestroDashboard() {
  const [maestro, setMaestro] = useState<any>(null)
  const [cursos, setCursos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  // ← YA NO NECESITAS: const supabase = createClient()

  useEffect(() => {
    obtenerDatos()
  }, [])

  const obtenerDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser() // ← usa supabase directamente
      // resto del código...
      
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
          *,
          inscripciones(count)
        `)
        .eq('maestro_id', maestroData?.id)

      setCursos(cursosData || [])
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
              <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cursos.reduce((acc, curso) => acc + (curso.inscripciones?.[0]?.count || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">Alumnos inscritos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tareas Activas</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Por calificar</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de cursos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Mis Cursos</CardTitle>
                <CardDescription>Gestiona tus materias y alumnos</CardDescription>
              </div>
              <Button>Crear Curso</Button>
            </div>
          </CardHeader>
          <CardContent>
            {cursos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tienes cursos asignados aún</p>
                <Button className="mt-4" variant="outline">Crear tu primer curso</Button>
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