'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, DollarSign, User, CreditCard, FileText, CheckCircle, ExternalLink, Check, XIcon, Clock } from 'lucide-react'
import { verificarPagoManual } from '@/app/actions/pagos-actions'

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
  pago: Pago | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DialogoDetallePago({ pago, open, onOpenChange, onSuccess }: Props) {
  const [aprobando, setAprobando] = useState(false)

  if (!pago) return null

  const handleAprobarPago = async () => {
    const isTransferencia = pago.estado === 'pendiente_verificacion';
    const msg = isTransferencia 
      ? '¿Confirmar la aprobación de esta transferencia?'
      : '¿Confirmar que este pago fue realizado en ventanilla?';
      
    if (!confirm(msg)) return

    setAprobando(true)
    try {
      const result = await verificarPagoManual(pago.id, true)
      if (result.success) {
        alert('Pago aprobado exitosamente')
        onOpenChange(false)
        if (onSuccess) onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al aprobar el pago')
    } finally {
      setAprobando(false)
    }
  }

  const getBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'default'
      case 'pendiente': return 'outline'
      case 'vencido': return 'destructive'
      case 'cancelado': return 'secondary'
      case 'pendiente_verificacion': return 'secondary'
      default: return 'outline'
    }
  }

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'pagado': return 'Pagado'
      case 'pendiente': return 'Pendiente'
      case 'vencido': return 'Vencido'
      case 'cancelado': return 'Cancelado'
      case 'pendiente_verificacion': return 'En Verificación'
      default: return estado
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 opacity-70 hover:opacity-100"
        >
          <XIcon className="h-4 w-4" />
        </button>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalle del Pago</span>
            <Badge variant={getBadgeVariant(pago.estado)}>
              {getEstadoTexto(pago.estado)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Información completa del cobro
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Monto */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">Monto</span>
            </div>
            <p className="text-4xl font-bold text-green-600">
              ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-green-700 mt-1">MXN</p>
          </div>

          {/* Concepto */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Concepto</span>
            </div>
            <p className="text-lg font-semibold">{pago.concepto_nombre}</p>
            {pago.descripcion && (
              <p className="text-sm text-gray-600 mt-2">{pago.descripcion}</p>
            )}
          </div>

          {/* Información del padre y alumno */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Padre</span>
              </div>
              <p className="font-medium">
                {pago.padres?.profiles?.nombre || 'N/A'} {pago.padres?.profiles?.apellidos || ''}
              </p>
              <p className="text-sm text-gray-600">{pago.padres?.profiles?.email || 'N/A'}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Alumno</span>
              </div>
              <p className="font-medium">
                {pago.alumnos?.profiles?.nombre || 'N/A'} {pago.alumnos?.profiles?.apellidos || ''}
              </p>
              {pago.alumnos && (
                <p className="text-sm text-gray-600">
                  {pago.alumnos.matricula} • {pago.alumnos.grado}° {pago.alumnos.grupo}
                </p>
              )}
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Fecha de Creación</span>
              </div>
              <p className="text-sm">
                {new Date(pago.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Fecha de Vencimiento</span>
              </div>
              <p className="text-sm">
                {new Date(pago.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Información de pago (si está pagado o en verificación) */}
          {(pago.estado === 'pagado' || pago.estado === 'pendiente_verificacion') && (
            <div className={`p-4 rounded-lg border ${pago.estado === 'pagado' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {pago.estado === 'pagado' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <span className={`text-sm font-semibold ${pago.estado === 'pagado' ? 'text-green-900' : 'text-yellow-900'}`}>
                  {pago.estado === 'pagado' ? 'Información del Pago' : 'Información del Comprobante (En Verificación)'}
                </span>
              </div>

              <div className="space-y-2">
                {pago.fecha_pago && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fecha de pago:</span>
                    <span className="font-medium">
                      {new Date(pago.fecha_pago).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Método de pago:</span>
                  <span className="font-medium">
                    {pago.metodo_pago === 'mercadopago' ? 'Mercado Pago' : 'Manual / Transferencia'}
                  </span>
                </div>

                {pago.referencia_pago && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Referencia / Cuenta:</span>
                    <span className="font-medium font-mono whitespace-pre-wrap text-right max-w-xs">{pago.referencia_pago}</span>
                  </div>
                )}

                {pago.comprobante_url && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(pago.comprobante_url!, '_blank')}
                      className="w-full bg-white hover:bg-gray-50"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Comprobante Subido por Padre
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            {/* Aquí aprobamos los de ventanilla también en estado pendiente o vencido */}
            {(pago.estado === 'pendiente' || pago.estado === 'vencido') && (
              <Button
                onClick={handleAprobarPago}
                disabled={aprobando}
                className="bg-green-600 hover:bg-green-700 mx-2"
              >
                <Check className="h-4 w-4 mr-2" />
                {aprobando ? 'Aprobando...' : 'Aprobar Pago en Ventanilla'}
              </Button>
            )}

            {/* Aquí aprobamos los de transferencia que están pendientes de verificación */}
            {pago.estado === 'pendiente_verificacion' && (
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    handleAprobarPago()
                  }}
                  disabled={aprobando}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {aprobando ? 'Aprobando...' : 'Aprobar Transferencia'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                     if(!confirm('¿Estás seguro de RECHAZAR y retornar este pago por transferencia a estado pendiente?')) return;
                     try {
                        const result = await verificarPagoManual(pago.id, false)
                        if (result.success) {
                          alert('Pago rechazado correctamente.')
                          onOpenChange(false)
                          if (onSuccess) onSuccess()
                        } else {
                          alert('Error: ' + result.error)
                        }
                     } catch(e) {
                         alert('Hubo un error al rechazar')
                     }
                  }}
                  disabled={aprobando}
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Rechazar Transferencia
                </Button>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
