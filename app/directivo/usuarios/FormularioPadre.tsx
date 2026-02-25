'use client'

import { useActionState } from 'react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { crearPadreODirectivo } from '@/app/actions/usuarios-actions'

const initialState: any = { success: false, errors: {} }

export function FormularioPadre() {
  const [state, formAction] = useActionState(crearPadreODirectivo, initialState)
  const [rolSeleccionado, setRolSeleccionado] = useState<string>('padre')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (state.success) {
      alert(state.message)
      // Resetear formulario
      setRolSeleccionado('padre')
      window.location.reload()
    }
  }, [state.success, state.message])

  const handleSubmit = (formData: FormData) => {
    setIsLoading(true)
    formAction(formData)
    setIsLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Padre o Directivo</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="role" value={rolSeleccionado} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rol */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="role">Rol *</Label>
              <Select value={rolSeleccionado} onValueChange={setRolSeleccionado} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="padre">Padre/Tutor</SelectItem>
                  <SelectItem value="directivo">Directivo</SelectItem>
                </SelectContent>
              </Select>
              {state.errors?.role && (
                <p className="text-red-500 text-xs">{state.errors.role}</p>
              )}
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                name="nombre"
                placeholder="Nombre"
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
                placeholder="Apellidos"
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
                placeholder="correo@ejemplo.com"
                required
              />
              {state.errors?.email && (
                <p className="text-red-500 text-xs">{state.errors.email}</p>
              )}
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                type="tel"
                placeholder="1234567890"
              />
              {state.errors?.telefono && (
                <p className="text-red-500 text-xs">{state.errors.telefono}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2 md:col-span-2">
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
          </div>

          {/* Error general */}
          {state.errors?._form && (
            <div className="p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600 text-sm">{state.errors._form}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creando...' : `Crear ${rolSeleccionado === 'padre' ? 'Padre' : 'Directivo'}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
