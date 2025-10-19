'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { editarAlumno, type EditarAlumnoData } from '@/app/actions/usuarios-actions'
import { Loader2 } from 'lucide-react'

interface DialogoEditarAlumnoProps {
  alumno: {
    id: string
    matricula: string
    grado: string
    grupo: string
    fecha_nacimiento: string | null
    profiles: {
      nombre: string
      apellidos: string
      email: string
      telefono: string | null
    }
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DialogoEditarAlumno({ alumno, open, onOpenChange, onSuccess }: DialogoEditarAlumnoProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Omit<EditarAlumnoData, 'id'>>({
    nombre: '',
    apellidos: '',
    matricula: '',
    grado: '',
    grupo: '',
    email: '',
    fecha_nacimiento: '',
    telefono: ''
  })

  // Actualizar formulario cuando cambia el alumno
  useEffect(() => {
    if (alumno) {
      setFormData({
        nombre: alumno.profiles.nombre,
        apellidos: alumno.profiles.apellidos,
        matricula: alumno.matricula,
        grado: alumno.grado,
        grupo: alumno.grupo,
        email: alumno.profiles.email,
        fecha_nacimiento: alumno.fecha_nacimiento || '',
        telefono: alumno.profiles.telefono || ''
      })
    }
  }, [alumno])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!alumno) return

    setLoading(true)

    try {
      const result = await editarAlumno({
        id: alumno.id,
        ...formData
      })

      if (result.success) {
        alert('Alumno actualizado exitosamente')
        onOpenChange(false)
        onSuccess?.()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar alumno')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Omit<EditarAlumnoData, 'id'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!alumno) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Alumno</DialogTitle>
          <DialogDescription>
            Modifica la información del alumno {alumno.profiles.nombre} {alumno.profiles.apellidos}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información Personal */}
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-apellidos">Apellidos *</Label>
              <Input
                id="edit-apellidos"
                value={formData.apellidos}
                onChange={(e) => handleChange('apellidos', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Matrícula */}
            <div className="space-y-2">
              <Label htmlFor="edit-matricula">Matrícula *</Label>
              <Input
                id="edit-matricula"
                value={formData.matricula}
                onChange={(e) => handleChange('matricula', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-2">
              <Label htmlFor="edit-fecha-nacimiento">Fecha de Nacimiento</Label>
              <Input
                id="edit-fecha-nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Grado */}
            <div className="space-y-2">
              <Label htmlFor="edit-grado">Grado *</Label>
              <Select
                value={formData.grado}
                onValueChange={(value) => handleChange('grado', value)}
                disabled={loading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el grado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1° Grado</SelectItem>
                  <SelectItem value="2">2° Grado</SelectItem>
                  <SelectItem value="3">3° Grado</SelectItem>
                  <SelectItem value="4">4° Grado</SelectItem>
                  <SelectItem value="5">5° Grado</SelectItem>
                  <SelectItem value="6">6° Grado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grupo */}
            <div className="space-y-2">
              <Label htmlFor="edit-grupo">Grupo *</Label>
              <Select
                value={formData.grupo}
                onValueChange={(value) => handleChange('grupo', value)}
                disabled={loading}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Grupo A</SelectItem>
                  <SelectItem value="B">Grupo B</SelectItem>
                  <SelectItem value="C">Grupo C</SelectItem>
                  <SelectItem value="D">Grupo D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input
                id="edit-telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="555-1234567"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
