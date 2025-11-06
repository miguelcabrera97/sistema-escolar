'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Eye, Ban, Download } from 'lucide-react'
import { verificarPagoManual, cancelarPago, obtenerDatosPagoParaRecibo } from '@/app/actions/pagos-actions'
import { DialogoDetallePago } from './DialogoDetallePago'
import { descargarReciboPDF } from '@/lib/recibo-pdf'

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

interface Props {
  pagos: Pago[]
  onSuccess: () => void
}

export function TablaPagos({ pagos, onSuccess }: Props) {
  const [procesando, setProcesando] = useState<string | null>(null)
  const [pagoDetalle, setPagoDetalle] = useState<Pago | null>(null)
  const [dialogoDetalleAbierto, setDialogoDetalleAbierto] = useState(false)

  const handleVerDetalle = (pago: Pago) => {
    setPagoDetalle(pago)
    setDialogoDetalleAbierto(true)
  }

  const handleVerificarPago = async (pagoId: string, aprobar: boolean) => {
    const mensaje = aprobar
      ? '¿Confirmar que el pago es válido?'
      : '¿Rechazar este pago? El padre deberá registrarlo nuevamente.'

    if (!confirm(mensaje)) return

    setProcesando(pagoId)
    try {
      const result = await verificarPagoManual(pagoId, aprobar)
      if (result.success) {
        alert(result.data.message)
        onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar la solicitud')
    } finally {
      setProcesando(null)
    }
  }

  const handleCancelarPago = async (pagoId: string) => {
    if (!confirm('¿Cancelar este pago? Esta acción no se puede deshacer.')) return

    setProcesando(pagoId)
    try {
      const result = await cancelarPago(pagoId)
      if (result.success) {
        alert(result.data.message)
        onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cancelar el pago')
    } finally {
      setProcesando(null)
    }
  }

  const handleDescargarRecibo = async (pagoId: string) => {
    try {
      const result = await obtenerDatosPagoParaRecibo(pagoId)

      if (result.success && result.data) {
        descargarReciboPDF(result.data)
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al generar el recibo')
    }
  }

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

  if (pagos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No hay pagos en esta categoría</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Padre/Alumno</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Método</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagos.map((pago) => (
              <TableRow key={pago.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">
                      {pago.padres?.profiles?.nombre || 'N/A'} {pago.padres?.profiles?.apellidos || ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      {pago.alumnos?.profiles?.nombre || 'N/A'} {pago.alumnos?.profiles?.apellidos || ''}
                    </p>
                    {pago.alumnos && (
                      <p className="text-xs text-gray-400">
                        {pago.alumnos.matricula} • {pago.alumnos.grado}° {pago.alumnos.grupo}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{pago.concepto_nombre}</p>
                    {pago.descripcion && (
                      <p className="text-xs text-gray-500 line-clamp-1">
                        {pago.descripcion}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-green-600">
                    ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(pago.fecha_vencimiento).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(pago.estado)}>
                    {getEstadoTexto(pago.estado)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {pago.metodo_pago ? (
                    <span className="text-sm">
                      {pago.metodo_pago === 'mercadopago' ? 'Mercado Pago' : 'Manual'}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVerDetalle(pago)}
                      title="Ver detalle"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {pago.estado === 'pagado' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDescargarRecibo(pago.id)}
                        title="Descargar recibo"
                      >
                        <Download className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}

                    {pago.estado === 'pagado' && pago.metodo_pago === 'manual' && !pago.pagado_verificado_por && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerificarPago(pago.id, true)}
                          disabled={procesando === pago.id}
                          title="Aprobar pago"
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerificarPago(pago.id, false)}
                          disabled={procesando === pago.id}
                          title="Rechazar pago"
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                        </Button>
                      </>
                    )}

                    {(pago.estado === 'pendiente' || pago.estado === 'vencido') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelarPago(pago.id)}
                        disabled={procesando === pago.id}
                        title="Cancelar pago"
                      >
                        <Ban className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DialogoDetallePago
        pago={pagoDetalle}
        open={dialogoDetalleAbierto}
        onOpenChange={setDialogoDetalleAbierto}
        onSuccess={onSuccess}
      />
    </>
  )
}
