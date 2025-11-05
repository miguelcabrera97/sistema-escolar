'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { crearPago, obtenerConceptosPago, obtenerPadresConAlumnos } from '@/app/actions/pagos-actions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

interface Concepto {
  id: string
  nombre: string
  descripcion: string | null
  monto_default: number
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

export function DialogoCrearPago({ open, onOpenChange, onSuccess }: Props) {
  const [conceptos, setConceptos] = useState<Concepto[]>([])
  const [padres, setPadres] = useState<Padre[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [conceptoId, setConceptoId] = useState('')
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
      const [conceptosResult, padresResult] = await Promise.all([
        obtenerConceptosPago(),
        obtenerPadresConAlumnos()
      ])

      if (conceptosResult.success) {
        setConceptos(conceptosResult.data || [])
      }

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
    setPadreId('')
    setAlumnoId('')
    setMonto('')
    setDescripcion('')
    setFechaVencimiento('')
  }

  const handleConceptoChange = (conceptoId: string) => {
    setConceptoId(conceptoId)
    const concepto = conceptos.find(c => c.id === conceptoId)
    if (concepto && concepto.monto_default > 0) {
      setMonto(concepto.monto_default.toString())
    }
  }

  const handlePadreChange = (padreId: string) => {
    setPadreId(padreId)
    setAlumnoId('') // Reset alumno cuando cambia el padre
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!conceptoId || !padreId || !alumnoId || !monto || !fechaVencimiento) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    setSubmitting(true)
    try {
      const result = await crearPago({
        concepto_id: conceptoId,
        padre_id: padreId,
        alumno_id: alumnoId,
        monto: parseFloat(monto),
        descripcion: descripcion || undefined,
        fecha_vencimiento: fechaVencimiento
      })

      if (result.success) {
        alert('Pago creado exitosamente')
        onOpenChange(false)
        onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear el pago')
    } finally {
      setSubmitting(false)
    }
  }

  const padreSeleccionado = padres.find(p => p.id === padreId)
  const alumnosDisponibles = padreSeleccionado?.padre_alumno || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Pago</DialogTitle>
          <DialogDescription>
            Genera un cobro para un padre/alumno específico
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Concepto de Pago *</Label>
                <Select value={conceptoId} onValueChange={handleConceptoChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un concepto" />
                  </SelectTrigger>
                  <SelectContent>
                    {conceptos.map((concepto) => (
                      <SelectItem key={concepto.id} value={concepto.id}>
                        {concepto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Select value={padreId} onValueChange={handlePadreChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un padre" />
                </SelectTrigger>
                <SelectContent>
                  {padres.map((padre) => (
                    <SelectItem key={padre.id} value={padre.id}>
                      {padre.profiles.nombre} {padre.profiles.apellidos} - {padre.profiles.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        )}
      </DialogContent>
    </Dialog>
  )
}
