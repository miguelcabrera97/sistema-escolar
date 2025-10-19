'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { editarMaestro, type EditarMaestroData } from '@/app/actions/usuarios-actions'
import { Loader2 } from 'lucide-react'

interface DialogoEditarMaestroProps {
  maestro: {
    id: string
    nombre: string
    apellidos: string
    email: string
    telefono: string | null
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DialogoEditarMaestro({ maestro, open, onOpenChange, onSuccess }: DialogoEditarMaestroProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Omit<EditarMaestroData, 'id'>>({
    nombre: '',
    apellidos: '',
    email: '',
    especialidad: '',
    telefono: ''
  })

  // Actualizar formulario cuando cambia el maestro
  useEffect(() => {
    if (maestro) {
      setFormData({
        nombre: maestro.nombre,
        apellidos: maestro.apellidos,
        email: maestro.email,
        especialidad: '',
        telefono: maestro.telefono || ''
      })
    }
  }, [maestro])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!maestro) return

    setLoading(true)

    try {
      const result = await editarMaestro({
        id: maestro.id,
        ...formData
      })

      if (result.success) {
        alert('Maestro actualizado exitosamente')
        onOpenChange(false)
        onSuccess?.()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar maestro')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Omit<EditarMaestroData, 'id'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!maestro) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Maestro</DialogTitle>
          <DialogDescription>
            Modifica la información del maestro {maestro.nombre} {maestro.apellidos}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información Personal */}
            <div className="space-y-2">
              <Label htmlFor="edit-maestro-nombre">Nombre *</Label>
              <Input
                id="edit-maestro-nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-maestro-apellidos">Apellidos *</Label>
              <Input
                id="edit-maestro-apellidos"
                value={formData.apellidos}
                onChange={(e) => handleChange('apellidos', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-maestro-email">Email *</Label>
              <Input
                id="edit-maestro-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Especialidad */}
            <div className="space-y-2">
              <Label htmlFor="edit-maestro-especialidad">Especialidad</Label>
              <Input
                id="edit-maestro-especialidad"
                value={formData.especialidad}
                onChange={(e) => handleChange('especialidad', e.target.value)}
                placeholder="Ej: Matemáticas, Español, etc."
                disabled={loading}
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-maestro-telefono">Teléfono</Label>
              <Input
                id="edit-maestro-telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="555-1234567"
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
