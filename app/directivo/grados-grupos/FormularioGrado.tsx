'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { crearGrado, obtenerNivelesEducativos, type NivelEducativo } from '@/app/actions/grados-grupos-actions'
import { useRouter } from 'next/navigation'

export function FormularioGrado() {
  const router = useRouter()
  const [niveles, setNiveles] = useState<NivelEducativo[]>([])
  const [nivelSeleccionado, setNivelSeleccionado] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function cargarNiveles() {
      const result = await obtenerNivelesEducativos()
      if (result.success) {
        setNiveles(result.data)
      }
    }
    cargarNiveles()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await crearGrado(formData)

    if (result.success) {
      alert('Grado creado exitosamente')
      e.currentTarget.reset()
      setNivelSeleccionado('')
      router.refresh()
    } else {
      alert('Error: ' + result.error)
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar Nuevo Grado</CardTitle>
        <CardDescription>
          Crea un nuevo grado académico para el colegio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="nivel_id" value={nivelSeleccionado} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nivel Educativo */}
            <div className="space-y-2">
              <Label htmlFor="nivel">Nivel Educativo *</Label>
              <Select value={nivelSeleccionado} onValueChange={setNivelSeleccionado} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un nivel" />
                </SelectTrigger>
                <SelectContent>
                  {niveles.map((nivel) => (
                    <SelectItem key={nivel.id} value={nivel.id}>
                      {nivel.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nombre del Grado */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre o Número de Grado *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Ej: 1, 2, Pre-First, Maternal"
                required
              />
            </div>

            {/* Orden */}
            <div className="space-y-2">
              <Label htmlFor="orden">Orden *</Label>
              <Input
                id="orden"
                name="orden"
                type="number"
                min="1"
                placeholder="Ej: 1"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Grado'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
