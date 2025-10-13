'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase' // ← CAMBIO AQUÍ
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, BookOpen, DollarSign, LogOut, Search } from 'lucide-react'

export default function DirectivoDashboard() {
  const [directivo, setDirectivo] = useState<any>(null)
  const [alumnos, setAlumnos] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
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

      // Obtener datos del directivo
      const { data: directivoData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setDirectivo(directivoData)

      // Obtener todos los alumnos
      const { data: alumnosData } = await supabase
        .from('alumnos')
        .select(`
          *,
          profiles (*),
          inscripciones (count),
          pagos (*)
        `)
        .order('created_at', { ascending: false })

      setAlumnos(alumnosData || [])
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

  const alumnosFiltrados = alumnos.filter(alumno =>
    alumno.profiles?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.profiles?.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumno.matricula.includes(searchTerm)
  )

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
              Panel Directivo - {directivo?.nombre} 🎓
            </h1>
            <p className="text-sm text-gray-500">Control escolar y administración</p>
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
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alumnos.length}</div>
              <p className="text-xs text-muted-foreground">Alumnos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Cursos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${alumnos.reduce((sum, a) => {
                  const pendientes = a.pagos?.filter((p: any) => p.status === 'pendiente') || []
                  return sum + pendientes.reduce((s: number, p: any) => s + parseFloat(p.monto), 0)
                }, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">MXN por cobrar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Maestros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Personal docente</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de alumnos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Alumnos Registrados</CardTitle>
                <CardDescription>Gestión de expedientes estudiantiles</CardDescription>
              </div>
              <Button>Nuevo Alumno</Button>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alumnosFiltrados.map((alumno) => (
                <div
                  key={alumno.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-semibold">
                      {alumno.profiles?.nombre} {alumno.profiles?.apellidos}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Matrícula: {alumno.matricula} • {alumno.grado} {alumno.grupo}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Ver Expediente</Button>
                    <Button size="sm" variant="outline">Pagos</Button>
                    <Button size="sm">Editar</Button>
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