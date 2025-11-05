'use client'

import { useRef, useState } from 'react'
import { subirBoleta } from '@/app/actions/boletas-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alumno } from '@/app/actions/usuarios-actions'

interface FormularioSubirBoletaProps {
  alumnos: Alumno[]
  onBoletaSubida: () => void
}

export default function FormularioSubirBoleta({ alumnos, onBoletaSubida }: FormularioSubirBoletaProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Estados para los valores de los Select
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<string>('')
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<string>('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formRef.current) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(formRef.current)
    const result = await subirBoleta(formData)

    if (result.success) {
      setSuccess('Boleta subida exitosamente.')
      formRef.current.reset()
      setAlumnoSeleccionado('')
      setPeriodoSeleccionado('')
      onBoletaSubida() // Llamar a la función de callback
    } else {
      setError(result.error || 'Ocurrió un error inesperado.')
    }

    setIsSubmitting(false)
  }

  // Obtener el año actual para el ciclo escolar
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  const cicloEscolarDefault = `${currentYear}-${nextYear}`

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Nueva Boleta</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {/* Campos ocultos para enviar los valores de los Select */}
          <input type="hidden" name="alumno_id" value={alumnoSeleccionado} />
          <input type="hidden" name="periodo" value={periodoSeleccionado} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alumno_id">Alumno</Label>
              <Select value={alumnoSeleccionado} onValueChange={setAlumnoSeleccionado} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un alumno" />
                </SelectTrigger>
                <SelectContent>
                  {alumnos.map((alumno) => (
                    <SelectItem key={alumno.id} value={alumno.id}>
                      {`${alumno.profiles.nombre} ${alumno.profiles.apellidos} (${alumno.matricula})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodo">Periodo</Label>
              <Select value={periodoSeleccionado} onValueChange={setPeriodoSeleccionado} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primer Trimestre">Primer Trimestre</SelectItem>
                  <SelectItem value="Segundo Trimestre">Segundo Trimestre</SelectItem>
                  <SelectItem value="Tercer Trimestre">Tercer Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ciclo_escolar">Ciclo Escolar</Label>
              <Input
                id="ciclo_escolar"
                name="ciclo_escolar"
                defaultValue={cicloEscolarDefault}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="archivo">Archivo PDF</Label>
              <Input id="archivo" name="archivo" type="file" accept="application/pdf" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas">Notas (Opcional)</Label>
            <Textarea id="notas" name="notas" placeholder="Añadir notas o comentarios..." />
          </div>
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Subiendo...' : 'Subir Boleta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
