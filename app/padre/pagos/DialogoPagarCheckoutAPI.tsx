'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { crearPagoCheckoutAPI } from '@/app/actions/pagos-actions'
import Script from 'next/script'

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

declare global {
  interface Window {
    MercadoPago: any
  }
}

export function DialogoPagarCheckoutAPI({ pago, open, onOpenChange, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [mpLoaded, setMpLoaded] = useState(false)
  const [mp, setMp] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Datos del formulario
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expirationDate: '',
    securityCode: '',
    email: '',
    identificationType: 'RFC',
    identificationNumber: '',
    installments: 1
  })

  // Inicializar Mercado Pago SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && window.MercadoPago && !mp) {
      const mercadoPago = new window.MercadoPago(
        process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
        { locale: 'es-MX' }
      )
      setMp(mercadoPago)
      setMpLoaded(true)
    }
  }, [mp])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pago || !mp) return

    setLoading(true)
    setError(null)

    try {
      // Validaciones básicas
      if (!formData.cardNumber || !formData.cardholderName || !formData.expirationDate ||
          !formData.securityCode || !formData.email || !formData.identificationNumber) {
        setError('Por favor completa todos los campos')
        setLoading(false)
        return
      }

      // Separar mes y año de la fecha de expiración
      const [month, year] = formData.expirationDate.split('/')
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        setError('Formato de fecha inválido (MM/YY)')
        setLoading(false)
        return
      }

      // Crear el token de la tarjeta
      const cardData = {
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        cardholderName: formData.cardholderName,
        cardExpirationMonth: month,
        cardExpirationYear: `20${year}`,
        securityCode: formData.securityCode,
        identificationType: formData.identificationType,
        identificationNumber: formData.identificationNumber
      }

      // Obtener el payment method id
      const bin = cardData.cardNumber.substring(0, 6)
      const paymentMethods = await mp.getPaymentMethods({ bin })

      if (!paymentMethods.results || paymentMethods.results.length === 0) {
        setError('No se pudo identificar el método de pago')
        setLoading(false)
        return
      }

      const paymentMethodId = paymentMethods.results[0].id

      // Crear el token
      const tokenResponse = await mp.createCardToken(cardData)

      if (tokenResponse.error) {
        setError(tokenResponse.error.message || 'Error al procesar la tarjeta')
        setLoading(false)
        return
      }

      // Llamar al servidor para procesar el pago
      const result = await crearPagoCheckoutAPI(pago.id, {
        token: tokenResponse.id,
        paymentMethodId: paymentMethodId,
        issuerId: paymentMethods.results[0].issuer?.id,
        installments: formData.installments,
        email: formData.email,
        identificationType: formData.identificationType,
        identificationNumber: formData.identificationNumber
      })

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
          onOpenChange(false)
          // Reset form
          setFormData({
            cardNumber: '',
            cardholderName: '',
            expirationDate: '',
            securityCode: '',
            email: '',
            identificationType: 'RFC',
            identificationNumber: '',
            installments: 1
          })
          setSuccess(false)
        }, 2000)
      } else {
        setError(result.error || 'Error al procesar el pago')
      }
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'Error inesperado al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  if (!pago) return null

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        onLoad={() => {
          if (window.MercadoPago && !mp) {
            const mercadoPago = new window.MercadoPago(
              process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
              { locale: 'es-MX' }
            )
            setMp(mercadoPago)
            setMpLoaded(true)
          }
        }}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pagar con Tarjeta
            </DialogTitle>
            <DialogDescription>
              Completa los datos de tu tarjeta para realizar el pago de forma segura
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 text-green-700 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>¡Pago procesado exitosamente!</AlertDescription>
              </Alert>
            )}

            {/* Formulario de tarjeta */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Número de tarjeta</Label>
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  disabled={loading || success || !mpLoaded}
                  required
                />
              </div>

              <div>
                <Label htmlFor="cardholderName">Nombre del titular</Label>
                <Input
                  id="cardholderName"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  placeholder="Como aparece en la tarjeta"
                  disabled={loading || success || !mpLoaded}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expirationDate">Vencimiento</Label>
                  <Input
                    id="expirationDate"
                    name="expirationDate"
                    value={formData.expirationDate}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    maxLength={5}
                    disabled={loading || success || !mpLoaded}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="securityCode">CVV</Label>
                  <Input
                    id="securityCode"
                    name="securityCode"
                    type="password"
                    value={formData.securityCode}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength={4}
                    disabled={loading || success || !mpLoaded}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu-email@ejemplo.com"
                  disabled={loading || success || !mpLoaded}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="identificationType">Tipo de documento</Label>
                  <select
                    id="identificationType"
                    name="identificationType"
                    value={formData.identificationType}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={loading || success || !mpLoaded}
                    required
                  >
                    <option value="RFC">RFC</option>
                    <option value="CURP">CURP</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="identificationNumber">Número</Label>
                  <Input
                    id="identificationNumber"
                    name="identificationNumber"
                    value={formData.identificationNumber}
                    onChange={handleInputChange}
                    placeholder="RFC/CURP"
                    disabled={loading || success || !mpLoaded}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading || success}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || success || !mpLoaded}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    ¡Pagado!
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagar ${pago.monto.toFixed(2)}
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              Tus datos están protegidos por Mercado Pago
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
