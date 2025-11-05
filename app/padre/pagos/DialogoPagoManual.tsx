'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileText, Info } from 'lucide-react'
import { registrarPagoManual } from '@/app/actions/pagos-actions'

interface Pago {
  id: string
  concepto_nombre: string
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

export function DialogoPagoManual({ pago, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [referencia, setReferencia] = useState('')
  const [comprobante, setComprobante] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!pago || !referencia.trim()) {
      alert('Por favor ingresa el número de referencia')
      return
    }

    setLoading(true)
    try {
      // Por ahora, solo enviamos la referencia sin el archivo
      // En producción, subirías el archivo a Supabase Storage primero
      const result = await registrarPagoManual(pago.id, referencia)

      if (result.success) {
        alert('¡Pago registrado!\n\nTu pago será verificado por la dirección de la escuela. Te notificaremos cuando sea aprobado.')
        onOpenChange(false)
        onSuccess()
        limpiarFormulario()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  const limpiarFormulario = () => {
    setReferencia('')
    setComprobante(null)
  }

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar que sea una imagen o PDF
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!tiposPermitidos.includes(file.type)) {
        alert('Solo se permiten archivos JPG, PNG o PDF')
        e.target.value = ''
        return
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe superar 5MB')
        e.target.value = ''
        return
      }

      setComprobante(file)
    }
  }

  if (!pago) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registrar Pago Manual
          </DialogTitle>
          <DialogDescription>
            Registra un pago realizado por transferencia, depósito u otro método
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información del pago */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Concepto:</span>
              <span className="text-sm font-medium">{pago.concepto_nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Alumno:</span>
              <span className="text-sm font-medium">
                {pago.alumnos?.profiles?.nombre || 'N/A'} {pago.alumnos?.profiles?.apellidos || ''}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-gray-600">Total pagado:</span>
              <span className="text-2xl font-bold text-green-600">
                ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Formulario */}
          <div>
            <Label>Número de Referencia / Folio *</Label>
            <Input
              type="text"
              placeholder="Ej: 123456789"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              required
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              Ingresa el número de referencia de la transferencia o depósito
            </p>
          </div>

          <div>
            <Label>Comprobante (opcional)</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              onChange={handleArchivoChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Sube una imagen o PDF del comprobante (máx. 5MB)
            </p>
          </div>

          {/* Información importante */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <p className="font-semibold mb-2">Información importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Tu pago será verificado por la dirección</li>
                <li>Recibirás una notificación cuando sea aprobado</li>
                <li>Guarda tu comprobante de pago</li>
                <li>La verificación puede tardar 1-2 días hábiles</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                limpiarFormulario()
              }}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !referencia.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Pago'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
