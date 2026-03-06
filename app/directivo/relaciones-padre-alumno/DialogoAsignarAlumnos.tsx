'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Loader2, Search } from 'lucide-react'
import { obtenerPadresConAlumnos } from '@/app/actions/pagos-actions'
import { crearRelacionPadreAlumno, obtenerTodosLosAlumnos } from '@/app/actions/relaciones-padre-alumno-actions'

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

interface Alumno {
  id: string
  matricula: string
  grado: string
  grupo: string
  user_id: string
  profiles: {
    nombre: string
    apellidos: string
  }
}

export function DialogoAsignarAlumnos({ open, onOpenChange, onSuccess }: Props) {
  const [padres, setPadres] = useState<Padre[]>([])
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [padreId, setPadreId] = useState('')
  const [alumnoId, setAlumnoId] = useState('')
  const [parentesco, setParentesco] = useState('Padre/Madre')

  const [busquedaPadre, setBusquedaPadre] = useState('')
  const [busquedaAlumno, setBusquedaAlumno] = useState('')

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
      const result = await obtenerPadresConAlumnos()

      if (result.success) {
        setPadres(result.data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const limpiarFormulario = () => {
    setPadreId('')
    setAlumnoId('')
    setParentesco('Padre/Madre')
    setBusquedaPadre('')
    setBusquedaAlumno('')
  }

  const handlePadreChange = async (padreIdSeleccionado: string) => {
    setPadreId(padreIdSeleccionado)
    setAlumnoId('')
    setBusquedaAlumno('')

    setLoading(true)
    try {
      const result = await obtenerTodosLosAlumnos()

      if (result.success && result.data) {
        // Filtrar alumnos que ya están asignados a este padre
        const padreSeleccionado = padres.find(p => p.id === padreIdSeleccionado)
        const alumnosYaAsignados = new Set(
          padreSeleccionado?.padre_alumno?.map(pa => pa.alumno_id) || []
        )

        const alumnosFiltrados = result.data.filter((alumno: Alumno) =>
          !alumnosYaAsignados.has(alumno.id)
        )

        setAlumnosDisponibles(alumnosFiltrados)
      }
    } catch (error) {
      console.error('Error al cargar alumnos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!padreId || !alumnoId) {
      alert('Por favor selecciona un padre y un alumno')
      return
    }

    setSubmitting(true)
    try {
      const result = await crearRelacionPadreAlumno(padreId, alumnoId, parentesco)

      if (result.success) {
        alert('¡Relación creada exitosamente!')
        onOpenChange(false)
        onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear la relación')
    } finally {
      setSubmitting(false)
    }
  }

  const padreSeleccionado = padres.find(p => p.id === padreId)

  // Filtrado de búsquedas
  const padresFiltradosUI = padres.filter(padre => {
    const term = busquedaPadre.toLowerCase()
    return padre.profiles.nombre.toLowerCase().includes(term) ||
      padre.profiles.apellidos.toLowerCase().includes(term) ||
      padre.profiles.email.toLowerCase().includes(term)
  }).slice(0, 100)

  const alumnosFiltradosUI = alumnosDisponibles.filter(alumno => {
    const term = busquedaAlumno.toLowerCase()
    return alumno.profiles.nombre.toLowerCase().includes(term) ||
      alumno.profiles.apellidos.toLowerCase().includes(term) ||
      alumno.matricula.toLowerCase().includes(term)
  }).slice(0, 100)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Alumno a Padre</DialogTitle>
          <DialogDescription>
            Crea una relación entre un padre y un alumno
          </DialogDescription>
        </DialogHeader>

        {loading && !padreId ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label>Padre *</Label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="🔍 Filtrar padres por nombre o email..."
                    value={busquedaPadre}
                    onChange={(e) => setBusquedaPadre(e.target.value)}
                    className="pl-9 h-9 border-gray-300"
                  />
                </div>
                <Select value={padreId} onValueChange={handlePadreChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un padre de la lista..." />
                  </SelectTrigger>
                  <SelectContent>
                    {padresFiltradosUI.map((padre) => (
                      <SelectItem key={padre.id} value={padre.id}>
                        {padre.profiles.nombre} {padre.profiles.apellidos} - {padre.profiles.email}
                      </SelectItem>
                    ))}
                    {padresFiltradosUI.length === 0 && (
                      <SelectItem disabled value="vacio">No se encontraron padres</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {padreSeleccionado && padreSeleccionado.padre_alumno.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  Alumnos ya asignados a este padre:
                </p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {padreSeleccionado.padre_alumno.map((pa) => (
                    <li key={pa.alumno_id}>
                      • {pa.alumnos.profiles.nombre} {pa.alumnos.profiles.apellidos} - {pa.alumnos.matricula}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <Label>Alumno *</Label>
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="🔍 Filtrar alumnos por nombre o matrícula..."
                    value={busquedaAlumno}
                    onChange={(e) => setBusquedaAlumno(e.target.value)}
                    disabled={!padreId || loading}
                    className="pl-9 h-9 border-gray-300"
                  />
                </div>
                <Select
                  value={alumnoId}
                  onValueChange={setAlumnoId}
                  disabled={!padreId || loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !padreId
                        ? "Primero selecciona un padre"
                        : loading
                          ? "Cargando alumnos..."
                          : "Selecciona un alumno de la lista..."
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {alumnosFiltradosUI.map((alumno) => (
                      <SelectItem key={alumno.id} value={alumno.id}>
                        {alumno.profiles.nombre} {alumno.profiles.apellidos} - {alumno.matricula} ({alumno.grado}° {alumno.grupo})
                      </SelectItem>
                    ))}
                    {alumnosFiltradosUI.length === 0 && padreId && !loading && (
                      <SelectItem disabled value="vacio">No se encontraron alumnos disponibles</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Parentesco *</Label>
              <Input
                type="text"
                placeholder="Ej: Padre, Madre, Tutor, etc."
                value={parentesco}
                onChange={(e) => setParentesco(e.target.value)}
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
              <Button type="submit" disabled={submitting || !padreId || !alumnoId}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Relación'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
