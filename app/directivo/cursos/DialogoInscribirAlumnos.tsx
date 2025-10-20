'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { obtenerAlumnosDisponibles, obtenerAlumnosInscritos, inscribirAlumnos, desinscribirAlumno } from '@/app/actions/cursos-actions'
import { Loader2, UserPlus, Users, Search, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Curso {
  id: string
  nombre: string
  grado: string
  grupo: string
  maestro_id?: string
  maestro_profiles?: {
    id: string
    nombre: string
    apellidos: string
  } | null
}

interface Alumno {
  id: string
  matricula: string
  grado: string
  grupo: string
  profiles: {
    nombre: string
    apellidos: string
    email: string
    activo: boolean
  }
}

interface AlumnoInscrito {
  id: string // ID de la inscripción
  alumno_id: string
  alumnos: {
    id: string
    matricula: string
    grado: string
    grupo: string
    profiles: {
      nombre: string
      apellidos: string
      email: string
      activo: boolean
    }
  }
}

interface Props {
  curso: Curso | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DialogoInscribirAlumnos({ curso, open, onOpenChange, onSuccess }: Props) {
  const [alumnosDisponibles, setAlumnosDisponibles] = useState<Alumno[]>([])
  const [alumnosInscritos, setAlumnosInscritos] = useState<AlumnoInscrito[]>([])
  const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    if (open && curso) {
      cargarDatos()
    } else {
      // Limpiar al cerrar
      setAlumnosDisponibles([])
      setAlumnosInscritos([])
      setAlumnosSeleccionados(new Set())
      setBusqueda('')
    }
  }, [open, curso])

  const cargarDatos = async () => {
    if (!curso) return

    setLoading(true)
    try {
      const [disponiblesResult, inscritosResult] = await Promise.all([
        obtenerAlumnosDisponibles(curso.id),
        obtenerAlumnosInscritos(curso.id)
      ])

      if (disponiblesResult.success) {
        setAlumnosDisponibles(disponiblesResult.data)
      }

      if (inscritosResult.success) {
        setAlumnosInscritos(inscritosResult.data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAlumno = (alumnoId: string) => {
    const newSet = new Set(alumnosSeleccionados)
    if (newSet.has(alumnoId)) {
      newSet.delete(alumnoId)
    } else {
      newSet.add(alumnoId)
    }
    setAlumnosSeleccionados(newSet)
  }

  const handleInscribir = async () => {
    if (!curso || alumnosSeleccionados.size === 0) return

    setSubmitting(true)
    try {
      const result = await inscribirAlumnos({
        curso_id: curso.id,
        alumno_ids: Array.from(alumnosSeleccionados)
      })

      if (result.success) {
        alert(
          `Alumnos inscritos exitosamente.\n` +
          `Nuevos: ${result.data.inscritos}\n` +
          (result.data.yaInscritos > 0 ? `Ya inscritos: ${result.data.yaInscritos}` : '')
        )
        setAlumnosSeleccionados(new Set())
        await cargarDatos()
        onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al inscribir alumnos')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDesinscribir = async (inscripcionId: string) => {
    if (!confirm('¿Estás seguro de desinscribir a este alumno del curso?')) {
      return
    }

    try {
      const result = await desinscribirAlumno(inscripcionId)

      if (result.success) {
        alert('Alumno desinscrito exitosamente')
        await cargarDatos()
        onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al desinscribir alumno')
    }
  }

  const alumnosFiltrados = alumnosDisponibles.filter(alumno => {
    if (!busqueda) return true
    const searchLower = busqueda.toLowerCase()
    return (
      alumno.matricula.toLowerCase().includes(searchLower) ||
      alumno.profiles.nombre.toLowerCase().includes(searchLower) ||
      alumno.profiles.apellidos.toLowerCase().includes(searchLower)
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Gestionar Alumnos del Curso
          </DialogTitle>
          <DialogDescription>
            {curso?.nombre} - {curso?.grado}° {curso?.grupo}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="disponibles" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="disponibles">
              Disponibles ({alumnosDisponibles.length})
            </TabsTrigger>
            <TabsTrigger value="inscritos">
              Inscritos ({alumnosInscritos.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Alumnos Disponibles */}
          <TabsContent value="disponibles" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por matrícula o nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Selección múltiple */}
                {alumnosSeleccionados.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">
                      {alumnosSeleccionados.size} alumno{alumnosSeleccionados.size !== 1 ? 's' : ''} seleccionado{alumnosSeleccionados.size !== 1 ? 's' : ''}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleInscribir}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Inscribiendo...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Inscribir
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAlumnosSeleccionados(new Set())}
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Lista de alumnos disponibles */}
                {alumnosFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No hay alumnos disponibles para inscribir</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Todos los alumnos ya están inscritos en este curso
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {alumnosFiltrados.map((alumno) => (
                      <div
                        key={alumno.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleToggleAlumno(alumno.id)}
                      >
                        <Checkbox
                          checked={alumnosSeleccionados.has(alumno.id)}
                          onCheckedChange={() => handleToggleAlumno(alumno.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">
                            {alumno.profiles.nombre} {alumno.profiles.apellidos}
                          </p>
                          <p className="text-sm text-gray-500">
                            Matrícula: {alumno.matricula} • {alumno.grado}° {alumno.grupo}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {alumno.grado}° {alumno.grupo}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Tab: Alumnos Inscritos */}
          <TabsContent value="inscritos" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : alumnosInscritos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No hay alumnos inscritos en este curso</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {alumnosInscritos.map((inscripcion) => (
                  <div
                    key={inscripcion.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {inscripcion.alumnos.profiles.nombre} {inscripcion.alumnos.profiles.apellidos}
                      </p>
                      <p className="text-sm text-gray-500">
                        Matrícula: {inscripcion.alumnos.matricula} • {inscripcion.alumnos.grado}° {inscripcion.alumnos.grupo}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {inscripcion.alumnos.grado}° {inscripcion.alumnos.grupo}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDesinscribir(inscripcion.id)}
                        title="Desinscribir"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
