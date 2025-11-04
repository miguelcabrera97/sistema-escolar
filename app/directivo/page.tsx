'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, FileText, DollarSign } from 'lucide-react'

interface Profile {
  nombre: string
  apellidos: string
}

interface Stats {
  totalAlumnos: number
  totalMaestros: number
  totalCursos: number
  totalTareas: number
  ingresosDelMes: number
  pagosPendientes: number
}

interface Curso {
  id: string
  nombre: string
  grado: string
  grupo: string
  maestro_profiles: Profile
}

interface Pago {
  id: string
  concepto: string
  monto: number
  status: string
  fecha_entrega: string
  alumnos: {
    matricula: string
    profiles: Profile
  }
}

export default function DirectivoDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({
    totalAlumnos: 0,
    totalMaestros: 0,
    totalCursos: 0,
    totalTareas: 0,
    ingresosDelMes: 0,
    pagosPendientes: 0
  })
  const [cursos, setCursos] = useState<Curso[]>([])
  const [pagosPendientes, setPagosPendientes] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  const obtenerDatos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { count: alumnosCount } = await supabase
        .from('alumnos')
        .select('*', { count: 'exact', head: true })

      const { count: maestrosCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'maestro')

      const { count: cursosCount } = await supabase
        .from('cursos')
        .select('*', { count: 'exact', head: true })

      const { count: tareasCount } = await supabase
        .from('tareas')
        .select('*', { count: 'exact', head: true })

      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)

      const { data: pagosDelMes } = await supabase
        .from('pagos')
        .select('monto')
        .eq('status', 'pagado')
        .gte('fecha_pago', inicioMes.toISOString())

      const ingresosDelMes = pagosDelMes?.reduce((sum, p) => sum + p.monto, 0) || 0

      const { data: pagosPendientesData } = await supabase
        .from('pagos')
        .select('monto')
        .in('status', ['pendiente', 'vencido'])

      const totalPendiente = pagosPendientesData?.reduce((sum, p) => sum + p.monto, 0) || 0

      setStats({
        totalAlumnos: alumnosCount || 0,
        totalMaestros: maestrosCount || 0,
        totalCursos: cursosCount || 0,
        totalTareas: tareasCount || 0,
        ingresosDelMes,
        pagosPendientes: totalPendiente
      })

      const { data: cursosData } = await supabase
        .from('cursos')
        .select(`
          id,
          nombre,
          grado,
          grupo,
          maestro_profiles:profiles!cursos_maestro_id_fkey(nombre, apellidos)
        `)
        .order('grado', { ascending: true })
        .limit(5)

      if (cursosData) {
        setCursos(cursosData)
      }

      const { data: pagosData } = await supabase
        .from('pagos')
        .select(`
          *,
          alumnos (
            matricula,
            profiles (
              nombre,
              apellidos
            )
          )
        `)
        .in('status', ['pendiente', 'vencido'])
        .order('fecha_entrega', { ascending: true })
        .limit(5)

      if (pagosData) {
        setPagosPendientes(pagosData)
      }

    } catch (error) {
      const err = error as Error
      console.error('Error:', err)
      alert('Error al cargar los datos: ' + err.message)
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
    <h1 className="text-3xl font-bold text-gray-900">Panel de Directivo</h1>
    <p className="text-gray-600">Vista general del sistema</p>
  </div>
  <div className="flex gap-2">
  <Button onClick={() => router.push('/directivo/cursos')}>
    Gestionar Cursos
  </Button>
  <Button onClick={() => router.push('/directivo/usuarios')}>
    Gestionar Usuarios
  </Button>
  <Button onClick={() => router.push('/directivo/alumnos')}>
    Ver Alumnos
  </Button>
  <Button onClick={() => router.push('/directivo/pagos')}>
    Gestionar Pagos
  </Button>
  <Button onClick={() => router.push('/directivo/boletas')}>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alumnos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAlumnos}</div>
              <p className="text-xs text-muted-foreground">Inscritos actualmente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Maestros</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMaestros}</div>
              <p className="text-xs text-muted-foreground">En la plataforma</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCursos}</div>
              <p className="text-xs text-muted-foreground">Activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTareas}</div>
              <p className="text-xs text-muted-foreground">Creadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.ingresosDelMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">MXN</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${stats.pagosPendientes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Por cobrar</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Cursos Recientes</CardTitle>
              <CardDescription>Últimos cursos creados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cursos.map((curso) => (
                  <div key={curso.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{curso.nombre}</h3>
                      <p className="text-sm text-gray-600">
                        {curso.grado} {curso.grupo} - {curso.maestro_profiles.nombre} {curso.maestro_profiles.apellidos}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagos Pendientes</CardTitle>
              <CardDescription>Próximos a vencer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pagosPendientes.map((pago) => (
                  <div key={pago.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{pago.concepto}</h3>
                      <p className="text-sm text-gray-600">
                        {pago.alumnos?.profiles ? (
                          `${pago.alumnos.profiles.nombre} ${pago.alumnos.profiles.apellidos} - ${pago.alumnos.matricula}`
                        ) : (
                          'Alumno no disponible'
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        Vence: {new Date(pago.fecha_entrega).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}