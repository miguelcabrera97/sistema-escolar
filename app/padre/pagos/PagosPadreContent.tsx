'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, CheckCircle, Clock, AlertCircle, CreditCard, FileText, ArrowLeft, Download } from 'lucide-react'
import { obtenerPagosPadre, obtenerDatosPagoParaRecibo } from '@/app/actions/pagos-actions'
import { DialogoPagarCheckoutAPI } from './DialogoPagarCheckoutAPI'
import { DialogoPagoManual } from './DialogoPagoManual'
import { descargarReciboPDF } from '@/lib/recibo-pdf'

interface Pago {
  id: string
  concepto: string
  descripcion: string | null
  monto: number
  estado: string
  fecha_vencimiento: string
  created_at: string
  fecha_pago: string | null
  metodo_pago: string | null
  referencia_pago: string | null
  comprobante_url: string | null
  alumnos: {
    id: string
    matricula: string
    grado: string
    grupo: string
    profiles: {
      nombre: string
      apellidos: string
    }
  } | null
}

export default function PagosPadreContent() {
  const router = useRouter()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null)
  const [dialogoMercadoPagoAbierto, setDialogoMercadoPagoAbierto] = useState(false)
  const [dialogoPagoManualAbierto, setDialogoPagoManualAbierto] = useState(false)

  useEffect(() => {
    cargarPagos()
  }, [])

  const cargarPagos = async () => {
    setLoading(true)
    try {
      const result = await obtenerPagosPadre()
      if (result.success) {
        setPagos(result.data || [])
      } else {
        alert('Error al cargar pagos: ' + result.error)
        if (result.error === 'No autenticado') {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handlePagarMercadoPago = (pago: Pago) => {
    setPagoSeleccionado(pago)
    setDialogoMercadoPagoAbierto(true)
  }

  const handlePagoManual = (pago: Pago) => {
    setPagoSeleccionado(pago)
    setDialogoPagoManualAbierto(true)
  }

  const handleSuccess = () => {
    cargarPagos()
  }

  const handleDescargarRecibo = async (pagoId: string) => {
    try {
      const result = await obtenerDatosPagoParaRecibo(pagoId)

      if (result.success && result.data) {
        await descargarReciboPDF(result.data)
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al generar el recibo')
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

  const pagosPendientes = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'vencido')
  const pagosPagados = pagos.filter(p => p.estado === 'pagado')
  const totalPendiente = pagosPendientes.reduce((sum, p) => sum + p.monto, 0)
  const totalPagado = pagosPagados.reduce((sum, p) => sum + p.monto, 0)

  // Obtener alumnos únicos
  const alumnosUnicos = Array.from(
    new Map(
      pagos
        .filter(p => p.alumnos !== null)
        .map(p => [p.alumnos!.id, p.alumnos!])
    ).values()
  )

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'default'
      case 'pendiente': return 'outline'
      case 'vencido': return 'destructive'
      case 'cancelado': return 'secondary'
      default: return 'outline'
    }
  }

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'Pagado'
      case 'pendiente': return 'Pendiente'
      case 'vencido': return 'Vencido'
      case 'cancelado': return 'Cancelado'
      default: return estado
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/padre')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Pagos</h1>
                <p className="text-sm text-gray-600">Administra los pagos de tus hijos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pendiente</p>
                  <p className="text-2xl font-bold text-red-600">
                    ${totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {pagosPendientes.length} pago{pagosPendientes.length !== 1 ? 's' : ''} pendiente{pagosPendientes.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pagado</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {pagosPagados.length} pago{pagosPagados.length !== 1 ? 's' : ''} realizado{pagosPagados.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mis Hijos</p>
                  <p className="text-2xl font-bold">{alumnosUnicos.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {alumnosUnicos.map((a, i) => (
                  <span key={a.id}>
                    {a.profiles.nombre}
                    {i < alumnosUnicos.length - 1 && ', '}
                  </span>
                ))}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de pagos */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Pagos</CardTitle>
            <CardDescription>
              Gestiona los pagos escolares de tus hijos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pendientes">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pendientes">
                  Pendientes ({pagosPendientes.length})
                </TabsTrigger>
                <TabsTrigger value="historial">
                  Historial ({pagosPagados.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pendientes" className="mt-6">
                {pagosPendientes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="text-lg font-semibold">¡Todo al día!</p>
                    <p className="text-sm mt-2">No tienes pagos pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pagosPendientes.map((pago) => (
                      <div
                        key={pago.id}
                        className={`p-6 border-2 rounded-lg ${pago.estado === 'vencido'
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-white'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold">{pago.concepto}</h3>
                              <Badge variant={getBadgeVariant(pago.estado)}>
                                {pago.estado === 'vencido' && <AlertCircle className="h-3 w-3 mr-1" />}
                                {getEstadoTexto(pago.estado)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {pago.alumnos?.profiles?.nombre || 'N/A'} {pago.alumnos?.profiles?.apellidos || ''}
                            </p>
                            {pago.alumnos && (
                              <p className="text-xs text-gray-500">
                                {pago.alumnos.matricula} • {pago.alumnos.grado}° {pago.alumnos.grupo}
                              </p>
                            )}
                            {pago.descripcion && (
                              <p className="text-sm text-gray-600 mt-2">{pago.descripcion}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-green-600">
                              ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500">MXN</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-gray-600">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Vence: {new Date(pago.fecha_vencimiento).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handlePagoManual(pago)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Pago Manual
                            </Button>
                            <Button
                              onClick={() => handlePagarMercadoPago(pago)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pagar con Mercado Pago
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="historial" className="mt-6">
                {pagosPagados.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay pagos en el historial</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pagosPagados.map((pago) => (
                      <div key={pago.id} className="p-6 border rounded-lg bg-green-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold">{pago.concepto}</h3>
                              <Badge variant="default">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Pagado
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {pago.alumnos?.profiles?.nombre || 'N/A'} {pago.alumnos?.profiles?.apellidos || ''}
                            </p>
                            {pago.alumnos && (
                              <p className="text-xs text-gray-500">
                                {pago.alumnos.matricula} • {pago.alumnos.grado}° {pago.alumnos.grupo}
                              </p>
                            )}
                            <div className="mt-3 text-xs text-gray-600">
                              <p>
                                Pagado: {pago.fecha_pago && new Date(pago.fecha_pago).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                              <p>
                                Método: {pago.metodo_pago === 'mercadopago' ? 'Mercado Pago' : 'Manual'}
                              </p>
                              {pago.referencia_pago && (
                                <p className="font-mono">Ref: {pago.referencia_pago}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-3">
                            <div>
                              <p className="text-3xl font-bold text-green-600">
                                ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-gray-500">MXN</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDescargarRecibo(pago.id)}
                              className="w-full"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Descargar Recibo
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Diálogos */}
      <DialogoPagarCheckoutAPI
        pago={pagoSeleccionado}
        open={dialogoMercadoPagoAbierto}
        onOpenChange={setDialogoMercadoPagoAbierto}
        onSuccess={handleSuccess}
      />

      <DialogoPagoManual
        pago={pagoSeleccionado}
        open={dialogoPagoManualAbierto}
        onOpenChange={setDialogoPagoManualAbierto}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
