'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { editarCurso } from '@/app/actions/cursos-actions'
import { obtenerMaestros } from '@/app/actions/usuarios-actions'
import { Loader2, Pencil } from 'lucide-react'

interface Curso {
  id: string
  nombre: string
  descripcion: string | null
  grado: string
  grupo: string
  maestro_id: string
  maestro_profiles: {
    id: string
    nombre: string
    apellidos: string
    email: string
  } | null
}

interface Maestro {
  id: string
  nombre: string
  apellidos: string
  email: string
  activo: boolean
}

interface Props {
  curso: Curso | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DialogoEditarCurso({ curso, open, onOpenChange, onSuccess }: Props) {
  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [loadingMaestros, setLoadingMaestros] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    grado: '',
    grupo: '',
    maestro_id: ''
  })

  useEffect(() => {
    if (open && curso) {
      setFormData({
        nombre: curso.nombre,
        descripcion: curso.descripcion || '',
        grado: curso.grado,
        grupo: curso.grupo,
        maestro_id: curso.maestro_profiles?.id || curso.maestro_id || ''
      })
      cargarMaestros()
    }
  }, [open, curso])

  const cargarMaestros = async () => {
    setLoadingMaestros(true)
    const result = await obtenerMaestros()
    if (result.success) {
      // Filtrar solo maestros activos
      const maestrosActivos = result.data.filter((m: Maestro) => m.activo)
      setMaestros(maestrosActivos)
    }
    setLoadingMaestros(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!curso) return

    setSubmitting(true)

    try {
      const result = await editarCurso({
        id: curso.id,
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        grado: formData.grado,
        grupo: formData.grupo,
        maestro_id: formData.maestro_id
      })

      if (result.success) {
        alert('Curso actualizado exitosamente')
        onOpenChange(false)
        onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar el curso')
    } finally {
      setSubmitting(false)
    }
  }

  const grados = ['1', '2', '3', '4', '5', '6']
  const grupos = ['A', 'B', 'C', 'D', 'E', 'F']

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Editar Curso
          </DialogTitle>
          <DialogDescription>
            Modifica la información del curso
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre del Curso */}
            <div className="md:col-span-2">
              <Label htmlFor="edit-nombre">Nombre del Curso *</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <Label htmlFor="edit-descripcion">Descripción (Opcional)</Label>
              <textarea
                id="edit-descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border rounded-md min-h-[80px]"
              />
            </div>

            {/* Grado */}
            <div>
              <Label htmlFor="edit-grado">Grado *</Label>
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
              <Label htmlFor="edit-grupo">Grupo *</Label>
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
              <Label htmlFor="edit-maestro">Maestro Asignado *</Label>
              {loadingMaestros ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando maestros...
                </div>
              ) : maestros.length === 0 ? (
                <p className="text-sm text-red-600">
                  No hay maestros activos disponibles
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
                  Guardando...
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
