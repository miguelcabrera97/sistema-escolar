'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, FileText, DollarSign, GraduationCap, UserCog, Receipt, ArrowRight, LogOut, LinkIcon } from 'lucide-react'

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
  concepto_nombre: string
  monto: number
  estado: string
  fecha_vencimiento: string
  alumnos: {
    matricula: string
    profiles: Profile
  } | null
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
        .eq('estado', 'pagado')
        .gte('fecha_pago', inicioMes.toISOString())

      const ingresosDelMes = pagosDelMes?.reduce((sum, p) => sum + p.monto, 0) || 0

      const { data: pagosPendientesData } = await supabase
        .from('pagos')
        .select('monto')
        .in('estado', ['pendiente', 'vencido'])

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
          id,
          concepto_nombre,
          monto,
          estado,
          fecha_vencimiento,
          alumnos (
            matricula,
            profiles (
              nombre,
              apellidos
            )
          )
        `)
        .in('estado', ['pendiente', 'vencido'])
        .order('fecha_vencimiento', { ascending: true })
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Panel de Control</h1>
              <p className="text-sm text-gray-600 mt-1">Gestión administrativa del sistema escolar</p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                supabase.auth.signOut()
                router.push('/login')
              }}
              className="self-end sm:self-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {/* Estadísticas Principales */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen General</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Alumnos</CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalAlumnos}</div>
                <p className="text-xs text-gray-500 mt-1">Inscritos actualmente</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Maestros</CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalMaestros}</div>
                <p className="text-xs text-gray-500 mt-1">En la plataforma</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Cursos</CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalCursos}</div>
                <p className="text-xs text-gray-500 mt-1">Cursos activos</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Tareas</CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalTareas}</div>
                <p className="text-xs text-gray-500 mt-1">Tareas creadas</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Ingresos del Mes</CardTitle>
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  ${stats.ingresosDelMes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">MXN recibidos</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-red-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pagos Pendientes</CardTitle>
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ${stats.pagosPendientes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">MXN por cobrar</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Acceso Rápido */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Acceso Rápido</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card
              className="hover:shadow-lg transition-all cursor-pointer hover:border-blue-300 group"
              onClick={() => router.push('/directivo/usuarios')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <UserCog className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">Usuarios</h3>
                    </div>
                    <p className="text-sm text-gray-600">Gestionar maestros y personal</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-all cursor-pointer hover:border-purple-300 group"
              onClick={() => router.push('/directivo/alumnos')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <GraduationCap className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">Alumnos</h3>
                    </div>
                    <p className="text-sm text-gray-600">Ver y administrar alumnos</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-all cursor-pointer hover:border-green-300 group"
              onClick={() => router.push('/directivo/cursos')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <BookOpen className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">Cursos</h3>
                    </div>
                    <p className="text-sm text-gray-600">Gestionar cursos y materias</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-all cursor-pointer hover:border-emerald-300 group"
              onClick={() => router.push('/directivo/pagos')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                        <DollarSign className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">Pagos</h3>
                    </div>
                    <p className="text-sm text-gray-600">Administrar pagos escolares</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-all cursor-pointer hover:border-orange-300 group"
              onClick={() => router.push('/directivo/boletas')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <Receipt className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">Boletas</h3>
                    </div>
                    <p className="text-sm text-gray-600">Gestionar boletas de calificaciones</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-all cursor-pointer hover:border-indigo-300 group"
              onClick={() => router.push('/directivo/relaciones-padre-alumno')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                        <LinkIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">Relaciones</h3>
                    </div>
                    <p className="text-sm text-gray-600">Vincular padres con alumnos</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Información Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Cursos Recientes</CardTitle>
                  <CardDescription>Últimos 5 cursos registrados</CardDescription>
                </div>
                <BookOpen className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              {cursos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No hay cursos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cursos.map((curso) => (
                    <div key={curso.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{curso.nombre}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {curso.grado}° {curso.grupo}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Maestro: {curso.maestro_profiles.nombre} {curso.maestro_profiles.apellidos}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-red-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Pagos Pendientes</CardTitle>
                  <CardDescription>Próximos a vencer</CardDescription>
                </div>
                <DollarSign className="h-5 w-5 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              {pagosPendientes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No hay pagos pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pagosPendientes.map((pago) => (
                    <div key={pago.id} className="flex items-start justify-between p-3 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{pago.concepto_nombre}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {pago.alumnos?.profiles ? (
                            `${pago.alumnos.profiles.nombre} ${pago.alumnos.profiles.apellidos}`
                          ) : (
                            'Alumno no disponible'
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Mat: {pago.alumnos?.matricula || 'N/A'}
                        </p>
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          Vence: {new Date(pago.fecha_vencimiento).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-bold text-lg text-red-600">
                          ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-gray-500">MXN</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}