'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<Set<string>>(new Set())
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const prevOpenRef = useRef(false)

  useEffect(() => {
    if (open) {
      cargarDatos()
    } else if (prevOpenRef.current) {
      // Solo limpiar cuando se cierra (transiciona de true a false)
      limpiarFormulario()
    }
    prevOpenRef.current = open
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
    setAlumnosSeleccionados(new Set())
    setMonto('')
    setDescripcion('')
    setFechaVencimiento('')
    setBusqueda('')
  }

  const handleTogglePadre = (padre: Padre) => {
    const newSet = new Set(alumnosSeleccionados)
    const alumnosDelPadre = padre.padre_alumno.map(pa => `${padre.id}_${pa.alumno_id}`)

    // Verificar si todos los alumnos de este padre están seleccionados
    const todosSeleccionados = alumnosDelPadre.every(id => newSet.has(id))

    if (todosSeleccionados) {
      // Deseleccionar todos
      alumnosDelPadre.forEach(id => newSet.delete(id))
    } else {
      // Seleccionar todos
      alumnosDelPadre.forEach(id => newSet.add(id))
    }

    setAlumnosSeleccionados(newSet)
  }

  const handleToggleAlumno = (padreId: string, alumnoId: string) => {
    const id = `${padreId}_${alumnoId}`
    const newSet = new Set(alumnosSeleccionados)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setAlumnosSeleccionados(newSet)
  }

  const handleSeleccionarTodos = () => {
    const totalAlumnosFiltrados = padresFiltrados.flatMap(p =>
      p.padre_alumno.map(pa => `${p.id}_${pa.alumno_id}`)
    )

    if (alumnosSeleccionados.size === totalAlumnosFiltrados.length) {
      setAlumnosSeleccionados(new Set())
    } else {
      setAlumnosSeleccionados(new Set(totalAlumnosFiltrados))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!conceptoNombre || alumnosSeleccionados.size === 0 || !monto || !fechaVencimiento) {
      alert('Por favor completa todos los campos requeridos y selecciona al menos un alumno')
      return
    }

    const payloadAlumnos = Array.from(alumnosSeleccionados).map(id => {
      const [padre_id, alumno_id] = id.split('_')
      return { padre_id, alumno_id }
    })

    if (!confirm(
      `Se crearán ${payloadAlumnos.length} pagos.\n` +
      `Monto total: $${(parseFloat(monto) * payloadAlumnos.length).toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n\n` +
      `¿Continuar?`
    )) {
      return
    }

    setSubmitting(true)
    try {
      const result = await crearPagosMasivos({
        concepto: conceptoNombre,
        alumnos: payloadAlumnos,
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

  // Calcular total de alumnos filtrados para el botón "Seleccionar Todos"
  const totalAlumnosVisibles = padresFiltrados.reduce((acc, p) => acc + p.padre_alumno.length, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Pagos Masivos</DialogTitle>
          <DialogDescription>
            Genera cobros para múltiples alumnos al mismo tiempo
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

            {/* Selección de alumnos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Seleccionar Alumnos</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSeleccionarTodos}
                >
                  {alumnosSeleccionados.size === totalAlumnosVisibles && totalAlumnosVisibles > 0
                    ? 'Deseleccionar Todos'
                    : 'Seleccionar Todos'}
                </Button>
              </div>

              <Input
                placeholder="Buscar padre o alumno..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />

              {alumnosSeleccionados.size > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">
                    {alumnosSeleccionados.size} alumno{alumnosSeleccionados.size !== 1 ? 's' : ''} seleccionado{alumnosSeleccionados.size !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Monto total a generar: ${(parseFloat(monto || '0') * alumnosSeleccionados.size).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              <div className="border rounded-lg max-h-96 overflow-y-auto">
                {padresFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No se encontraron alumnos</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {padresFiltrados.map((padre) => {
                      const todosSusAlumnosSeleccionados = padre.padre_alumno.every(
                        pa => alumnosSeleccionados.has(`${padre.id}_${pa.alumno_id}`)
                      )
                      const algunAlumnoSeleccionado = padre.padre_alumno.some(
                        pa => alumnosSeleccionados.has(`${padre.id}_${pa.alumno_id}`)
                      )

                      return (
                        <div key={padre.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center gap-3 mb-2">
                            <Checkbox
                              // Radix Checkbox 'indeterminate' state handling might be custom for 'some' but not 'all'
                              // Standard HTML checkbox uses indeterminate prop. Radix UI checkox uses 'indeterminate' value for checked.
                              checked={
                                todosSusAlumnosSeleccionados
                                  ? true
                                  : algunAlumnoSeleccionado
                                    ? 'indeterminate'
                                    : false
                              }
                              onCheckedChange={() => handleTogglePadre(padre)}
                            />
                            <div>
                              <p className="font-semibold text-sm">
                                {padre.profiles.nombre} {padre.profiles.apellidos}
                              </p>
                              <p className="text-xs text-gray-500">{padre.profiles.email}</p>
                            </div>
                          </div>

                          <div className="ml-8 space-y-2 border-l-2 border-gray-100 pl-4 py-1">
                            {padre.padre_alumno.map((rel) => (
                              <div
                                key={rel.alumno_id}
                                className="flex items-center gap-3 cursor-pointer p-1 hover:bg-gray-100 rounded"
                                onClick={() => handleToggleAlumno(padre.id, rel.alumno_id)}
                              >
                                <Checkbox
                                  checked={alumnosSeleccionados.has(`${padre.id}_${rel.alumno_id}`)}
                                  onCheckedChange={() => handleToggleAlumno(padre.id, rel.alumno_id)}
                                />
                                <div className="text-sm">
                                  <span className="font-medium text-gray-700">
                                    {rel.alumnos.profiles.nombre} {rel.alumnos.profiles.apellidos}
                                  </span>
                                  <span className="text-gray-500 ml-2 text-xs">
                                    • {rel.alumnos.matricula} • {rel.alumnos.grado}° {rel.alumnos.grupo}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
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
              <Button type="submit" disabled={submitting || alumnosSeleccionados.size === 0}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  `Crear ${alumnosSeleccionados.size > 0 ? alumnosSeleccionados.size : ''} Pago${alumnosSeleccionados.size !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
