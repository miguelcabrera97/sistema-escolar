'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, ExternalLink, Info } from 'lucide-react'
import { crearPreferenciaMercadoPago } from '@/app/actions/pagos-actions'

interface Pago {
  id: string
  concepto: string
  descripcion: string | null
  monto: number
  alumnos: {
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
  onSuccess: () => void
}

export function DialogoPagarMercadoPago({ pago, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)

  const handlePagar = async () => {
    if (!pago) return

    setLoading(true)
    try {
      const result = await crearPreferenciaMercadoPago(pago.id)

      if (result.success && result.data.init_point) {
        // Redirigir a Mercado Pago
        window.location.href = result.data.init_point
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  if (!pago) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagar con Mercado Pago
          </DialogTitle>
          <DialogDescription>
            Serás redirigido a Mercado Pago para completar el pago de forma segura
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Información del pago */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Concepto:</span>
              <span className="text-sm font-medium">{pago.concepto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Alumno:</span>
              <span className="text-sm font-medium">
                {pago.alumnos?.profiles?.nombre || 'N/A'} {pago.alumnos?.profiles?.apellidos || ''}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-gray-600">Total a pagar:</span>
              <span className="text-2xl font-bold text-green-600">
                ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Información sobre Mercado Pago */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Paga de forma segura con Mercado Pago</li>
                <li>Acepta tarjetas de crédito y débito</li>
                <li>El pago se registra automáticamente</li>
                <li>Recibirás un comprobante por email</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePagar}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ir a Mercado Pago
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Al continuar, aceptas los términos y condiciones de Mercado Pago
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
