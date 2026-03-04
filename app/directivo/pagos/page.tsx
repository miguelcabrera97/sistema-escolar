'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { obtenerPagosDirectivo } from '@/app/actions/pagos-actions'
import { migrarPadresExistentes, obtenerEstadisticasMigracion } from '@/app/actions/migrar-padres-actions'
import { ArrowLeft, DollarSign, Plus, CheckCircle, Clock, XCircle, Users } from 'lucide-react'
import { DialogoCrearPago } from './DialogoCrearPago'
import { TablaPagos } from './TablaPagos'

interface Pago {
  id: string
  concepto_nombre: string
  descripcion: string | null
  monto: number
  estado: string
  fecha_vencimiento: string
  created_at: string
  fecha_pago: string | null
  metodo_pago: string | null
  referencia_pago: string | null
  comprobante_url: string | null
  pagado_verificado_por: string | null
  padres: {
    id: string
    profiles: {
      nombre: string
      apellidos: string
      email: string
    }
  } | null
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

export default function DirectivoPagos() {
  const router = useRouter()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogoCrearAbierto, setDialogoCrearAbierto] = useState(false)
  const [tabActivo, setTabActivo] = useState('todos')
  const [necesitaMigracion, setNecesitaMigracion] = useState(false)
  const [migrandoPadres, setMigrandoPadres] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success', texto: string } | null>(null)

  useEffect(() => {
    cargarPagos()
    verificarMigracion()
  }, [])

  const mostrarMensaje = (tipo: 'error' | 'success', texto: string) => {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 5000)
  }

  const cargarPagos = async () => {
    setLoading(true)
    try {
      const result = await obtenerPagosDirectivo()
      if (result.success) {
        setPagos(result.data || [])
      } else {
        mostrarMensaje('error', 'Error al cargar pagos: ' + result.error)
        if (result.error === 'No autorizado') {
          router.push('/login')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      mostrarMensaje('error', 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const verificarMigracion = async () => {
    try {
      const result = await obtenerEstadisticasMigracion()
      if (result.success && result.data) {
        setNecesitaMigracion(result.data.necesitaMigracion)
      }
    } catch (error) {
      console.error('Error al verificar migración:', error)
    }
  }

  const ejecutarMigracion = async () => {
    if (!confirm('¿Deseas migrar los usuarios padre a la tabla de padres?\n\nEsto creará registros en la tabla padres para todos los usuarios con rol padre.')) {
      return
    }

    setMigrandoPadres(true)
    try {
      const result = await migrarPadresExistentes()
      if (result.success && result.data) {
        mostrarMensaje('success',
          `✅ Migración completada\n\n` +
          `Total de usuarios padre: ${result.data.total}\n` +
          `Migrados: ${result.data.migrados}\n\n` +
          `${result.data.message}`
        )
        setNecesitaMigracion(false)
      } else if (!result.success) {
        mostrarMensaje('error', 'Error en la migración: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      mostrarMensaje('error', 'Error al ejecutar la migración')
    } finally {
      setMigrandoPadres(false)
    }
  }

  const handleSuccess = () => {
    cargarPagos()
  }

  // Filtrar pagos según el tab activo
  const pagosFiltrados = pagos.filter(pago => {
    if (tabActivo === 'todos') return true
    if (tabActivo === 'pendientes') return pago.estado === 'pendiente'
    if (tabActivo === 'pagados') return pago.estado === 'pagado'
    if (tabActivo === 'vencidos') return pago.estado === 'vencido'
    return true
  })

  // Estadísticas
  const estadisticas = {
    total: pagos.length,
    pendientes: pagos.filter(p => p.estado === 'pendiente').length,
    pagados: pagos.filter(p => p.estado === 'pagado').length,
    vencidos: pagos.filter(p => p.estado === 'vencido').length,
    montoTotal: pagos.reduce((sum, p) => sum + p.monto, 0),
    montoPendiente: pagos.filter(p => p.estado === 'pendiente' || p.estado === 'vencido')
      .reduce((sum, p) => sum + p.monto, 0),
    montoCobrado: pagos.filter(p => p.estado === 'pagado')
      .reduce((sum, p) => sum + p.monto, 0),
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
      {mensaje && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg max-w-md ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-800 border-l-4 border-green-500' : 'bg-red-100 text-red-800 border-l-4 border-red-500'}`}>
          <div className="flex justify-between items-start">
            <p className="whitespace-pre-line text-sm">{mensaje.texto}</p>
            <button onClick={() => setMensaje(null)} className="ml-4 text-gray-500 hover:text-gray-700">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/directivo')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
                <p className="text-sm text-gray-600">Administra los cobros y pagos de los padres</p>
              </div>
            </div>
            <div className="flex gap-2">
              {necesitaMigracion && (
                <Button
                  variant="secondary"
                  onClick={ejecutarMigracion}
                  disabled={migrandoPadres}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {migrandoPadres ? 'Migrando...' : 'Migrar Padres'}
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push('/directivo/pagos/masivos')}>
                <Plus className="h-4 w-4 mr-2" />
                Pagos Masivos
              </Button>
              <Button onClick={() => setDialogoCrearAbierto(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Pago
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pagos</p>
                  <p className="text-2xl font-bold">{estadisticas.total}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ${estadisticas.montoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ${estadisticas.montoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pagados</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.pagados}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ${estadisticas.montoCobrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vencidos</p>
                  <p className="text-2xl font-bold text-red-600">{estadisticas.vencidos}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Requieren atención inmediata
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de pagos con tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Listado de Pagos
            </CardTitle>
            <CardDescription>
              Todos los pagos creados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tabActivo} onValueChange={setTabActivo}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="todos">
                  Todos ({estadisticas.total})
                </TabsTrigger>
                <TabsTrigger value="pendientes">
                  Pendientes ({estadisticas.pendientes})
                </TabsTrigger>
                <TabsTrigger value="pagados">
                  Pagados ({estadisticas.pagados})
                </TabsTrigger>
                <TabsTrigger value="vencidos">
                  Vencidos ({estadisticas.vencidos})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={tabActivo} className="mt-6">
                <TablaPagos
                  pagos={pagosFiltrados}
                  onSuccess={handleSuccess}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Diálogo crear pago */}
      {dialogoCrearAbierto && (
        <DialogoCrearPago
          open={dialogoCrearAbierto}
          onOpenChange={setDialogoCrearAbierto}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
