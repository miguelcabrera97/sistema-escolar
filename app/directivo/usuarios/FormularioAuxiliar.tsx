'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { crearAuxiliar, type CrearAuxiliarData } from '@/app/actions/usuarios-actions'
import { Loader2, Info } from 'lucide-react'

interface FormularioAuxiliarProps {
  onSuccess?: () => void
}

export function FormularioAuxiliar({ onSuccess }: FormularioAuxiliarProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CrearAuxiliarData>({
    email: '',
    password: '',
    nombre: '',
    apellidos: '',
    telefono: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await crearAuxiliar(formData)

      if (result.success) {
        alert('Auxiliar de calificaciones creado exitosamente')
        // Limpiar formulario
        setFormData({
          email: '',
          password: '',
          nombre: '',
          apellidos: '',
          telefono: ''
        })
        onSuccess?.()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear auxiliar')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof CrearAuxiliarData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar Nuevo Auxiliar de Calificaciones</CardTitle>
        <CardDescription>
          Crea una cuenta con acceso para calificar todas las tareas del sistema
        </CardDescription>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-semibold mb-1">Permisos del Auxiliar de Calificaciones:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>✅ Puede calificar tareas en TODOS los cursos del sistema</li>
                <li>❌ NO tiene acceso al módulo de pagos</li>
                <li>❌ NO puede ver información personal/contacto de alumnos (solo nombres)</li>
              </ul>
            </div>
          </div>
        </div>
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

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="auxiliar@escuela.com"
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
                  telefono: ''
                })
              }}
              disabled={loading}
            >
              Limpiar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creando...' : 'Crear Auxiliar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
