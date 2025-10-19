'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { crearMaestro, type CrearMaestroData } from '@/app/actions/usuarios-actions'
import { Loader2 } from 'lucide-react'

interface FormularioMaestroProps {
  onSuccess?: () => void
}

export function FormularioMaestro({ onSuccess }: FormularioMaestroProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CrearMaestroData>({
    email: '',
    password: '',
    nombre: '',
    apellidos: '',
    especialidad: '',
    telefono: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await crearMaestro(formData)

      if (result.success) {
        alert('Maestro creado exitosamente')
        // Limpiar formulario
        setFormData({
          email: '',
          password: '',
          nombre: '',
          apellidos: '',
          especialidad: '',
          telefono: ''
        })
        onSuccess?.()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear maestro')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof CrearMaestroData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar Nuevo Maestro</CardTitle>
        <CardDescription>
          Completa la información del maestro para crear su cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información Personal */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                value={formData.apellidos}
                onChange={(e) => handleChange('apellidos', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="maestro@escuela.com"
                required
                disabled={loading}
              />
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {/* Especialidad */}
            <div className="space-y-2">
              <Label htmlFor="especialidad">Especialidad</Label>
              <Input
                id="especialidad"
                value={formData.especialidad}
                onChange={(e) => handleChange('especialidad', e.target.value)}
                placeholder="Ej: Matemáticas, Español, etc."
                disabled={loading}
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
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
              onClick={() => {
                setFormData({
                  email: '',
                  password: '',
                  nombre: '',
                  apellidos: '',
                  especialidad: '',
                  telefono: ''
                })
              }}
              disabled={loading}
            >
              Limpiar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creando...' : 'Crear Maestro'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
