'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { obtenerPadresYDirectivos, desactivarPadre, reactivarPadre } from '@/app/actions/usuarios-actions'
import { Loader2, Users, Pencil, Trash2, RefreshCw, Search, Filter, X, Key } from 'lucide-react'
import { DialogoEditarPadre } from './DialogoEditarPadre'
import { DialogoConfirmarEliminacion } from './DialogoConfirmarEliminacion'
import { DialogoRestablecerPassword } from './DialogoRestablecerPassword'

interface Usuario {
  id: string
  nombre: string
  apellidos: string
  email: string
  telefono?: string
  role: string
  activo: boolean
}

export function ListaPadres() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [padreEditar, setPadreEditar] = useState<Usuario | null>(null)
  const [dialogoEditarAbierto, setDialogoEditarAbierto] = useState(false)
  const [padreEliminar, setPadreEliminar] = useState<Usuario | null>(null)
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false)
  const [padrePassword, setPadrePassword] = useState<Usuario | null>(null)
  const [dialogoPasswordAbierto, setDialogoPasswordAbierto] = useState(false)
  const [loadingEliminar, setLoadingEliminar] = useState(false)

  // Estados para búsqueda y filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const cargarUsuarios = async () => {
    setLoading(true)
    const result = await obtenerPadresYDirectivos()
    if (result.success) {
      setUsuarios(result.data)
    } else {
      console.error('Error al cargar usuarios:', result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const handleEditar = (padre: Usuario) => {
    setPadreEditar(padre)
    setDialogoEditarAbierto(true)
  }

  const handlePassword = (padre: Usuario) => {
    setPadrePassword(padre)
    setDialogoPasswordAbierto(true)
  }

  const handleEliminar = (padre: Usuario) => {
    setPadreEliminar(padre)
    setDialogoEliminarAbierto(true)
  }

  const handleConfirmarEliminar = async () => {
    if (!padreEliminar) return

    setLoadingEliminar(true)
    try {
      const result = await desactivarPadre(padreEliminar.id)

      if (result.success) {
        alert('Padre desactivado exitosamente')
        setDialogoEliminarAbierto(false)
        cargarUsuarios()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al desactivar padre')
    } finally {
      setLoadingEliminar(false)
    }
  }

  const handleReactivar = async (padre: Usuario) => {
    try {
      const result = await reactivarPadre(padre.id)

      if (result.success) {
        alert('Padre reactivado exitosamente')
        cargarUsuarios()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al reactivar padre')
    }
  }

  const handleSuccess = () => {
    cargarUsuarios()
  }

  const padres = usuarios.filter(u => u.role === 'padre')
  const directivos = usuarios.filter(u => u.role === 'directivo')

  // Filtrar padres según búsqueda y filtros
  const padresFiltrados = useMemo(() => {
    let resultado = padres

    // Filtrar por búsqueda (nombre o email)
    if (busqueda.trim() !== '') {
      const busquedaLower = busqueda.toLowerCase()
      resultado = resultado.filter(padre =>
        padre.nombre.toLowerCase().includes(busquedaLower) ||
        padre.apellidos.toLowerCase().includes(busquedaLower) ||
        `${padre.nombre} ${padre.apellidos}`.toLowerCase().includes(busquedaLower) ||
        padre.email.toLowerCase().includes(busquedaLower)
      )
    }

    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      const activo = filtroEstado === 'activo'
      resultado = resultado.filter(padre => padre.activo === activo)
    }

    return resultado
  }, [padres, busqueda, filtroEstado])

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
      <div className="space-y-6">
        {/* Lista de Directivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Directivos
            </CardTitle>
            <CardDescription>
              {directivos.length} directivo{directivos.length !== 1 ? 's' : ''} en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {directivos.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay directivos registrados</p>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {directivos.map((usuario) => (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">
                          {usuario.nombre} {usuario.apellidos}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {usuario.email}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {usuario.telefono || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={usuario.activo ? 'default' : 'secondary'}>
                            {usuario.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Padres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Padres/Tutores
            </CardTitle>
            <CardDescription>
              {padresFiltrados.length} de {padres.length} padre{padres.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Barra de búsqueda y filtros */}
            {padres.length > 0 && (
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
            )}

            {padres.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay padres registrados</p>
                <p className="text-sm text-gray-400 mt-2">
                  Usa el formulario de arriba para agregar el primer padre
                </p>
              </div>
            ) : padresFiltrados.length === 0 ? (
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
                    {padresFiltrados.map((padre) => (
                      <TableRow key={padre.id} className={!padre.activo ? 'opacity-60' : ''}>
                        <TableCell className="font-medium">
                          {padre.nombre} {padre.apellidos}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {padre.email}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {padre.telefono || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={padre.activo ? 'default' : 'secondary'}>
                            {padre.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePassword(padre)}
                              disabled={!padre.activo}
                              title="Restablecer Contraseña"
                            >
                              <Key className="h-4 w-4 text-amber-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditar(padre)}
                              disabled={!padre.activo}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {padre.activo ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEliminar(padre)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReactivar(padre)}
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
      </div>

      <DialogoRestablecerPassword
        usuario={padrePassword ? { ...padrePassword, user_id: padrePassword.id } : null}
        open={dialogoPasswordAbierto}
        onOpenChange={setDialogoPasswordAbierto}
        onSuccess={() => alert('Contraseña actualizada correctamente')}
      />

      <DialogoEditarPadre
        padre={padreEditar}
        open={dialogoEditarAbierto}
        onOpenChange={setDialogoEditarAbierto}
        onSuccess={handleSuccess}
      />

      <DialogoConfirmarEliminacion
        open={dialogoEliminarAbierto}
        onOpenChange={setDialogoEliminarAbierto}
        onConfirm={handleConfirmarEliminar}
        titulo="¿Eliminar padre?"
        descripcion={`¿Estás seguro de que deseas desactivar al padre ${padreEliminar?.nombre} ${padreEliminar?.apellidos}? Esta acción no eliminará los datos permanentemente, pero el padre no podrá acceder al sistema.`}
        loading={loadingEliminar}
      />
    </>
  )
}
