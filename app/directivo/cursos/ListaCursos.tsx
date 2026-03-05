'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { obtenerCursos, eliminarCurso } from '@/app/actions/cursos-actions'
import { Loader2, BookOpen, Users, Pencil, Trash2, UserPlus, Search, X, Eye } from 'lucide-react'
import { DialogoInscribirAlumnos } from './DialogoInscribirAlumnos'
import { DialogoEditarCurso } from './DialogoEditarCurso'
import { DialogoConfirmarEliminacion } from '../usuarios/DialogoConfirmarEliminacion'

interface Curso {
  id: string
  nombre: string
  descripcion: string | null
  grado: string
  grupo: string
  maestro_id: string
  maestro_profiles: {
    id: string
    nombre: string
    apellidos: string
    email: string
    activo: boolean
  } | null
}

export function ListaCursos() {
  const router = useRouter()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de búsqueda y filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroGrado, setFiltroGrado] = useState('todos')
  const [filtroGrupo, setFiltroGrupo] = useState('todos')

  // Estados para inscribir alumnos
  const [cursoInscribir, setCursoInscribir] = useState<Curso | null>(null)
  const [dialogoInscribirAbierto, setDialogoInscribirAbierto] = useState(false)

  // Estados para editar
  const [cursoEditar, setCursoEditar] = useState<Curso | null>(null)
  const [dialogoEditarAbierto, setDialogoEditarAbierto] = useState(false)

  // Estados para eliminar
  const [cursoEliminar, setCursoEliminar] = useState<Curso | null>(null)
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false)
  const [loadingEliminar, setLoadingEliminar] = useState(false)

  useEffect(() => {
    cargarCursos()
  }, [])

  // Extraer valores únicos de grado y grupo para los filtros
  const gradosUnicos = useMemo(() => {
    const grados = [...new Set(cursos.map(c => c.grado))].sort()
    return grados
  }, [cursos])

  const gruposUnicos = useMemo(() => {
    const grupos = [...new Set(cursos.map(c => c.grupo))].sort()
    return grupos
  }, [cursos])

  // Filtrar cursos según búsqueda y filtros
  const cursosFiltrados = useMemo(() => {
    return cursos.filter(curso => {
      // Filtrar por texto de búsqueda (materia/nombre del curso o maestro)
      const textoBusqueda = busqueda.toLowerCase().trim()
      if (textoBusqueda) {
        const nombreCurso = curso.nombre.toLowerCase()
        const descripcion = (curso.descripcion || '').toLowerCase()
        const nombreMaestro = curso.maestro_profiles
          ? `${curso.maestro_profiles.nombre} ${curso.maestro_profiles.apellidos}`.toLowerCase()
          : ''
        const emailMaestro = (curso.maestro_profiles?.email || '').toLowerCase()

        const coincide =
          nombreCurso.includes(textoBusqueda) ||
          descripcion.includes(textoBusqueda) ||
          nombreMaestro.includes(textoBusqueda) ||
          emailMaestro.includes(textoBusqueda)

        if (!coincide) return false
      }

      // Filtrar por grado
      if (filtroGrado !== 'todos' && curso.grado !== filtroGrado) return false

      // Filtrar por grupo
      if (filtroGrupo !== 'todos' && curso.grupo !== filtroGrupo) return false

      return true
    })
  }, [cursos, busqueda, filtroGrado, filtroGrupo])

  const hayFiltrosActivos = busqueda !== '' || filtroGrado !== 'todos' || filtroGrupo !== 'todos'

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroGrado('todos')
    setFiltroGrupo('todos')
  }

  const cargarCursos = async () => {
    console.log('[ListaCursos] Iniciando carga de cursos...')
    setLoading(true)
    const result = await obtenerCursos()
    console.log('[ListaCursos] Resultado:', result)
    if (result.success) {
      console.log('[ListaCursos] Cursos recibidos:', result.data.length, 'cursos')
      setCursos(result.data)
    } else {
      console.error('[ListaCursos] Error al cargar cursos:', result.error)
      alert('Error al cargar cursos: ' + result.error)
    }
    setLoading(false)
  }

  const handleInscribir = (curso: Curso) => {
    setCursoInscribir(curso)
    setDialogoInscribirAbierto(true)
  }

  const handleEditar = (curso: Curso) => {
    setCursoEditar(curso)
    setDialogoEditarAbierto(true)
  }

  const handleEliminar = (curso: Curso) => {
    setCursoEliminar(curso)
    setDialogoEliminarAbierto(true)
  }

  const handleConfirmarEliminar = async () => {
    if (!cursoEliminar) return

    setLoadingEliminar(true)
    try {
      const result = await eliminarCurso(cursoEliminar.id)

      if (result.success) {
        alert('Curso eliminado exitosamente')
        setDialogoEliminarAbierto(false)
        cargarCursos()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar curso')
    } finally {
      setLoadingEliminar(false)
    }
  }

  const handleSuccess = () => {
    cargarCursos()
  }

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
            <BookOpen className="h-5 w-5" />
            Lista de Cursos
          </CardTitle>
          <CardDescription>
            {hayFiltrosActivos
              ? `Mostrando ${cursosFiltrados.length} de ${cursos.length} curso${cursos.length !== 1 ? 's' : ''}`
              : `${cursos.length} curso${cursos.length !== 1 ? 's' : ''} registrado${cursos.length !== 1 ? 's' : ''}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barra de búsqueda y filtros */}
          {cursos.length > 0 && (
            <div className="mb-6 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Buscador por texto */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por materia o maestro..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Filtro de Grado */}
                <Select value={filtroGrado} onValueChange={setFiltroGrado}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Grado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los grados</SelectItem>
                    {gradosUnicos.map(grado => (
                      <SelectItem key={grado} value={grado}>
                        {grado}° Grado
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro de Grupo */}
                <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los grupos</SelectItem>
                    {gruposUnicos.map(grupo => (
                      <SelectItem key={grupo} value={grupo}>
                        Grupo {grupo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Botón limpiar filtros */}
                {hayFiltrosActivos && (
                  <Button variant="ghost" size="icon" onClick={limpiarFiltros} title="Limpiar filtros">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {cursos.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay cursos registrados</p>
              <p className="text-sm text-gray-400 mt-2">
                Usa el formulario de arriba para crear el primer curso
              </p>
            </div>
          ) : cursosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No se encontraron cursos con los filtros aplicados</p>
              <Button variant="link" onClick={limpiarFiltros} className="mt-2">
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Grado y Grupo</TableHead>
                    <TableHead>Maestro</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursosFiltrados.map((curso) => (
                    <TableRow key={curso.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{curso.nombre}</p>
                          {curso.descripcion && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {curso.descripcion}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {curso.grado}° {curso.grupo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {curso.maestro_profiles ? (
                          <div>
                            <p className="text-sm font-medium">
                              {curso.maestro_profiles.nombre} {curso.maestro_profiles.apellidos}
                            </p>
                            <p className="text-xs text-gray-500">
                              {curso.maestro_profiles.email}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-gray-400">
                              Maestro no encontrado
                            </p>
                            <p className="text-xs text-red-500">
                              ID: {curso.maestro_id}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {curso.maestro_profiles ? (
                          <Badge variant={curso.maestro_profiles.activo ? 'default' : 'secondary'}>
                            {curso.maestro_profiles.activo ? 'Activo' : 'Maestro Inactivo'}
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Maestro Eliminado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex flex-col h-auto py-2 px-2 text-blue-600 hover:bg-blue-50"
                            onClick={() => router.push(`/directivo/cursos/${curso.id}`)}
                            title="Ver detalles del curso"
                          >
                            <Eye className="h-4 w-4 mb-1" />
                            <span className="text-[10px] uppercase font-semibold">Detalles</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex flex-col h-auto py-2 px-2 text-green-600 hover:bg-green-50"
                            onClick={() => handleInscribir(curso)}
                            title="Inscribir alumnos"
                          >
                            <UserPlus className="h-4 w-4 mb-1" />
                            <span className="text-[10px] uppercase font-semibold">Inscribir</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex flex-col h-auto py-2 px-2 text-gray-600 hover:bg-gray-100"
                            onClick={() => handleEditar(curso)}
                            title="Editar curso"
                          >
                            <Pencil className="h-4 w-4 mb-1" />
                            <span className="text-[10px] uppercase font-semibold">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex flex-col h-auto py-2 px-2 text-red-600 hover:bg-red-50"
                            onClick={() => handleEliminar(curso)}
                            title="Eliminar curso"
                          >
                            <Trash2 className="h-4 w-4 mb-1" />
                            <span className="text-[10px] uppercase font-semibold">Eliminar</span>
                          </Button>
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

      {/* Diálogo de inscribir alumnos */}
      <DialogoInscribirAlumnos
        curso={cursoInscribir}
        open={dialogoInscribirAbierto}
        onOpenChange={setDialogoInscribirAbierto}
        onSuccess={handleSuccess}
      />

      {/* Diálogo de editar curso */}
      <DialogoEditarCurso
        curso={cursoEditar}
        open={dialogoEditarAbierto}
        onOpenChange={setDialogoEditarAbierto}
        onSuccess={handleSuccess}
      />

      {/* Diálogo de confirmar eliminación */}
      <DialogoConfirmarEliminacion
        open={dialogoEliminarAbierto}
        onOpenChange={setDialogoEliminarAbierto}
        onConfirm={handleConfirmarEliminar}
        titulo="¿Eliminar curso?"
        descripcion={`¿Estás seguro de que deseas eliminar el curso "${cursoEliminar?.nombre}"? Esta acción eliminará también todas las inscripciones. No se puede eliminar si tiene tareas asociadas.`}
        loading={loadingEliminar}
      />
    </>
  )
}
