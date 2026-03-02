'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, FileText, DollarSign, GraduationCap, UserCog, Receipt, ArrowRight, List, Users } from 'lucide-react'

const supabase = createClient()

interface Stats {
  totalAlumnos: number
  totalMaestros: number
  totalCursos: number
  totalTareas: number
  ingresosDelMes: number
  pagosPendientes: number
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
  const [loading, setLoading] = useState(true)

  const obtenerDatos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { count: alumnosCount } = await supabase.from('alumnos').select('*', { count: 'exact', head: true })
      const { count: maestrosCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'maestro')
      const { count: cursosCount } = await supabase.from('cursos').select('*', { count: 'exact', head: true })
      const { count: tareasCount } = await supabase.from('tareas').select('*', { count: 'exact', head: true })

      const inicioMes = new Date()
      inicioMes.setDate(1)
      inicioMes.setHours(0, 0, 0, 0)

      const { data: pagosDelMes } = await supabase.from('pagos').select('monto').eq('estado', 'pagado').gte('fecha_pago', inicioMes.toISOString())
      const ingresosDelMes = pagosDelMes?.reduce((sum, p) => sum + p.monto, 0) || 0

      const { data: pagosPendientesData } = await supabase.from('pagos').select('monto').in('estado', ['pendiente', 'vencido'])
      const totalPendiente = pagosPendientesData?.reduce((sum, p) => sum + p.monto, 0) || 0

      setStats({ totalAlumnos: alumnosCount || 0, totalMaestros: maestrosCount || 0, totalCursos: cursosCount || 0, totalTareas: tareasCount || 0, ingresosDelMes, pagosPendientes: totalPendiente })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { obtenerDatos() }, [obtenerDatos])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" aria-live="polite" aria-busy="true">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" role="status" aria-label="Cargando..."></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-sm text-gray-600 mt-1">Gestión administrativa del sistema escolar</p>
      </div>

      {/* Estadísticas Principales */}
      <section aria-labelledby="resumen-heading">
        <h2 id="resumen-heading" className="text-xl font-bold text-gray-900 mb-4">Resumen General</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Alumnos</CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center" aria-hidden="true">
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
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center" aria-hidden="true">
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
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center" aria-hidden="true">
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
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center" aria-hidden="true">
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
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center" aria-hidden="true">
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
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center" aria-hidden="true">
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
      <section aria-labelledby="acceso-rapido-heading">
        <h2 id="acceso-rapido-heading" className="text-xl font-bold text-gray-900 mb-4">Acceso Rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {[
            { href: '/directivo/usuarios', icon: UserCog, label: 'Usuarios', desc: 'Gestionar maestros y personal', color: 'blue' },
            { href: '/directivo/alumnos-por-grado', icon: Users, label: 'Por Grado/Grupo', desc: 'Vista organizada por grado', color: 'indigo' },
            { href: '/directivo/cursos', icon: BookOpen, label: 'Cursos', desc: 'Gestionar cursos y materias', color: 'green' },
            { href: '/directivo/grados-grupos', icon: List, label: 'Grados y Grupos', desc: 'Administrar niveles académicos', color: 'yellow' },
            { href: '/directivo/pagos', icon: DollarSign, label: 'Pagos', desc: 'Pagos en línea y recibos', color: 'emerald' },
            { href: '/directivo/boletas', icon: Receipt, label: 'Boletas', desc: 'Gestionar boletas de calificaciones', color: 'orange' },
          ].map((item) => (
            <Card
              key={item.href}
              className={`hover:shadow-lg transition-all cursor-pointer group`}
              onClick={() => router.push(item.href)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push(item.href)}
              aria-label={`Ir a ${item.label}: ${item.desc}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors" aria-hidden="true">
                        <item.icon className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">{item.label}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" aria-hidden="true" />
                </div>
              </CardContent>
            </Card>
          ))}

        </div>
      </section>
    </div>
  )
}