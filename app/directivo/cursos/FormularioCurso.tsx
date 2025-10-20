'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { crearCurso } from '@/app/actions/cursos-actions'
import { obtenerMaestros } from '@/app/actions/usuarios-actions'
import { BookOpen, Loader2, Plus } from 'lucide-react'

interface Maestro {
  id: string
  nombre: string
  apellidos: string
  email: string
  activo: boolean
}

export function FormularioCurso() {
  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [loadingMaestros, setLoadingMaestros] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    grado: '',
    grupo: '',
    maestro_id: ''
  })

  useEffect(() => {
    cargarMaestros()
  }, [])

  const cargarMaestros = async () => {
    setLoadingMaestros(true)
    const result = await obtenerMaestros()
    if (result.success) {
      console.log('Maestros obtenidos:', result.data)
      // Filtrar solo maestros activos
      const maestrosActivos = result.data.filter((m: Maestro) => m.activo)
      console.log('Maestros activos:', maestrosActivos)
      setMaestros(maestrosActivos)
    } else {
      console.error('Error al cargar maestros:', result.error)
    }
    setLoadingMaestros(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      console.log('Enviando datos del curso:', {
        nombre: formData.nombre,
        grado: formData.grado,
        grupo: formData.grupo,
        maestro_id: formData.maestro_id
      })

      const result = await crearCurso({
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        grado: formData.grado,
        grupo: formData.grupo,
        maestro_id: formData.maestro_id
      })

      console.log('Resultado:', result)

      if (result.success) {
        alert('Curso creado exitosamente')
        // Limpiar formulario
        setFormData({
          nombre: '',
          descripcion: '',
          grado: '',
          grupo: '',
          maestro_id: ''
        })
        setMostrarFormulario(false)
        // Recargar la página para actualizar la lista
        window.location.reload()
      } else {
        console.error('Error al crear curso:', result.error)
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Excepción al crear curso:', error)
      alert('Error al crear el curso')
    } finally {
      setSubmitting(false)
    }
  }

  const grados = ['1', '2', '3', '4', '5', '6']
  const grupos = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Crear Nuevo Curso
            </CardTitle>
            <CardDescription>
              Asigna un curso a un maestro y define el grado y grupo
            </CardDescription>
          </div>
          {!mostrarFormulario && (
            <Button onClick={() => setMostrarFormulario(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Curso
            </Button>
          )}
        </div>
      </CardHeader>

      {mostrarFormulario && (
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre del Curso */}
              <div className="md:col-span-2">
                <Label htmlFor="nombre">Nombre del Curso *</Label>
                <Input
                  id="nombre"
                  placeholder="ej: Matemáticas, Español, Ciencias..."
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                <textarea
                  id="descripcion"
                  placeholder="Breve descripción del curso..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                />
              </div>

              {/* Grado */}
              <div>
                <Label htmlFor="grado">Grado *</Label>
                <Select
                  value={formData.grado}
                  onValueChange={(value) => setFormData({ ...formData, grado: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el grado" />
                  </SelectTrigger>
                  <SelectContent>
                    {grados.map((grado) => (
                      <SelectItem key={grado} value={grado}>
                        {grado}°
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grupo */}
              <div>
                <Label htmlFor="grupo">Grupo *</Label>
                <Select
                  value={formData.grupo}
                  onValueChange={(value) => setFormData({ ...formData, grupo: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {grupos.map((grupo) => (
                      <SelectItem key={grupo} value={grupo}>
                        {grupo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Maestro */}
              <div className="md:col-span-2">
                <Label htmlFor="maestro">Maestro Asignado *</Label>
                {loadingMaestros ? (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando maestros...
                  </div>
                ) : maestros.length === 0 ? (
                  <p className="text-sm text-red-600">
                    No hay maestros activos disponibles. Crea un maestro primero.
                  </p>
                ) : (
                  <Select
                    value={formData.maestro_id}
                    onValueChange={(value) => setFormData({ ...formData, maestro_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un maestro" />
                    </SelectTrigger>
                    <SelectContent>
                      {maestros.map((maestro) => (
                        <SelectItem key={maestro.id} value={maestro.id}>
                          {maestro.nombre} {maestro.apellidos} - {maestro.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={submitting || maestros.length === 0}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Curso
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMostrarFormulario(false)
                  setFormData({
                    nombre: '',
                    descripcion: '',
                    grado: '',
                    grupo: '',
                    maestro_id: ''
                  })
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  )
}
