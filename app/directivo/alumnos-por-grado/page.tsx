'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { obtenerAlumnosPorGradoGrupo } from '@/app/actions/usuarios-actions'
import { Alumno } from '@/app/types/usuarios'
import { obtenerGrados, obtenerGrupos, type Grado, type Grupo } from '@/app/actions/grados-grupos-actions'
import { Loader2, GraduationCap, Users, ArrowLeft, Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AlumnosPorGradoPage() {
  const router = useRouter()
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [grados, setGrados] = useState<Grado[]>([])
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)

  const [gradoFiltro, setGradoFiltro] = useState<string>('todos')
  const [grupoFiltro, setGrupoFiltro] = useState<string>('todos')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)

    // Cargar todos los alumnos
    const alumnosResult = await obtenerAlumnosPorGradoGrupo()
    if (alumnosResult.success) {
      setAlumnos(alumnosResult.data)
    }

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

    setLoading(false)
  }

  const alumnosFiltrados = useMemo(() => {
    let resultado = alumnos

    if (gradoFiltro !== 'todos') {
      resultado = resultado.filter(a => a.grado === gradoFiltro)
    }

    if (grupoFiltro !== 'todos') {
      resultado = resultado.filter(a => a.grupo === grupoFiltro)
    }

    return resultado
  }, [alumnos, gradoFiltro, grupoFiltro])

  // Agrupar alumnos por grado y grupo
  const alumnosPorGradoGrupo = useMemo(() => {
    const agrupados: Record<string, Record<string, Alumno[]>> = {}

    alumnosFiltrados.forEach(alumno => {
      if (!agrupados[alumno.grado]) {
        agrupados[alumno.grado] = {}
      }
      if (!agrupados[alumno.grado][alumno.grupo]) {
        agrupados[alumno.grado][alumno.grupo] = []
      }
      agrupados[alumno.grado][alumno.grupo].push(alumno)
    })

    return agrupados
  }, [alumnosFiltrados])

  const limpiarFiltros = () => {
    setGradoFiltro('todos')
    setGrupoFiltro('todos')
  }

  const hayFiltrosActivos = gradoFiltro !== 'todos' || grupoFiltro !== 'todos'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando alumnos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/directivo')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Alumnos por Grado y Grupo
              </h1>
              <p className="text-gray-600">
                Vista organizada de todos los alumnos inscritos
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Grado
                </label>
                <Select value={gradoFiltro} onValueChange={setGradoFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los grados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los grados</SelectItem>
                    {grados.map((grado) => (
                      <SelectItem key={grado.id} value={grado.nombre_completo}>
                        {grado.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Grupo
                </label>
                <Select value={grupoFiltro} onValueChange={setGrupoFiltro}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los grupos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los grupos</SelectItem>
                    {grupos.map((grupo) => (
                      <SelectItem key={grupo.id} value={grupo.nombre}>
                        {grupo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hayFiltrosActivos && (
                <Button variant="outline" onClick={limpiarFiltros}>
                  Limpiar filtros
                </Button>
              )}
            </div>

            <div className="mt-4 text-sm text-gray-600">
              Mostrando {alumnosFiltrados.length} de {alumnos.length} alumnos
            </div>
          </CardContent>
        </Card>

        {/* Alumnos agrupados */}
        <div className="space-y-6">
          {Object.keys(alumnosPorGradoGrupo).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No hay alumnos con los filtros seleccionados</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(alumnosPorGradoGrupo).map(([grado, grupos]) => (
              <div key={grado}>
                {Object.entries(grupos).map(([grupo, alumnos]) => (
                  <Card key={`${grado}-${grupo}`} className="mb-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5" />
                            {grado} - Grupo {grupo}
                          </CardTitle>
                          <CardDescription>
                            {alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''} inscrito{alumnos.length !== 1 ? 's' : ''}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-lg px-3 py-1">
                          {alumnos.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Matrícula</TableHead>
                              <TableHead>Nombre Completo</TableHead>
                              <TableHead>CURP</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Estado</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {alumnos.map((alumno) => (
                              <TableRow key={alumno.id}>
                                <TableCell className="font-medium">
                                  <Badge variant="outline">{alumno.matricula}</Badge>
                                </TableCell>
                                <TableCell>
                                  {alumno.profiles.nombre} {alumno.profiles.apellidos}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 font-mono">
                                  {alumno.curp || '-'}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                  {alumno.profiles.email}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={alumno.profiles.activo ? 'default' : 'secondary'}>
                                    {alumno.profiles.activo ? 'Activo' : 'Inactivo'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
