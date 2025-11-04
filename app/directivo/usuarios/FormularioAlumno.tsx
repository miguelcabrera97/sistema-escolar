'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { crearAlumno, type CrearAlumnoData, type TelefonoEmergencia } from '@/app/actions/usuarios-actions'
import { Loader2, Plus, X } from 'lucide-react'

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
    telefono: '',
    curp: '',
    nombre_tutor: '',
    informacion_medica: '',
    telefonos_emergencia: []
  })
  const [telefonosEmergencia, setTelefonosEmergencia] = useState<TelefonoEmergencia[]>([
    { nombre: '', numero: '' }
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Filtrar teléfonos de emergencia que tengan al menos nombre o número
      const telefonosValidos = telefonosEmergencia.filter(
        tel => tel.nombre.trim() !== '' || tel.numero.trim() !== ''
      )

      const result = await crearAlumno({
        ...formData,
        telefonos_emergencia: telefonosValidos
      })

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
          telefono: '',
          curp: '',
          nombre_tutor: '',
          informacion_medica: '',
          telefonos_emergencia: []
        })
        setTelefonosEmergencia([{ nombre: '', numero: '' }])
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

  const agregarTelefonoEmergencia = () => {
    setTelefonosEmergencia(prev => [...prev, { nombre: '', numero: '' }])
  }

  const eliminarTelefonoEmergencia = (index: number) => {
    setTelefonosEmergencia(prev => prev.filter((_, i) => i !== index))
  }

  const actualizarTelefonoEmergencia = (index: number, field: 'nombre' | 'numero', value: string) => {
    setTelefonosEmergencia(prev =>
      prev.map((tel, i) => i === index ? { ...tel, [field]: value } : tel)
    )
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

            {/* CURP */}
            <div className="space-y-2">
              <Label htmlFor="curp">CURP</Label>
              <Input
                id="curp"
                value={formData.curp}
                onChange={(e) => handleChange('curp', e.target.value.toUpperCase())}
                placeholder="AAAA000000HDFAAA00"
                maxLength={18}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Clave Única de Registro de Población (18 caracteres)</p>
            </div>

            {/* Nombre del Tutor */}
            <div className="space-y-2">
              <Label htmlFor="nombre_tutor">Nombre del Padre/Tutor</Label>
              <Input
                id="nombre_tutor"
                value={formData.nombre_tutor}
                onChange={(e) => handleChange('nombre_tutor', e.target.value)}
                placeholder="Nombre completo del tutor"
                disabled={loading}
              />
            </div>
          </div>

          {/* Información Médica */}
          <div className="space-y-2">
            <Label htmlFor="informacion_medica">Información Médica Indispensable</Label>
            <Textarea
              id="informacion_medica"
              value={formData.informacion_medica}
              onChange={(e) => handleChange('informacion_medica', e.target.value)}
              placeholder="Alergias, condiciones médicas, medicamentos, tipo de sangre, etc."
              rows={3}
              disabled={loading}
            />
            <p className="text-xs text-gray-500">Información médica relevante que el personal debe conocer</p>
          </div>

          {/* Teléfonos de Emergencia */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Teléfonos de Contacto de Emergencia</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={agregarTelefonoEmergencia}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar Teléfono
              </Button>
            </div>

            <div className="space-y-3">
              {telefonosEmergencia.map((telefono, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Nombre del contacto (ej: Mamá, Papá)"
                      value={telefono.nombre}
                      onChange={(e) => actualizarTelefonoEmergencia(index, 'nombre', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="tel"
                      placeholder="Número de teléfono"
                      value={telefono.numero}
                      onChange={(e) => actualizarTelefonoEmergencia(index, 'numero', e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  {telefonosEmergencia.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => eliminarTelefonoEmergencia(index)}
                      disabled={loading}
                      className="mt-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
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
                  telefono: '',
                  curp: '',
                  nombre_tutor: '',
                  informacion_medica: '',
                  telefonos_emergencia: []
                })
                setTelefonosEmergencia([{ nombre: '', numero: '' }])
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
