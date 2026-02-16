'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Printer, CreditCard } from 'lucide-react'
import { obtenerPadresConAlumnos } from '@/app/actions/pagos-actions'
import { supabase } from '@/lib/supabase'
import { BuscadorPadres } from './BuscadorPadres'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Padre {
  id: string
  profiles: {
    nombre: string
    apellidos: string
    email: string
  }
  padre_alumno: Array<{
    alumno_id: string
    alumnos: {
      id: string
      matricula: string
      grado: string
      grupo: string
      profiles: {
        nombre: string
        apellidos: string
      }
    }
  }>
}

interface ReciboData {
  folio: string
  fecha: string
  alumno: any
  padre: any
  concepto: string
  monto: number
  descripcion: string
}

export function DialogoCrearPago({ open, onOpenChange, onSuccess }: Props) {
  const [padres, setPadres] = useState<Padre[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tabActivo, setTabActivo] = useState('pago')
  const [reciboGenerado, setReciboGenerado] = useState<ReciboData | null>(null)
  const reciboRef = useRef<HTMLDivElement>(null)

  const [conceptoId, setConceptoId] = useState('')
  const [conceptoNombre, setConceptoNombre] = useState('')
  const [padreId, setPadreId] = useState('')
  const [alumnoId, setAlumnoId] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')

  useEffect(() => {
    if (open) {
      cargarDatos()
    } else {
      limpiarFormulario()
    }
  }, [open])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const padresResult = await obtenerPadresConAlumnos()

      if (padresResult.success) {
        setPadres(padresResult.data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const limpiarFormulario = () => {
    setConceptoId('')
    setConceptoNombre('')
    setPadreId('')
    setAlumnoId('')
    setMonto('')
    setDescripcion('')
    setFechaVencimiento('')
    setTabActivo('pago')
    setReciboGenerado(null)
  }

  const handlePadreChange = (padreId: string) => {
    setPadreId(padreId)
    setAlumnoId('') // Reset alumno cuando cambia el padre
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!conceptoNombre || !padreId || !alumnoId || !monto || !fechaVencimiento) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      // Crear el pago directamente sin concepto_id, usando el nombre del concepto
      await supabase.from('pagos').insert({
        alumno_id: alumnoId,
        padre_id: padreId,
        concepto: conceptoNombre,
        monto: parseFloat(monto),
        descripcion: descripcion || null,
        estado: 'pendiente',
        fecha_vencimiento: fechaVencimiento,
        metodo_pago: 'en_linea'
      })

      alert('Pago creado exitosamente')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear el pago')
    } finally {
      setSubmitting(false)
    }
  }

  const generarFolio = () => {
    const fecha = new Date()
    const año = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    const hora = String(fecha.getHours()).padStart(2, '0')
    const minutos = String(fecha.getMinutes()).padStart(2, '0')
    const segundos = String(fecha.getSeconds()).padStart(2, '0')
    return `REC-${año}${mes}${dia}-${hora}${minutos}${segundos}`
  }

  const handleGenerarRecibo = async () => {
    if (!conceptoNombre || !padreId || !alumnoId || !monto) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      const padre = padres.find(p => p.id === padreId)
      const alumnoRel = padre?.padre_alumno.find(rel => rel.alumno_id === alumnoId)

      if (!padre || !alumnoRel) {
        alert('Error al obtener los datos')
        return
      }

      const recibo: ReciboData = {
        folio: generarFolio(),
        fecha: new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        alumno: alumnoRel.alumnos,
        padre: padre,
        concepto: conceptoNombre,
        monto: parseFloat(monto),
        descripcion: descripcion || ''
      }

      // Registrar el recibo en la base de datos como pago pendiente
      await supabase.from('pagos').insert({
        alumno_id: alumnoId,
        padre_id: padreId,
        concepto: conceptoNombre,
        monto: parseFloat(monto),
        descripcion: descripcion || null,
        estado: 'pendiente',
        fecha_vencimiento: fechaVencimiento || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        metodo_pago: 'ventanilla',
        referencia_pago: recibo.folio
      })

      setReciboGenerado(recibo)
      onSuccess()
    } catch (error) {
      console.error('Error al generar recibo:', error)
      alert('Error al generar el recibo')
    } finally {
      setSubmitting(false)
    }
  }

  const imprimirRecibo = () => {
    if (reciboRef.current) {
      const ventanaImpresion = window.open('', '_blank')
      if (ventanaImpresion) {
        ventanaImpresion.document.write(`
          <html>
            <head>
              <title>Recibo de Pago - ${reciboGenerado?.folio}</title>
              <style>
                @media print {
                  @page { margin: 1cm; }
                  body { margin: 0; }
                }
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                  max-width: 800px;
                  margin: 0 auto;
                }
                .header {
                  text-align: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 20px;
                  margin-bottom: 20px;
                }
                .logo {
                  font-size: 24px;
                  font-weight: bold;
                  color: #2563eb;
                }
                .info-section {
                  margin: 20px 0;
                  padding: 15px;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                }
                .info-row {
                  display: flex;
                  margin: 10px 0;
                }
                .info-label {
                  font-weight: bold;
                  width: 200px;
                }
                .info-value {
                  flex: 1;
                }
                .monto-section {
                  background: #f3f4f6;
                  padding: 20px;
                  margin: 20px 0;
                  border-radius: 8px;
                  text-align: center;
                }
                .monto-label {
                  font-size: 14px;
                  color: #666;
                  margin-bottom: 5px;
                }
                .monto-valor {
                  font-size: 36px;
                  font-weight: bold;
                  color: #2563eb;
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 2px solid #000;
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                }
                .firma-section {
                  margin-top: 60px;
                  display: flex;
                  justify-content: space-around;
                }
                .firma-box {
                  text-align: center;
                }
                .firma-line {
                  border-top: 1px solid #000;
                  width: 200px;
                  margin: 0 auto 10px;
                }
              </style>
            </head>
            <body>
              ${reciboRef.current.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  }
                }
              </script>
            </body>
          </html>
        `)
        ventanaImpresion.document.close()
      }
    }
  }

  const padreSeleccionado = padres.find(p => p.id === padreId)
  const alumnosDisponibles = padreSeleccionado?.padre_alumno || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Pago</DialogTitle>
          <DialogDescription>
            Selecciona el método de pago: en línea o recibo para ventanilla
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : reciboGenerado ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={imprimirRecibo}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Recibo
              </Button>
              <Button variant="outline" onClick={() => {
                setReciboGenerado(null)
                limpiarFormulario()
              }}>
                Nuevo Recibo
              </Button>
            </div>

            <div ref={reciboRef} className="border rounded-lg p-6 bg-white">
              <div className="header">
                <div className="logo" style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb' }}>
                  SISTEMA ESCOLAR
                </div>
                <h2 style={{ margin: '10px 0', fontSize: '20px', textAlign: 'center' }}>RECIBO DE PAGO</h2>
                <p style={{ fontSize: '14px', color: '#666', textAlign: 'center' }}>
                  Folio: <strong>{reciboGenerado.folio}</strong>
                </p>
                <p style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>{reciboGenerado.fecha}</p>
              </div>

              <div className="info-section" style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#2563eb' }}>
                  Información del Alumno
                </h3>
                <div style={{ display: 'flex', margin: '10px 0' }}>
                  <div style={{ fontWeight: 'bold', width: '200px' }}>Nombre:</div>
                  <div style={{ flex: 1 }}>
                    {reciboGenerado.alumno?.profiles.nombre} {reciboGenerado.alumno?.profiles.apellidos}
                  </div>
                </div>
                <div style={{ display: 'flex', margin: '10px 0' }}>
                  <div style={{ fontWeight: 'bold', width: '200px' }}>Matrícula:</div>
                  <div style={{ flex: 1 }}>{reciboGenerado.alumno?.matricula}</div>
                </div>
                <div style={{ display: 'flex', margin: '10px 0' }}>
                  <div style={{ fontWeight: 'bold', width: '200px' }}>Grado y Grupo:</div>
                  <div style={{ flex: 1 }}>
                    {reciboGenerado.alumno?.grado}° {reciboGenerado.alumno?.grupo}
                  </div>
                </div>
              </div>

              <div className="info-section" style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#2563eb' }}>
                  Información del Padre/Tutor
                </h3>
                <div style={{ display: 'flex', margin: '10px 0' }}>
                  <div style={{ fontWeight: 'bold', width: '200px' }}>Nombre:</div>
                  <div style={{ flex: 1 }}>
                    {reciboGenerado.padre?.profiles.nombre} {reciboGenerado.padre?.profiles.apellidos}
                  </div>
                </div>
                <div style={{ display: 'flex', margin: '10px 0' }}>
                  <div style={{ fontWeight: 'bold', width: '200px' }}>Email:</div>
                  <div style={{ flex: 1 }}>{reciboGenerado.padre?.profiles.email}</div>
                </div>
              </div>

              <div className="info-section" style={{ margin: '20px 0', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#2563eb' }}>
                  Concepto de Pago
                </h3>
                <div style={{ display: 'flex', margin: '10px 0' }}>
                  <div style={{ fontWeight: 'bold', width: '200px' }}>Concepto:</div>
                  <div style={{ flex: 1 }}>{reciboGenerado.concepto}</div>
                </div>
                {reciboGenerado.descripcion && (
                  <div style={{ display: 'flex', margin: '10px 0' }}>
                    <div style={{ fontWeight: 'bold', width: '200px' }}>Descripción:</div>
                    <div style={{ flex: 1 }}>{reciboGenerado.descripcion}</div>
                  </div>
                )}
              </div>

              <div style={{ background: '#f3f4f6', padding: '20px', margin: '20px 0', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>MONTO A PAGAR</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2563eb' }}>
                  ${reciboGenerado.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </div>
              </div>

              <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto 10px' }}></div>
                  <p style={{ fontSize: '12px' }}>Firma del Padre/Tutor</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto 10px' }}></div>
                  <p style={{ fontSize: '12px' }}>Firma de Recibido</p>
                </div>
              </div>

              <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #000', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                <p>Este recibo debe presentarse en la ventanilla de pagos de la institución.</p>
                <p>Válido por 30 días a partir de la fecha de emisión.</p>
                <p style={{ marginTop: '10px' }}>
                  <strong>Conserve este recibo como comprobante de pago.</strong>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Tabs value={tabActivo} onValueChange={setTabActivo}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pago">
                <CreditCard className="h-4 w-4 mr-2" />
                Pago en Línea
              </TabsTrigger>
              <TabsTrigger value="recibo">
                <Printer className="h-4 w-4 mr-2" />
                Recibo de Ventanilla
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pago">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Concepto de Pago *</Label>
                    <Input
                      type="text"
                      placeholder="Ej: Colegiatura, Inscripción, Material..."
                      value={conceptoNombre}
                      onChange={(e) => setConceptoNombre(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label>Monto (MXN) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Padre *</Label>
                  <BuscadorPadres
                    padres={padres}
                    seleccionadoId={padreId}
                    onSeleccionar={handlePadreChange}
                  />
                </div>

                <div>
                  <Label>Alumno *</Label>
                  <Select
                    value={alumnoId}
                    onValueChange={setAlumnoId}
                    disabled={!padreId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        padreId
                          ? "Selecciona un alumno"
                          : "Primero selecciona un padre"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {alumnosDisponibles.map((rel) => (
                        <SelectItem key={rel.alumno_id} value={rel.alumno_id}>
                          {rel.alumnos.profiles.nombre} {rel.alumnos.profiles.apellidos} - {rel.alumnos.matricula} ({rel.alumnos.grado}° {rel.alumnos.grupo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {padreId && alumnosDisponibles.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Este padre no tiene alumnos asignados
                    </p>
                  )}
                </div>

                <div>
                  <Label>Descripción (opcional)</Label>
                  <Textarea
                    placeholder="Información adicional sobre el pago..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Fecha de Vencimiento *</Label>
                  <Input
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crear Pago'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="recibo">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Recibo de Ventanilla:</strong> Genera un recibo imprimible que el padre puede llevar a la ventanilla de pagos de la institución para realizar el pago en persona.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Concepto de Pago *</Label>
                    <Input
                      type="text"
                      placeholder="Ej: Colegiatura, Inscripción, Material..."
                      value={conceptoNombre}
                      onChange={(e) => setConceptoNombre(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Monto (MXN) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Padre *</Label>
                  <BuscadorPadres
                    padres={padres}
                    seleccionadoId={padreId}
                    onSeleccionar={handlePadreChange}
                  />
                </div>

                <div>
                  <Label>Alumno *</Label>
                  <Select
                    value={alumnoId}
                    onValueChange={setAlumnoId}
                    disabled={!padreId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        padreId
                          ? "Selecciona un alumno"
                          : "Primero selecciona un padre"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {alumnosDisponibles.map((rel) => (
                        <SelectItem key={rel.alumno_id} value={rel.alumno_id}>
                          {rel.alumnos.profiles.nombre} {rel.alumnos.profiles.apellidos} - {rel.alumnos.matricula} ({rel.alumnos.grado}° {rel.alumnos.grupo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {padreId && alumnosDisponibles.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      Este padre no tiene alumnos asignados
                    </p>
                  )}
                </div>

                <div>
                  <Label>Descripción (opcional)</Label>
                  <Textarea
                    placeholder="Información adicional sobre el pago..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Fecha de Vencimiento (opcional)</Label>
                  <Input
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si no se especifica, se establecerá automáticamente en 30 días
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleGenerarRecibo}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Printer className="h-4 w-4 mr-2" />
                        Generar Recibo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
