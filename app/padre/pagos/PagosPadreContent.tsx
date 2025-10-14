'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Profile {
  nombre: string
  apellidos: string
}

interface Alumno {
  id: string
  matricula: string
  profiles: Profile
}

interface Pago {
  id: string
  concepto: string
  descripcion: string | null
  monto: number
  status: string
  fecha_vencimiento: string
  fecha_pago: string | null
  metodo_pago: string | null
  alumnos: Alumno
}

export default function PagosPadreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    cargarDatos()
    
    const success = searchParams.get('success')
    const pagoId = searchParams.get('pago_id')
    
    if (success === 'true' && pagoId) {
      verificarPago(pagoId)
    }
  }, [searchParams])

  const cargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: alumnosData } = await supabase
        .from('alumnos')
        .select('id, matricula, profiles(nombre, apellidos)')
        .eq('padre_id', user.id)

      if (alumnosData) {
        setAlumnos(alumnosData)

        const { data: pagosData } = await supabase
          .from('pagos')
          .select(`
            *,
            alumnos (
              id,
              matricula,
              profiles (
                nombre,
                apellidos
              )
            )
          `)
          .in('alumno_id', alumnosData.map(a => a.id))
          .order('fecha_vencimiento', { ascending: true })

        if (pagosData) {
          setPagos(pagosData)
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const verificarPago = async (pagoId: string) => {
    try {
      const { data } = await supabase
        .from('pagos')
        .select('status')
        .eq('id', pagoId)
        .single()

      if (data?.status === 'pagado') {
        alert('Pago procesado exitosamente')
      } else {
        alert('El pago está siendo procesado. Actualiza en unos momentos.')
      }
    } catch (error) {
      console.error('Error verificando pago:', error)
    }
  }

  const realizarPago = async (pagoId: string) => {
    setProcesando(true)
    try {
      const response = await fetch('/api/create-payment-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagoId })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Error al crear la sesión de pago')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar el pago')
    } finally {
      setProcesando(false)
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

  const pagosPendientes = pagos.filter(p => p.status === 'pendiente' || p.status === 'vencido')
  const pagosPagados = pagos.filter(p => p.status === 'pagado')
  const totalPendiente = pagosPendientes.reduce((sum, p) => sum + p.monto, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
              <p className="text-gray-600">Gestiona los pagos de tus hijos</p>
            </div>
            <Button variant="outline" onClick={() => {
              supabase.auth.signOut()
              router.push('/login')
            }}>
              Cerrar Sesion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">{pagosPendientes.length} pagos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Realizados</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{pagosPagados.length}</div>
              <p className="text-xs text-muted-foreground">Este periodo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alumnos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alumnos.length}</div>
              <p className="text-xs text-muted-foreground">Registrados</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pendientes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pendientes">Pagos Pendientes</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="pendientes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pagos Pendientes</CardTitle>
                <CardDescription>Realiza los pagos de tus hijos</CardDescription>
              </CardHeader>
              <CardContent>
                {pagosPendientes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p>No tienes pagos pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pagosPendientes.map((pago) => (
                      <div key={pago.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{pago.concepto}</h3>
                            <Badge variant={pago.status === 'vencido' ? 'destructive' : 'outline'}>
                              {pago.status === 'vencido' && <AlertCircle className="h-3 w-3 mr-1" />}
                              {pago.status === 'vencido' ? 'Vencido' : 'Pendiente'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {pago.alumnos.profiles.nombre} {pago.alumnos.profiles.apellidos} - {pago.alumnos.matricula}
                          </p>
                          <p className="text-xs text-gray-500">
                            Vence: {new Date(pago.fecha_vencimiento).toLocaleDateString('es-MX')}
                          </p>
                          {pago.descripcion && (
                            <p className="text-xs text-gray-500 mt-1">{pago.descripcion}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-500">MXN</div>
                          </div>
                          <Button 
                            onClick={() => realizarPago(pago.id)}
                            disabled={procesando}
                          >
                            {procesando ? 'Procesando...' : 'Pagar'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Pagos</CardTitle>
                <CardDescription>Pagos realizados anteriormente</CardDescription>
              </CardHeader>
              <CardContent>
                {pagosPagados.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No hay pagos en el historial</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pagosPagados.map((pago) => (
                      <div key={pago.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{pago.concepto}</h3>
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Pagado
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {pago.alumnos.profiles.nombre} {pago.alumnos.profiles.apellidos}
                          </p>
                          <p className="text-xs text-gray-500">
                            Pagado: {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleDateString('es-MX') : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Metodo: {pago.metodo_pago || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}