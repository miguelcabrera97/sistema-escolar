'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { actualizarTarea } from '@/app/actions/tareas-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface Tarea {
  id: string
  titulo: string
  descripcion: string | null
  fecha_entrega: string
  puntos_maximos?: number
}

interface DialogoEditarTareaProps {
  tarea: Tarea
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DialogoEditarTarea({ tarea, open, onOpenChange, onSuccess }: DialogoEditarTareaProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Extraer YYYY-MM-DD para el input type="date"
  const getInitialDate = (dateString: string) => {
    try {
      return new Date(dateString).toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      titulo: formData.get('titulo') as string,
      descripcion: formData.get('descripcion') as string,
      fecha_entrega: formData.get('fechaEntrega') as string,
      puntos_maximos: Number(formData.get('puntosMaximos')),
    }

    try {
      const result = await actualizarTarea(tarea.id, data)

      if (result.success) {
        onOpenChange(false)
        if (onSuccess) onSuccess()
        router.refresh()
      } else {
        setError(result.error || 'Error al actualizar la tarea')
      }
    } catch (err) {
      setError('Ocurrió un error inesperado')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la tarea. Los cambios serán visibles para los alumnos inmediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="titulo">Título de la tarea</Label>
            <Input
              id="titulo"
              name="titulo"
              defaultValue={tarea.titulo}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción / Instrucciones</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              defaultValue={tarea.descripcion || ''}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaEntrega">Fecha de entrega</Label>
              <Input
                id="fechaEntrega"
                name="fechaEntrega"
                type="date"
                defaultValue={getInitialDate(tarea.fecha_entrega)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="puntosMaximos">Punteo máximo</Label>
              <Input
                id="puntosMaximos"
                name="puntosMaximos"
                type="number"
                min="0"
                max="100"
                defaultValue={tarea.puntos_maximos || 100}
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
