'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { crearAlumno, type CrearAlumnoData } from '@/app/actions/usuarios-actions'
import { Loader2 } from 'lucide-react'

interface FormularioAlumnoProps {
  onSuccess?: () => void
}

export function FormularioAlumno({ onSuccess }: FormularioAlumnoProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CrearAlumnoData>({
    email: '',
    password: '',
    nombre: '',
    apellidos: '',
    matricula: '',
    grado: '',
    grupo: '',
    fecha_nacimiento: '',
    telefono: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await crearAlumno(formData)

      if (result.success) {
        alert('Alumno creado exitosamente')
        // Limpiar formulario
        setFormData({
          email: '',
          password: '',
          nombre: '',
          apellidos: '',
          matricula: '',
          grado: '',
          grupo: '',
          fecha_nacimiento: '',
          telefono: ''
        })
        onSuccess?.()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear alumno')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof CrearAlumnoData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar Nuevo Alumno</CardTitle>
        <CardDescription>
          Completa la información del alumno para crear su cuenta
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

            {/* Matrícula */}
            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula *</Label>
              <Input
                id="matricula"
                value={formData.matricula}
                onChange={(e) => handleChange('matricula', e.target.value)}
                placeholder="Ej: 2024001"
                required
                disabled={loading}
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Grado */}
            <div className="space-y-2">
              <Label htmlFor="grado">Grado *</Label>
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
              <Label htmlFor="grupo">Grupo *</Label>
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
                placeholder="alumno@escuela.com"
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
                  matricula: '',
                  grado: '',
                  grupo: '',
                  fecha_nacimiento: '',
                  telefono: ''
                })
              }}
              disabled={loading}
            >
              Limpiar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creando...' : 'Crear Alumno'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
