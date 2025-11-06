'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { obtenerAlumnos, desactivarAlumno, reactivarAlumno, type Alumno } from '@/app/actions/usuarios-actions'
import { Loader2, Users, Pencil, Trash2, RefreshCw, Search, Filter, X } from 'lucide-react'
import { DialogoEditarAlumno } from './DialogoEditarAlumno'
import { DialogoConfirmarEliminacion } from './DialogoConfirmarEliminacion'

export function ListaAlumnos() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [alumnoEditar, setAlumnoEditar] = useState<Alumno | null>(null)
  const [dialogoEditarAbierto, setDialogoEditarAbierto] = useState(false)
  const [alumnoEliminar, setAlumnoEliminar] = useState<Alumno | null>(null)
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false)
  const [loadingEliminar, setLoadingEliminar] = useState(false)

  // Estados para búsqueda y filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroGrado, setFiltroGrado] = useState<string>('todos')
  const [filtroGrupo, setFiltroGrupo] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const cargarAlumnos = async () => {
    setLoading(true)
    const result = await obtenerAlumnos()
    if (result.success) {
      setAlumnos(result.data)
    } else {
      console.error('Error al cargar alumnos:', result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarAlumnos()
  }, [])

  const handleEditar = (alumno: Alumno) => {
    setAlumnoEditar(alumno)
    setDialogoEditarAbierto(true)
  }

  const handleEliminar = (alumno: Alumno) => {
    setAlumnoEliminar(alumno)
    setDialogoEliminarAbierto(true)
  }

  const handleConfirmarEliminar = async () => {
    if (!alumnoEliminar) return

    setLoadingEliminar(true)
    try {
      const result = await desactivarAlumno(alumnoEliminar.id)

      if (result.success) {
        alert('Alumno desactivado exitosamente')
        setDialogoEliminarAbierto(false)
        cargarAlumnos()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al desactivar alumno')
    } finally {
      setLoadingEliminar(false)
    }
  }

  const handleReactivar = async (alumno: Alumno) => {
    try {
      const result = await reactivarAlumno(alumno.id)

      if (result.success) {
        alert('Alumno reactivado exitosamente')
        cargarAlumnos()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al reactivar alumno')
    }
  }

  const handleSuccess = () => {
    cargarAlumnos()
  }

  // Filtrar y buscar alumnos
  const alumnosFiltrados = useMemo(() => {
    let resultado = alumnos

    // Filtrar por búsqueda (matrícula o nombre)
    if (busqueda.trim() !== '') {
      const busquedaLower = busqueda.toLowerCase()
      resultado = resultado.filter(alumno =>
        alumno.matricula.toLowerCase().includes(busquedaLower) ||
        alumno.profiles.nombre.toLowerCase().includes(busquedaLower) ||
        alumno.profiles.apellidos.toLowerCase().includes(busquedaLower) ||
        `${alumno.profiles.nombre} ${alumno.profiles.apellidos}`.toLowerCase().includes(busquedaLower)
      )
    }

    // Filtrar por grado
    if (filtroGrado !== 'todos') {
      resultado = resultado.filter(alumno => alumno.grado === filtroGrado)
    }

    // Filtrar por grupo
    if (filtroGrupo !== 'todos') {
      resultado = resultado.filter(alumno => alumno.grupo === filtroGrupo)
    }

    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      const activoFiltro = filtroEstado === 'activo'
      resultado = resultado.filter(alumno => alumno.profiles.activo === activoFiltro)
    }

    return resultado
  }, [alumnos, busqueda, filtroGrado, filtroGrupo, filtroEstado])

  // Obtener grados únicos
  const gradosDisponibles = useMemo(() => {
    const grados = new Set(alumnos.map(a => a.grado))
    return Array.from(grados).sort()
  }, [alumnos])

  // Obtener grupos únicos
  const gruposDisponibles = useMemo(() => {
    const grupos = new Set(alumnos.map(a => a.grupo))
    return Array.from(grupos).sort()
  }, [alumnos])

  // Limpiar filtros
  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroGrado('todos')
    setFiltroGrupo('todos')
    setFiltroEstado('todos')
  }

  // Verificar si hay filtros activos
  const hayFiltrosActivos = busqueda !== '' || filtroGrado !== 'todos' || filtroGrupo !== 'todos' || filtroEstado !== 'todos'

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
            <Users className="h-5 w-5" />
            Lista de Alumnos
          </CardTitle>
          <CardDescription>
            {alumnosFiltrados.length} de {alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barra de búsqueda y filtros */}
          <div className="space-y-4 mb-6">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por matrícula o nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Grado
                </label>
                <Select value={filtroGrado} onValueChange={setFiltroGrado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los grados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los grados</SelectItem>
                    {gradosDisponibles.map(grado => (
                      <SelectItem key={grado} value={grado}>{grado}°</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Grupo
                </label>
                <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los grupos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los grupos</SelectItem>
                    {gruposDisponibles.map(grupo => (
                      <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[150px]">
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
          {alumnos.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay alumnos registrados</p>
              <p className="text-sm text-gray-400 mt-2">
                Usa el formulario de arriba para agregar el primer alumno
              </p>
            </div>
          ) : alumnosFiltrados.length === 0 ? (
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
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>CURP</TableHead>
                    <TableHead>Grado</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alumnosFiltrados.map((alumno) => (
                    <TableRow key={alumno.id} className={!alumno.profiles.activo ? 'opacity-60' : ''}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{alumno.matricula}</Badge>
                      </TableCell>
                      <TableCell>
                        {alumno.profiles.nombre} {alumno.profiles.apellidos}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 font-mono">
                        {alumno.curp || '-'}
                      </TableCell>
                      <TableCell>{alumno.grado}°</TableCell>
                      <TableCell>{alumno.grupo}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {alumno.profiles.email}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {alumno.profiles.telefono || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={alumno.profiles.activo ? 'default' : 'secondary'}>
                          {alumno.profiles.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditar(alumno)}
                            disabled={!alumno.profiles.activo}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {alumno.profiles.activo ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminar(alumno)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReactivar(alumno)}
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

      <DialogoEditarAlumno
        alumno={alumnoEditar}
        open={dialogoEditarAbierto}
        onOpenChange={setDialogoEditarAbierto}
        onSuccess={handleSuccess}
      />

      <DialogoConfirmarEliminacion
        open={dialogoEliminarAbierto}
        onOpenChange={setDialogoEliminarAbierto}
        onConfirm={handleConfirmarEliminar}
        titulo="¿Eliminar alumno?"
        descripcion={`¿Estás seguro de que deseas desactivar al alumno ${alumnoEliminar?.profiles.nombre} ${alumnoEliminar?.profiles.apellidos}? Esta acción no eliminará los datos permanentemente, pero el alumno no podrá acceder al sistema.`}
        loading={loadingEliminar}
      />
    </>
  )
}
