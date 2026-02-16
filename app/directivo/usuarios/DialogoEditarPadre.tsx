'use client'

import { useState, useEffect, useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { editarPadre } from '@/app/actions/usuarios-actions'
import { Loader2 } from 'lucide-react'

interface DialogoEditarPadreProps {
  padre: {
    id: string
    nombre: string
    apellidos: string
    email: string
    telefono?: string | null
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const initialState = {
  success: false,
  error: '',
  message: ''
}

export function DialogoEditarPadre({ padre, open, onOpenChange, onSuccess }: DialogoEditarPadreProps) {
  const [loading, setLoading] = useState(false)
  const [state, formAction] = useActionState(editarPadre, initialState)

  useEffect(() => {
    if (state.success) {
      alert(state.message)
      onOpenChange(false)
      onSuccess?.()
    } else if (state.error) {
      alert('Error: ' + state.error)
      setLoading(false)
    }
  }, [state, onOpenChange, onSuccess])

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    await formAction(formData)
  }

  if (!padre) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Padre/Tutor</DialogTitle>
          <DialogDescription>
            Modifica la información de {padre.nombre} {padre.apellidos}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="id" value={padre.id} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información Personal */}
            <div className="space-y-2">
              <Label htmlFor="edit-padre-nombre">Nombre *</Label>
              <Input
                id="edit-padre-nombre"
                name="nombre"
                defaultValue={padre.nombre}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-padre-apellidos">Apellidos *</Label>
              <Input
                id="edit-padre-apellidos"
                name="apellidos"
                defaultValue={padre.apellidos}
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-padre-email">Email *</Label>
              <Input
                id="edit-padre-email"
                name="email"
                type="email"
                defaultValue={padre.email}
                required
                disabled={loading}
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="edit-padre-telefono">Teléfono</Label>
              <Input
                id="edit-padre-telefono"
                name="telefono"
                type="tel"
                defaultValue={padre.telefono || ''}
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
