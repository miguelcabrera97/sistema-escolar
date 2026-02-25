'use client'

import { useActionState } from 'react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { crearAlumno, editarAlumno, getPadres } from '@/app/actions/usuarios-actions'
import { obtenerGrados, obtenerGrupos, type Grado, type Grupo } from '@/app/actions/grados-grupos-actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FormularioAlumnoProps {
  alumno?: {
    id: string
    matricula: string
    grado: string
    grupo: string
    curp?: string
    profiles: {
      nombre: string
      apellidos: string
      email: string
    }
    padre_alumno?: Array<{
      padre_id: string
      padres: {
        id: string
        user_id: string
        profiles: {
          nombre: string
          apellidos: string
        }
      }
    }>
  }
  onClose?: () => void
}

type Padre = {
  id: string
  nombre: string
  apellidos: string
}

const initialState: any = { success: false, errors: {} }

export function FormularioAlumno({ alumno, onClose }: FormularioAlumnoProps) {
  const action = alumno ? editarAlumno : crearAlumno
  const [state, formAction] = useActionState(action, initialState)
  const [padres, setPadres] = useState<Padre[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [padreSeleccionado, setPadreSeleccionado] = useState<string>('')
  const [gradoSeleccionado, setGradoSeleccionado] = useState<string>(alumno?.grado || '')
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>(alumno?.grupo || '')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadData() {
      console.log('[FormularioAlumno] Cargando datos...')

      // Cargar padres
      const padresData = await getPadres()
      console.log('[FormularioAlumno] Padres recibidos:', padresData)
      setPadres(padresData)

      // Cargar grados
      const gradosResult = await obtenerGrados()
      if (gradosResult.success) {
        setGrados(gradosResult.data)
      }

      // Cargar grupos
      const gruposResult = await obtenerGrupos()
      if (gruposResult.success) {
        setGrupos(gruposResult.data)
      }

      // Si estamos editando un alumno y tiene padre asignado, seleccionarlo
      if (alumno?.padre_alumno && alumno.padre_alumno.length > 0) {
        const padreActual = alumno.padre_alumno[0].padre_id
        console.log('[FormularioAlumno] Padre actual del alumno:', padreActual)
        setPadreSeleccionado(padreActual)
      }
    }
    loadData()
  }, [alumno])

  // Si state.success es true, cerrar el modal
  useEffect(() => {
    if (state.success) {
      alert(state.message)
      onClose?.()
    }
  }, [state.success, state.message, onClose])

  const handleSubmit = (formData: FormData) => {
    setIsLoading(true)
    formAction(formData)
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{alumno ? 'Editar Alumno' : 'Crear Nuevo Alumno'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {/* Campos ocultos */}
          {alumno && <input type="hidden" name="id" value={alumno.id} />}
          <input type="hidden" name="id_padre" value={padreSeleccionado} />
          <input type="hidden" name="grado" value={gradoSeleccionado} />
          <input type="hidden" name="grupo" value={grupoSeleccionado} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                name="nombre"
                defaultValue={alumno?.profiles.nombre}
                placeholder="Nombre del alumno"
                required
              />
              {state.errors?.nombre && (
                <p className="text-red-500 text-xs">{state.errors.nombre}</p>
              )}
            </div>

            {/* Apellidos */}
            <div className="space-y-2">
              <Label htmlFor="apellidos">Apellidos *</Label>
              <Input
                id="apellidos"
                name="apellidos"
                defaultValue={alumno?.profiles.apellidos}
                placeholder="Apellidos del alumno"
                required
              />
              {state.errors?.apellidos && (
                <p className="text-red-500 text-xs">{state.errors.apellidos}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={alumno?.profiles.email}
                placeholder="correo@ejemplo.com"
                required
              />
              {state.errors?.email && (
                <p className="text-red-500 text-xs">{state.errors.email}</p>
              )}
            </div>

            {/* Password (solo al crear) */}
            {!alumno && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                />
                {state.errors?.password && (
                  <p className="text-red-500 text-xs">{state.errors.password}</p>
                )}
              </div>
            )}

            {/* Matrícula */}
            <div className="space-y-2">
              <Label htmlFor="matricula">Matrícula *</Label>
              <Input
                id="matricula"
                name="matricula"
                defaultValue={alumno?.matricula}
                placeholder="Ej: 2024001"
                required
              />
              {state.errors?.matricula && (
                <p className="text-red-500 text-xs">{state.errors.matricula}</p>
              )}
            </div>

            {/* CURP */}
            <div className="space-y-2">
              <Label htmlFor="curp">CURP</Label>
              <Input
                id="curp"
                name="curp"
                defaultValue={alumno?.curp}
                placeholder="18 caracteres"
                maxLength={18}
                className="uppercase"
              />
              {state.errors?.curp && (
                <p className="text-red-500 text-xs">{state.errors.curp}</p>
              )}
            </div>

            {/* Grado */}
            <div className="space-y-2">
              <Label htmlFor="grado">Grado *</Label>
              <Select value={gradoSeleccionado} onValueChange={setGradoSeleccionado} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un grado" />
                </SelectTrigger>
                <SelectContent>
                  {grados.map((grado) => (
                    <SelectItem key={grado.id} value={grado.nombre_completo}>
                      {grado.nombre_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.grado && (
                <p className="text-red-500 text-xs">{state.errors.grado}</p>
              )}
            </div>

            {/* Grupo */}
            <div className="space-y-2">
              <Label htmlFor="grupo">Grupo *</Label>
              <Select value={grupoSeleccionado} onValueChange={setGrupoSeleccionado} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un grupo" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.nombre}>
                      {grupo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.errors?.grupo && (
                <p className="text-red-500 text-xs">{state.errors.grupo}</p>
              )}
            </div>

            {/* Padre Asignado */}
            <div className="space-y-2">
              <Label htmlFor="id_padre">Padre Asignado (Opcional)</Label>
              <Select value={padreSeleccionado || "none"} onValueChange={(value) => setPadreSeleccionado(value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin padre asignado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin padre asignado</SelectItem>
                  {padres.map((padre) => (
                    <SelectItem key={padre.id} value={padre.id}>
                      {padre.nombre} {padre.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error general */}
          {state.errors?._form && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600 text-sm">{state.errors._form}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : alumno ? 'Guardar Cambios' : 'Crear Alumno'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
