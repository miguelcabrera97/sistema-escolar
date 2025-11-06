'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { crearGrupo } from '@/app/actions/grados-grupos-actions'
import { useRouter } from 'next/navigation'

export function FormularioGrupo() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await crearGrupo(formData)

    if (result.success) {
      alert('Grupo creado exitosamente')
      e.currentTarget.reset()
      router.refresh()
    } else {
      alert('Error: ' + result.error)
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar Nuevo Grupo</CardTitle>
        <CardDescription>
          Crea un nuevo grupo (letra) para el colegio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre del Grupo */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Letra del Grupo *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej: A, B, C"
                maxLength={2}
                className="uppercase"
                required
              />
              <p className="text-xs text-gray-500">
                Se convertirá automáticamente a mayúsculas
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Grupo'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
