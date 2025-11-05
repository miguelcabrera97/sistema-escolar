'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FormularioAlumno } from './FormularioAlumno'

interface DialogoEditarAlumnoProps {
  alumno: {
    id: string
    matricula: string
    grado: string
    grupo: string
    profiles: {
      nombre: string
      apellidos: string
      email: string
    }
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DialogoEditarAlumno({ alumno, open, onOpenChange, onSuccess }: DialogoEditarAlumnoProps) {
  const handleClose = () => {
    onOpenChange(false)
    onSuccess?.()
  }

  if (!alumno) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <FormularioAlumno alumno={alumno} onClose={handleClose} />
      </DialogContent>
    </Dialog>
  )
}
