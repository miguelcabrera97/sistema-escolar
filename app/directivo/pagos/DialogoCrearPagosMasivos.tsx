'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Users } from 'lucide-react'
import { crearPagosMasivos, obtenerPadresConAlumnos } from '@/app/actions/pagos-actions'

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

export function DialogoCrearPagosMasivos({ open, onOpenChange, onSuccess }: Props) {
  const [padres, setPadres] = useState<Padre[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [conceptoId, setConceptoId] = useState('')
  const [conceptoNombre, setConceptoNombre] = useState('')
  const [padresSeleccionados, setPadresSeleccionados] = useState<Set<string>>(new Set())
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [busqueda, setBusqueda] = useState('')

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
    setPadresSeleccionados(new Set())
    setMonto('')
    setDescripcion('')
    setFechaVencimiento('')
    setBusqueda('')
  }

  const handleTogglePadre = (padreId: string) => {
    const newSet = new Set(padresSeleccionados)
    if (newSet.has(padreId)) {
      newSet.delete(padreId)
    } else {
      newSet.add(padreId)
    }
    setPadresSeleccionados(newSet)
  }

  const handleSeleccionarTodos = () => {
    if (padresSeleccionados.size === padresFiltrados.length) {
      setPadresSeleccionados(new Set())
    } else {
      setPadresSeleccionados(new Set(padresFiltrados.map(p => p.id)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!conceptoNombre || padresSeleccionados.size === 0 || !monto || !fechaVencimiento) {
      alert('Por favor completa todos los campos requeridos y selecciona al menos un padre')
      return
    }

    const totalPagos = padres
      .filter(p => padresSeleccionados.has(p.id))
      .reduce((sum, p) => sum + p.padre_alumno.length, 0)

    if (!confirm(
      `Se crearán ${totalPagos} pagos para ${padresSeleccionados.size} padres.\n` +
      `Monto total: $${(parseFloat(monto) * totalPagos).toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n\n` +
      `¿Continuar?`
    )) {
      return
    }

    setSubmitting(true)
    try {
      const result = await crearPagosMasivos({
        concepto: conceptoNombre,
        padre_ids: Array.from(padresSeleccionados),
        monto: parseFloat(monto),
        descripcion: descripcion || undefined,
        fecha_vencimiento: fechaVencimiento
      })

      if (result.success) {
        alert(`${result.data.total} pagos creados exitosamente`)
        onOpenChange(false)
        onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear los pagos')
    } finally {
      setSubmitting(false)
    }
  }

  const padresFiltrados = padres.filter(padre => {
    if (!busqueda) return true
    const searchLower = busqueda.toLowerCase()
    return (
      padre.profiles.nombre.toLowerCase().includes(searchLower) ||
      padre.profiles.apellidos.toLowerCase().includes(searchLower) ||
      padre.profiles.email.toLowerCase().includes(searchLower) ||
      padre.padre_alumno.some(rel =>
        rel.alumnos.profiles.nombre.toLowerCase().includes(searchLower) ||
        rel.alumnos.profiles.apellidos.toLowerCase().includes(searchLower) ||
        rel.alumnos.matricula.toLowerCase().includes(searchLower)
      )
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Pagos Masivos</DialogTitle>
          <DialogDescription>
            Genera cobros para múltiples padres al mismo tiempo
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del pago */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Información del Pago</h3>

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
                <Label>Descripción (opcional)</Label>
                <Textarea
                  placeholder="Información adicional sobre el pago..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  rows={2}
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
            </div>

            {/* Selección de padres */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Seleccionar Padres</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSeleccionarTodos}
                >
                  {padresSeleccionados.size === padresFiltrados.length
                    ? 'Deseleccionar Todos'
                    : 'Seleccionar Todos'}
                </Button>
              </div>

              <Input
                placeholder="Buscar padre o alumno..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />

              {padresSeleccionados.size > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    {padresSeleccionados.size} padre{padresSeleccionados.size !== 1 ? 's' : ''} seleccionado{padresSeleccionados.size !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Se crearán {padres.filter(p => padresSeleccionados.has(p.id))
                      .reduce((sum, p) => sum + p.padre_alumno.length, 0)} pagos en total
                  </p>
                </div>
              )}

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {padresFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No se encontraron padres</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {padresFiltrados.map((padre) => (
                      <div
                        key={padre.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleTogglePadre(padre.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={padresSeleccionados.has(padre.id)}
                            onCheckedChange={() => handleTogglePadre(padre.id)}
                          />
                          <div className="flex-1">
                            <p className="font-medium">
                              {padre.profiles.nombre} {padre.profiles.apellidos}
                            </p>
                            <p className="text-sm text-gray-600">{padre.profiles.email}</p>
                            <div className="mt-2 space-y-1">
                              {padre.padre_alumno.map((rel) => (
                                <p key={rel.alumno_id} className="text-xs text-gray-500">
                                  • {rel.alumnos.profiles.nombre} {rel.alumnos.profiles.apellidos} - {rel.alumnos.matricula} ({rel.alumnos.grado}° {rel.alumnos.grupo})
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || padresSeleccionados.size === 0}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  `Crear ${padresSeleccionados.size > 0 ? padresSeleccionados.size : ''} Pago${padresSeleccionados.size !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
