'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Search, User, Mail, Phone, MapPin, Users, BookOpen, Award } from 'lucide-react'

interface Profile {
  nombre: string
  apellidos: string
  email: string
  telefono: string | null
  direccion: string | null
  fecha_nacimiento: string | null
}

interface PadreProfile {
  nombre: string
  apellidos: string
  email: string
  telefono: string | null
}

interface Alumno {
  id: string
  user_id: string
  matricula: string
  grado: string
  grupo: string
  fecha_ingreso: string
  profiles: Profile
  padre_profiles: PadreProfile | null
}

interface Curso {
  id: string
  nombre: string
  descripcion: string
  maestro_profiles: {
    nombre: string
    apellidos: string
  }
}

interface Entrega {
  id: string
  calificacion: number | null
  status: string
  tareas: {
    id: string
    titulo: string
    puntos_maximos: number
    cursos: Curso
  }
}

interface CalificacionPorCurso {
  curso: Curso
  entregas: Array<{
    titulo: string
    calificacion: number
    puntos_maximos: number
  }>
  promedio: number
  totalTareas: number
  tareasCalificadas: number
}

export default function DirectivoAlumnos() {
  const router = useRouter()
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [alumnosFiltrados, setAlumnosFiltrados] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<Alumno | null>(null)
  const [calificaciones, setCalificaciones] = useState<CalificacionPorCurso[]>([])
  const [loadingCalificaciones, setLoadingCalificaciones] = useState(false)

  useEffect(() => {
    cargarAlumnos()
  }, [])

  useEffect(() => {
    filtrarAlumnos()
  }, [busqueda, alumnos])

  useEffect(() => {
    if (alumnoSeleccionado) {
      cargarCalificaciones(alumnoSeleccionado.id)
    }
  }, [alumnoSeleccionado])

  const cargarAlumnos = async () => {
    try {
      const { data: alumnosData } = await supabase
        .from('alumnos')
        .select(`
          *,
          profiles!alumnos_user_id_fkey(nombre, apellidos, email, telefono, direccion, fecha_nacimiento),
          padre_profiles:profiles!alumnos_padre_id_fkey(nombre, apellidos, email, telefono)
        `)
        .order('matricula')

      if (alumnosData) {
        setAlumnos(alumnosData)
        setAlumnosFiltrados(alumnosData)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const cargarCalificaciones = async (alumnoId: string) => {
    setLoadingCalificaciones(true)
    try {
      const { data: entregasData } = await supabase
        .from('entregas')
        .select(`
          id,
          calificacion,
          status,
          tareas (
            id,
            titulo,
            puntos_maximos,
            cursos (
              id,
              nombre,
              descripcion,
              maestro_profiles:profiles!cursos_maestro_id_fkey(nombre, apellidos)
            )
          )
        `)
        .eq('alumno_id', alumnoId)
        .eq('status', 'calificada')

      if (entregasData) {
        const calificacionesPorCurso = new Map<string, CalificacionPorCurso>()

        entregasData.forEach((entrega: Entrega) => {
          const cursoId = entrega.tareas.cursos.id
          
          if (!calificacionesPorCurso.has(cursoId)) {
            calificacionesPorCurso.set(cursoId, {
              curso: entrega.tareas.cursos,
              entregas: [],
              promedio: 0,
              totalTareas: 0,
              tareasCalificadas: 0
            })
          }

          const cursoCalif = calificacionesPorCurso.get(cursoId)!
          if (entrega.calificacion !== null) {
            cursoCalif.entregas.push({
              titulo: entrega.tareas.titulo,
              calificacion: entrega.calificacion,
              puntos_maximos: entrega.tareas.puntos_maximos
            })
            cursoCalif.tareasCalificadas++
          }
          cursoCalif.totalTareas++
        })

        calificacionesPorCurso.forEach((cursoCalif) => {
          if (cursoCalif.tareasCalificadas > 0) {
            const suma = cursoCalif.entregas.reduce((acc, e) => acc + e.calificacion, 0)
            cursoCalif.promedio = suma / cursoCalif.tareasCalificadas
          }
        })

        setCalificaciones(Array.from(calificacionesPorCurso.values()))
      }
    } catch (error) {
      console.error('Error cargando calificaciones:', error)
    } finally {
      setLoadingCalificaciones(false)
    }
  }

  const filtrarAlumnos = () => {
    if (!busqueda.trim()) {
      setAlumnosFiltrados(alumnos)
      return
    }

    const busquedaLower = busqueda.toLowerCase()
    const filtrados = alumnos.filter(alumno => 
      alumno.matricula.toLowerCase().includes(busquedaLower) ||
      alumno.profiles.nombre.toLowerCase().includes(busquedaLower) ||
      alumno.profiles.apellidos.toLowerCase().includes(busquedaLower) ||
      alumno.grado.toLowerCase().includes(busquedaLower) ||
      alumno.grupo.toLowerCase().includes(busquedaLower)
    )
    setAlumnosFiltrados(filtrados)
  }

  const calcularPromedioGeneral = () => {
    if (calificaciones.length === 0) return 0
    const suma = calificaciones.reduce((acc, c) => acc + c.promedio, 0)
    return suma / calificaciones.length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/directivo')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Alumnos</h1>
              <p className="text-sm text-gray-600">{alumnos.length} alumnos registrados</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Alumnos */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Alumnos</CardTitle>
                <CardDescription>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar por nombre o matricula..."
                      className="pl-10"
                    />
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {alumnosFiltrados.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No se encontraron alumnos</p>
                  ) : (
                    alumnosFiltrados.map((alumno) => (
                      <div
                        key={alumno.id}
                        onClick={() => setAlumnoSeleccionado(alumno)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          alumnoSeleccionado?.id === alumno.id
                            ? 'bg-blue-50 border-blue-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {alumno.profiles.nombre} {alumno.profiles.apellidos}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{alumno.matricula}</span>
                              <span>•</span>
                              <span>{alumno.grado} {alumno.grupo}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalles del Alumno */}
          <div className="lg:col-span-2">
            {alumnoSeleccionado ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">
                        {alumnoSeleccionado.profiles.nombre} {alumnoSeleccionado.profiles.apellidos}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge>{alumnoSeleccionado.matricula}</Badge>
                        <Badge variant="outline">{alumnoSeleccionado.grado} {alumnoSeleccionado.grupo}</Badge>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="personal" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="personal">Datos Personales</TabsTrigger>
                      <TabsTrigger value="academico">Historial Academico</TabsTrigger>
                      <TabsTrigger value="padre">Padre/Tutor</TabsTrigger>
                    </TabsList>

                    {/* Tab: Datos Personales */}
                    <TabsContent value="personal" className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Informacion Personal
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Nombre Completo</p>
                            <p className="font-medium">
                              {alumnoSeleccionado.profiles.nombre} {alumnoSeleccionado.profiles.apellidos}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Fecha de Nacimiento</p>
                            <p className="font-medium">
                              {alumnoSeleccionado.profiles.fecha_nacimiento 
                                ? new Date(alumnoSeleccionado.profiles.fecha_nacimiento).toLocaleDateString('es-MX')
                                : 'No especificada'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Fecha de Ingreso</p>
                            <p className="font-medium">
                              {new Date(alumnoSeleccionado.fecha_ingreso).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase">Grado y Grupo</p>
                            <p className="font-medium">{alumnoSeleccionado.grado} {alumnoSeleccionado.grupo}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Mail className="h-5 w-5" />
                          Contacto
                        </h3>
                        <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Mail className="h-4 w-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Email</p>
                              <p className="font-medium">{alumnoSeleccionado.profiles.email}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone className="h-4 w-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Telefono</p>
                              <p className="font-medium">
                                {alumnoSeleccionado.profiles.telefono || 'No especificado'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Direccion</p>
                              <p className="font-medium">
                                {alumnoSeleccionado.profiles.direccion || 'No especificada'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab: Historial Academico */}
                    <TabsContent value="academico" className="space-y-4">
                      {loadingCalificaciones ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Cargando calificaciones...</p>
                        </div>
                      ) : calificaciones.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No hay calificaciones registradas</p>
                        </div>
                      ) : (
                        <>
                          {/* Promedio General */}
                          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <p className="text-sm text-gray-600 mb-2">Promedio General</p>
                                <div className="text-5xl font-bold text-blue-600">
                                  {calcularPromedioGeneral().toFixed(1)}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  {calificaciones.length} materias cursadas
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Calificaciones por Materia */}
                          <div className="space-y-4">
                            {calificaciones.map((calificacion, index) => (
                              <Card key={index}>
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <CardTitle className="text-lg flex items-center gap-2">
                                        <BookOpen className="h-5 w-5" />
                                        {calificacion.curso.nombre}
                                      </CardTitle>
                                      <CardDescription>
                                        Maestro: {calificacion.curso.maestro_profiles.nombre} {calificacion.curso.maestro_profiles.apellidos}
                                      </CardDescription>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-3xl font-bold text-green-600">
                                        {calificacion.promedio.toFixed(1)}
                                      </div>
                                      <p className="text-xs text-gray-500">Promedio</p>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-2">
                                    <p className="text-sm text-gray-600 mb-3">
                                      {calificacion.tareasCalificadas} de {calificacion.totalTareas} tareas calificadas
                                    </p>
                                    <div className="space-y-2">
                                      {calificacion.entregas.map((entrega, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                          <div className="flex items-center gap-2">
                                            <Award className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm">{entrega.titulo}</span>
                                          </div>
                                          <Badge variant={entrega.calificacion >= 70 ? 'default' : 'destructive'}>
                                            {entrega.calificacion} / {entrega.puntos_maximos}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </>
                      )}
                    </TabsContent>

                    {/* Tab: Padre/Tutor */}
                    <TabsContent value="padre">
                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Padre/Tutor
                        </h3>
                        {alumnoSeleccionado.padre_profiles ? (
                          <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                              <p className="text-xs text-gray-500 uppercase">Nombre</p>
                              <p className="font-medium">
                                {alumnoSeleccionado.padre_profiles.nombre} {alumnoSeleccionado.padre_profiles.apellidos}
                              </p>
                            </div>
                            <div className="flex items-start gap-3">
                              <Mail className="h-4 w-4 text-gray-400 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Email</p>
                                <p className="font-medium">{alumnoSeleccionado.padre_profiles.email}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Phone className="h-4 w-4 text-gray-400 mt-1" />
                              <div>
                                <p className="text-xs text-gray-500 uppercase">Telefono</p>
                                <p className="font-medium">
                                  {alumnoSeleccionado.padre_profiles.telefono || 'No especificado'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                            No hay padre/tutor asignado
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <User className="h-16 w-16 mb-4 text-gray-300" />
                  <p className="text-lg">Selecciona un alumno para ver sus detalles</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}