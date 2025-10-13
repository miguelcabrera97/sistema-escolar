'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { stripePromise } from '@/lib/stripe-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CreditCard, CheckCircle, Clock } from 'lucide-react'

export default function PagosPadre() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pagos, setPagos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    cargarPagos()

    if (searchParams.get('success')) {
      alert('¡Pago realizado exitosamente!')
      window.history.replaceState({}, '', '/padre/pagos')
    }
    if (searchParams.get('canceled')) {
      alert('Pago cancelado')
      window.history.replaceState({}, '', '/padre/pagos')
    }
  }, [])

  const cargarPagos = async () => {
    const debug: any = {}
    
    try {
      // 1. Obtener usuario
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      debug.step1_user = { userId: user?.id, email: user?.email, error: userError }
      console.log('1. Usuario:', debug.step1_user)
      
      if (!user) {
        router.push('/login')
        return
      }

      // 2. Obtener padre
      const { data: padreData, error: padreError } = await supabase
        .from('padres')
        .select('id, user_id, hijos')
        .eq('user_id', user.id)
        .single()

      debug.step2_padre = { 
        padreId: padreData?.id, 
        userId: padreData?.user_id,
        hijos: padreData?.hijos,
        cantidadHijos: padreData?.hijos?.length || 0,
        error: padreError 
      }
      console.log('2. Padre:', debug.step2_padre)

      if (padreError) {
        console.error('Error obteniendo padre:', padreError)
        debug.errorFinal = 'Error en paso 2: ' + padreError.message
        setDebugInfo(debug)
        setLoading(false)
        return
      }

      if (!padreData) {
        console.log('No se encontró registro de padre')
        debug.errorFinal = 'No existe registro en tabla padres'
        setDebugInfo(debug)
        setLoading(false)
        return
      }

      // 3. Verificar hijos
      const hijosIds = padreData.hijos || []
      debug.step3_hijos = { hijosIds, cantidad: hijosIds.length }
      console.log('3. Hijos IDs:', debug.step3_hijos)

      if (hijosIds.length === 0) {
        console.log('No hay hijos asignados')
        debug.errorFinal = 'Array de hijos está vacío'
        setDebugInfo(debug)
        setLoading(false)
        return
      }

      // 4. Obtener pagos
      const { data: pagosData, error: pagosError } = await supabase
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
        .in('alumno_id', hijosIds)
        .order('fecha_vencimiento', { ascending: true })

      debug.step4_pagos = { 
        cantidad: pagosData?.length || 0,
        pagos: pagosData?.map(p => ({ 
          concepto: p.concepto, 
          monto: p.monto, 
          status: p.status 
        })),
        error: pagosError 
      }
      console.log('4. Pagos:', debug.step4_pagos)

      if (pagosError) {
        console.error('Error obteniendo pagos:', pagosError)
        debug.errorFinal = 'Error en paso 4: ' + pagosError.message
      }

      setDebugInfo(debug)
      setPagos(pagosData || [])
      
    } catch (error: any) {
      console.error('Error general:', error)
      debug.errorFinal = 'Error general: ' + error.message
      setDebugInfo(debug)
    } finally {
      setLoading(false)
    }
  }

  const handlePagar = async (pagoId: string) => {
  setProcesando(pagoId)
  try {
    const response = await fetch('/api/create-payment-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagoId })
    })

    const data = await response.json()

    if (data.error) {
      throw new Error(data.error)
    }

    // Redirigir directamente a la URL de Stripe
    if (data.url) {
      window.location.href = data.url
    } else {
      throw new Error('No se recibió URL de pago')
    }
  } catch (error: any) {
    console.error('Error:', error)
    alert('Error al procesar el pago: ' + error.message)
    setProcesando(null)
  }
}

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pagos...</p>
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Debug Info 
        {Object.keys(debugInfo).length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-sm">🔍 Debug Info</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}*/}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Pagos Escolares</h1>
            <p className="text-gray-600">Total de pagos encontrados: {pagos.length}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Pendiente</div>
            <div className="text-3xl font-bold text-red-600">
              ${totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pagos Pendientes</CardTitle>
            <CardDescription>
              {pagosPendientes.length === 0 
                ? 'No se encontraron pagos pendientes' 
                : `${pagosPendientes.length} pago(s) por realizar`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pagosPendientes.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-300" />
                <p className="text-gray-500">No hay pagos pendientes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pagosPendientes.map((pago) => {
                  const vencido = new Date(pago.fecha_vencimiento) < new Date()
                  return (
                    <div
                      key={pago.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        vencido ? 'bg-red-50 border-red-200' : 'bg-white'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{pago.concepto}</h3>
                          {vencido && <Badge variant="destructive">Vencido</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">
                          {pago.alumnos?.profiles?.nombre} {pago.alumnos?.profiles?.apellidos}
                        </p>
                        <p className="text-xs text-gray-500">
                          Vencimiento: {new Date(pago.fecha_vencimiento).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <Button
                          onClick={() => handlePagar(pago.id)}
                          disabled={procesando === pago.id}
                        >
                          {procesando === pago.id ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pagar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            {pagosPagados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay pagos en el historial</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pagosPagados.map((pago) => (
                  <div
                    key={pago.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <h3 className="font-semibold">{pago.concepto}</h3>
                        <p className="text-sm text-gray-600">
                          {pago.alumnos?.profiles?.nombre} {pago.alumnos?.profiles?.apellidos}
                        </p>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
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