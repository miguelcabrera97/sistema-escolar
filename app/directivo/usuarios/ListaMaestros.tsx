'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { obtenerMaestros, desactivarMaestro, reactivarMaestro } from '@/app/actions/usuarios-actions'
import { Loader2, GraduationCap, Pencil, Trash2, RefreshCw, Search, Filter, X, Key } from 'lucide-react'
import { DialogoEditarMaestro } from './DialogoEditarMaestro'
import { DialogoConfirmarEliminacion } from './DialogoConfirmarEliminacion'
import { DialogoRestablecerPassword } from './DialogoRestablecerPassword'

import { type Maestro } from '@/app/types/usuarios'

export function ListaMaestros() {
  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [loading, setLoading] = useState(true)
  const [maestroEditar, setMaestroEditar] = useState<Maestro | null>(null)
  const [dialogoEditarAbierto, setDialogoEditarAbierto] = useState(false)
  const [maestroEliminar, setMaestroEliminar] = useState<Maestro | null>(null)
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false)
  const [maestroPassword, setMaestroPassword] = useState<Maestro | null>(null)
  const [dialogoPasswordAbierto, setDialogoPasswordAbierto] = useState(false)
  const [loadingEliminar, setLoadingEliminar] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const cargarMaestros = async () => {
    setLoading(true)
    const result = await obtenerMaestros()
    if (result.success) {
      setMaestros(result.data)
    } else {
      console.error('Error al cargar maestros:', result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarMaestros()
  }, [])

  const handleEditar = (maestro: Maestro) => {
    setMaestroEditar(maestro)
    setDialogoEditarAbierto(true)
  }

  const handlePassword = (maestro: Maestro) => {
    setMaestroPassword(maestro)
    setDialogoPasswordAbierto(true)
  }

  const handleEliminar = (maestro: Maestro) => {
    setMaestroEliminar(maestro)
    setDialogoEliminarAbierto(true)
  }

  const handleConfirmarEliminar = async () => {
    if (!maestroEliminar) return

    setLoadingEliminar(true)
    try {
      const result = await desactivarMaestro(maestroEliminar.id)

      if (result.success) {
        alert('Maestro desactivado exitosamente')
        setDialogoEliminarAbierto(false)
        cargarMaestros()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al desactivar maestro')
    } finally {
      setLoadingEliminar(false)
    }
  }

  const handleReactivar = async (maestro: Maestro) => {
    try {
      const result = await reactivarMaestro(maestro.id)

      if (result.success) {
        alert('Maestro reactivado exitosamente')
        cargarMaestros()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al reactivar maestro')
    }
  }

  const handleSuccess = () => {
    cargarMaestros()
  }

  // Filtrar y buscar maestros
  const maestrosFiltrados = useMemo(() => {
    let resultado = maestros

    // Filtrar por búsqueda (nombre o email)
    if (busqueda.trim() !== '') {
      const busquedaLower = busqueda.toLowerCase()
      resultado = resultado.filter(maestro =>
        maestro.nombre.toLowerCase().includes(busquedaLower) ||
        maestro.apellidos.toLowerCase().includes(busquedaLower) ||
        `${maestro.nombre} ${maestro.apellidos}`.toLowerCase().includes(busquedaLower) ||
        maestro.email.toLowerCase().includes(busquedaLower)
      )
    }

    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      const activo = filtroEstado === 'activo'
      resultado = resultado.filter(maestro => maestro.activo === activo)
    }

    return resultado
  }, [maestros, busqueda, filtroEstado])

  // Limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroEstado('todos')
  }

  // Verificar si hay filtros activos
  const hayFiltrosActivos = busqueda !== '' || filtroEstado !== 'todos'

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Lista de Maestros
          </CardTitle>
          <CardDescription>
            {maestrosFiltrados.length} de {maestros.length} maestro{maestros.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barra de búsqueda y filtros */}
          <div className="space-y-4 mb-6">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o email..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Estado
                </label>
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activo">Activos</SelectItem>
                    <SelectItem value="inactivo">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hayFiltrosActivos && (
                <Button
                  variant="outline"
                  onClick={limpiarFiltros}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
          {maestros.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay maestros registrados</p>
              <p className="text-sm text-gray-400 mt-2">
                Usa el formulario de arriba para agregar el primer maestro
              </p>
            </div>
          ) : maestrosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No se encontraron resultados</p>
              <p className="text-sm text-gray-400 mt-2">
                Intenta ajustar los filtros de búsqueda
              </p>
              <Button
                variant="outline"
                onClick={limpiarFiltros}
                className="mt-4"
              >
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maestrosFiltrados.map((maestro) => (
                    <TableRow key={maestro.id} className={!maestro.activo ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">
                        {maestro.nombre} {maestro.apellidos}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {maestro.email}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {maestro.telefono || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={maestro.activo ? 'default' : 'secondary'}>
                          {maestro.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePassword(maestro)}
                            disabled={!maestro.activo}
                            title="Restablecer Contraseña"
                          >
                            <Key className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditar(maestro)}
                            disabled={!maestro.activo}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {maestro.activo ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminar(maestro)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReactivar(maestro)}
                            >
                              <RefreshCw className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogoRestablecerPassword
        usuario={maestroPassword ? {
          user_id: maestroPassword.user_id,
          nombre: maestroPassword.nombre,
          apellidos: maestroPassword.apellidos,
          email: maestroPassword.email
        } : null}
        open={dialogoPasswordAbierto}
        onOpenChange={setDialogoPasswordAbierto}
        onSuccess={() => alert('Contraseña actualizada correctamente')}
      />

      <DialogoEditarMaestro
        maestro={maestroEditar}
        open={dialogoEditarAbierto}
        onOpenChange={setDialogoEditarAbierto}
        onSuccess={handleSuccess}
      />

      <DialogoConfirmarEliminacion
        open={dialogoEliminarAbierto}
        onOpenChange={setDialogoEliminarAbierto}
        onConfirm={handleConfirmarEliminar}
        titulo="¿Eliminar maestro?"
        descripcion={`¿Estás seguro de que deseas desactivar al maestro ${maestroEliminar?.nombre} ${maestroEliminar?.apellidos}? Esta acción no eliminará los datos permanentemente, pero el maestro no podrá acceder al sistema.`}
        loading={loadingEliminar}
      />
    </>
  )
}
