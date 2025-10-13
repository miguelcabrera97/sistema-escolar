'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, FileText, User, LogOut } from 'lucide-react'
import { CreditCard } from 'lucide-react'

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
      const { data: padreData } = await supabase
        .from('padres')
        .select('*, profiles(*)')
        .eq('user_id', user.id)
        .single()

      setPadre(padreData)

      // Obtener hijos vinculados
      const { data: hijosData } = await supabase
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
            ),
            pagos (
              id,
              concepto,
              monto,
              status,
              fecha_vencimiento
            )
          )
        `)
        .eq('padre_id', padreData?.id)

      // Transformar datos para acceso más fácil
      const hijosFormateados = hijosData?.map((item: any) => ({
        ...item.alumnos,
        parentesco: item.parentesco
      })) || []

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
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
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
            const pagosPendientes = hijo.pagos?.filter((p: any) => p.status === 'pendiente') || []
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
                <div className="grid gap-6 md:grid-cols-3">
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

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Promedio</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">8.5</div>
                      <p className="text-xs text-muted-foreground">Último periodo</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Asistencias</CardTitle>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">95%</div>
                      <p className="text-xs text-muted-foreground">Este mes</p>
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
                        <Button>Realizar Pago</Button>
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
                              <p className="font-medium">{pago.concepto}</p>
                              <p className="text-sm text-gray-500">
                                Vencimiento: {new Date(pago.fecha_vencimiento).toLocaleDateString('es-MX')}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg">
                                ${parseFloat(pago.monto).toFixed(2)}
                              </span>
                              <Badge 
                                variant={pago.status === 'pagado' ? 'default' : 'destructive'}
                                className="capitalize"
                              >
                                {pago.status}
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