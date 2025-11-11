'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, FileText, User, LogOut, CreditCard, Award, Lock } from 'lucide-react'

export default function PadreDashboard() {
  const [padre, setPadre] = useState<any>(null)
  const [hijos, setHijos] = useState<any[]>([])
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

      // Obtener datos del padre
      const { data: padreData, error: padreError } = await supabase
        .from('padres')
        .select('*, profiles(*)')
        .eq('user_id', user.id)
        .single()

      console.log('🔍 Usuario autenticado:', user.id)
      console.log('👤 Datos del padre:', padreData)

      if (padreError) {
        console.error('❌ Error al obtener padre:', padreError)
      }

      if (!padreData) {
        console.error('⚠️ No se encontró registro de padre para user_id:', user.id)
        console.log('💡 Ejecuta este SQL en Supabase:')
        console.log(`INSERT INTO padres (user_id) SELECT id FROM profiles WHERE id = '${user.id}' AND role = 'padre' AND NOT EXISTS (SELECT 1 FROM padres WHERE user_id = '${user.id}');`)
        setLoading(false)
        return
      }

      setPadre(padreData)

      console.log('🔍 Consultando alumnos para padre_id:', padreData.id)

      // Obtener hijos vinculados (sin pagos por ahora)
      const { data: hijosData, error: hijosError } = await supabase
        .from('padre_alumno')
        .select(`
          parentesco,
          alumnos (
            id,
            matricula,
            grado,
            grupo,
            user_id,
            profiles (
              nombre,
              apellidos
            )
          )
        `)
        .eq('padre_id', padreData.id)

      if (hijosError) {
        console.error('❌ Error al obtener hijos:', hijosError)
        console.error('❌ Código de error:', hijosError.code)
        console.error('❌ Mensaje:', hijosError.message)
        console.error('❌ Detalles:', hijosError.details)
        console.error('❌ Hint:', hijosError.hint)
      }

      console.log('👦 Datos de hijos:', hijosData)
      console.log('📊 Total de hijos encontrados:', hijosData?.length || 0)

      // Transformar datos para acceso más fácil
      const hijosFormateados = hijosData?.map((item: any) => ({
        ...item.alumnos,
        parentesco: item.parentesco
      })) || []

      // Obtener pagos para cada hijo
      if (hijosFormateados.length > 0) {
        const alumnoIds = hijosFormateados.map(h => h.id)
        console.log('💰 Consultando pagos para alumnos:', alumnoIds)

        const { data: pagosData, error: pagosError } = await supabase
          .from('pagos')
          .select('*')
          .in('alumno_id', alumnoIds)

        if (pagosError) {
          console.error('❌ Error al obtener pagos:', pagosError)
        } else {
          console.log('💰 Pagos encontrados:', pagosData?.length || 0)

          // Asignar pagos a cada hijo
          hijosFormateados.forEach(hijo => {
            hijo.pagos = pagosData?.filter(p => p.alumno_id === hijo.id) || []
          })
        }
      }

      setHijos(hijosFormateados)
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
              Portal de Padres - {padre?.profiles?.nombre}
            </h1>
            <p className="text-sm text-gray-500">Seguimiento académico y pagos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/padre/cambiar-password')}>
              <Lock className="h-4 w-4 mr-2" />
              Cambiar Contraseña
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Selector de hijo si tiene varios */}
        {hijos.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tus hijos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {hijos.map((hijo) => (
                  <Button key={hijo.id} variant="outline">
                    {hijo.profiles?.nombre} {hijo.profiles?.apellidos}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {hijos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg font-semibold">No tienes hijos vinculados</p>
              <p className="text-sm text-gray-400 mt-2">Contacta a la escuela para vincular a tus hijos a tu cuenta</p>
            </CardContent>
          </Card>
        ) : (
          hijos.map((hijo) => {
            const pagosPendientes = hijo.pagos?.filter((p: any) => p.estado === 'pendiente') || []
            const totalPendiente = pagosPendientes.reduce((sum: number, p: any) => sum + parseFloat(p.monto || 0), 0)

            return (
              <div key={hijo.id} className="space-y-6 mb-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    {hijo.profiles?.nombre} {hijo.profiles?.apellidos}
                  </h2>
                  <Badge variant="outline" className="text-sm">
                    Matrícula: {hijo.matricula} • {hijo.grado} {hijo.grupo}
                  </Badge>
                </div>

                {/* Cards de resumen */}
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${totalPendiente.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {pagosPendientes.length} pago{pagosPendientes.length !== 1 ? 's' : ''} pendiente{pagosPendientes.length !== 1 ? 's' : ''}
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => router.push('/padre/calificaciones')}
                  >
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Calificaciones</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">Ver Boleta</div>
                      <p className="text-xs text-muted-foreground">Consultar calificaciones</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Pagos */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Estado de Cuenta</CardTitle>
                        <CardDescription>Pagos y adeudos</CardDescription>
                      </div>
                      <div className='flex justify-between'>
                        
                        <Button onClick={() => router.push('/padre/pagos')}> <CreditCard className="h-4 w-4 mr-2" />Ver Pagos</Button>
                      </div>
                      
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!hijo.pagos || hijo.pagos.length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No hay pagos registrados</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {hijo.pagos.slice(0, 5).map((pago: any) => (
                          <div
                            key={pago.id}
                            className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{pago.concepto_nombre || pago.concepto || 'Pago'}</p>
                              <p className="text-sm text-gray-500">
                                Vencimiento: {new Date(pago.fecha_vencimiento || pago.fecha_entrega || Date.now()).toLocaleDateString('es-MX')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg">
                                ${parseFloat(pago.monto || 0).toFixed(2)}
                              </span>
                              <Badge
                                variant={pago.estado === 'pagado' || pago.status === 'pagado' ? 'default' : 'destructive'}
                                className="capitalize"
                              >
                                {pago.estado || pago.status || 'pendiente'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )
          })
        )}
      </main>
    </div>
  )
}