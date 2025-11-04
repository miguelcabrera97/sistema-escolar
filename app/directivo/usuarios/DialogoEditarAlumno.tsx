'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { editarAlumno, type EditarAlumnoData, type TelefonoEmergencia } from '@/app/actions/usuarios-actions'
import { Loader2, Plus, X } from 'lucide-react'

interface DialogoEditarAlumnoProps {
  alumno: {
    id: string
    matricula: string
    grado: string
    grupo: string
    fecha_nacimiento: string | null
    curp: string | null
    nombre_tutor: string | null
    informacion_medica: string | null
    telefonos_emergencia: TelefonoEmergencia[] | null
    profiles: {
      nombre: string
      apellidos: string
      email: string
      telefono: string | null
    }
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DialogoEditarAlumno({ alumno, open, onOpenChange, onSuccess }: DialogoEditarAlumnoProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Omit<EditarAlumnoData, 'id'>>({
    nombre: '',
    apellidos: '',
    matricula: '',
    grado: '',
    grupo: '',
    email: '',
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

  // Actualizar formulario cuando cambia el alumno
  useEffect(() => {
    if (alumno) {
      setFormData({
        nombre: alumno.profiles.nombre,
        apellidos: alumno.profiles.apellidos,
        matricula: alumno.matricula,
        grado: alumno.grado,
        grupo: alumno.grupo,
        email: alumno.profiles.email,
        fecha_nacimiento: alumno.fecha_nacimiento || '',
        telefono: alumno.profiles.telefono || '',
        curp: alumno.curp || '',
        nombre_tutor: alumno.nombre_tutor || '',
        informacion_medica: alumno.informacion_medica || '',
        telefonos_emergencia: alumno.telefonos_emergencia || []
      })

      // Cargar teléfonos de emergencia o inicializar con uno vacío
      if (alumno.telefonos_emergencia && alumno.telefonos_emergencia.length > 0) {
        setTelefonosEmergencia(alumno.telefonos_emergencia)
      } else {
        setTelefonosEmergencia([{ nombre: '', numero: '' }])
      }
    }
  }, [alumno])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!alumno) return

    setLoading(true)

    try {
      // Filtrar teléfonos de emergencia que tengan al menos nombre o número
      const telefonosValidos = telefonosEmergencia.filter(
        tel => tel.nombre.trim() !== '' || tel.numero.trim() !== ''
      )

      const result = await editarAlumno({
        id: alumno.id,
        ...formData,
        telefonos_emergencia: telefonosValidos
      })

      if (result.success) {
        alert('Alumno actualizado exitosamente')
        onOpenChange(false)
        onSuccess?.()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar alumno')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof Omit<EditarAlumnoData, 'id'>, value: string) => {
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

  if (!alumno) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Alumno</DialogTitle>
          <DialogDescription>
            Modifica la información del alumno {alumno.profiles.nombre} {alumno.profiles.apellidos}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Información Personal */}
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-apellidos">Apellidos *</Label>
              <Input
                id="edit-apellidos"
                value={formData.apellidos}
                onChange={(e) => handleChange('apellidos', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Matrícula */}
            <div className="space-y-2">
              <Label htmlFor="edit-matricula">Matrícula *</Label>
              <Input
                id="edit-matricula"
                value={formData.matricula}
                onChange={(e) => handleChange('matricula', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-2">
              <Label htmlFor="edit-fecha-nacimiento">Fecha de Nacimiento</Label>
              <Input
                id="edit-fecha-nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => handleChange('fecha_nacimiento', e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Grado */}
            <div className="space-y-2">
              <Label htmlFor="edit-grado">Grado *</Label>
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
              <Label htmlFor="edit-grupo">Grupo *</Label>
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
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input
                id="edit-telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleChange('telefono', e.target.value)}
                placeholder="555-1234567"
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* CURP */}
            <div className="space-y-2">
              <Label htmlFor="edit-curp">CURP</Label>
              <Input
                id="edit-curp"
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
              <Label htmlFor="edit-nombre-tutor">Nombre del Padre/Tutor</Label>
              <Input
                id="edit-nombre-tutor"
                value={formData.nombre_tutor}
                onChange={(e) => handleChange('nombre_tutor', e.target.value)}
                placeholder="Nombre completo del tutor"
                disabled={loading}
              />
            </div>
          </div>

          {/* Información Médica */}
          <div className="space-y-2">
            <Label htmlFor="edit-informacion-medica">Información Médica Indispensable</Label>
            <Textarea
              id="edit-informacion-medica"
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
