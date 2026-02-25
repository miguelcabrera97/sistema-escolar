'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react'

interface Alumno {
  id: string
  matricula: string
  grado: string
  grupo: string
  profiles: {
    nombre: string
    apellidos: string
  }
}

interface Curso {
  id: string
  nombre: string
  grado: string
  grupo: string
  profiles?: {
    nombre: string
    apellidos: string
  }
}

interface Inscripcion {
  id: string
  alumno_id: string
  curso_id: string
  alumnos: Alumno
  cursos: Curso
}

export default function InscripcionesPage() {
  const router = useRouter()
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedAlumno, setSelectedAlumno] = useState('')
  const [selectedCurso, setSelectedCurso] = useState('')
  const [searchAlumno, setSearchAlumno] = useState('')
  const [searchCurso, setSearchCurso] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      // Verificar autenticación
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Cargar inscripciones
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('inscripciones')
        .select('id, alumno_id, curso_id')
        .order('created_at', { ascending: false })

      if (inscripcionesError) {
        console.error('Error al cargar inscripciones:', inscripcionesError)
      }

      // Cargar alumnos
      const { data: alumnosData } = await supabase
        .from('alumnos')
        .select('id, matricula, grado, grupo, user_id')
        .order('matricula')

      // Cargar profiles de alumnos
      const alumnoUserIds = alumnosData?.map(a => a.user_id).filter(Boolean) || []
      const { data: alumnoProfiles } = await supabase
        .from('profiles')
        .select('id, nombre, apellidos')
        .in('id', alumnoUserIds)

      const alumnosCompletos = alumnosData?.map(alumno => ({
        ...alumno,
        profiles: alumnoProfiles?.find(p => p.id === alumno.user_id) || { nombre: '', apellidos: '' }
      })) || []

      setAlumnos(alumnosCompletos)

      // Cargar cursos
      const { data: cursosData } = await supabase
        .from('cursos')
        .select('id, nombre, grado, grupo, maestro_id')
        .order('nombre')

      // Cargar profiles de maestros
      const maestroIds = cursosData?.map(c => c.maestro_id).filter(Boolean) || []
      const { data: maestroProfiles } = await supabase
        .from('profiles')
        .select('id, nombre, apellidos')
        .in('id', maestroIds)

      const cursosCompletos = cursosData?.map(curso => ({
        ...curso,
        profiles: maestroProfiles?.find(p => p.id === curso.maestro_id) || { nombre: '', apellidos: '' }
      })) || []

      setCursos(cursosCompletos)

      // Combinar inscripciones con sus datos
      if (inscripcionesData) {
        const inscripcionesCompletas = inscripcionesData.map(insc => ({
          ...insc,
          alumnos: alumnosCompletos.find(a => a.id === insc.alumno_id)!,
          cursos: cursosCompletos.find(c => c.id === insc.curso_id)!
        })).filter(insc => insc.alumnos && insc.cursos)

        setInscripciones(inscripcionesCompletas)
      }

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const crearInscripcion = async () => {
    if (!selectedAlumno || !selectedCurso) {
      alert('Selecciona un alumno y un curso')
      return
    }

    try {
      const { error } = await supabase
        .from('inscripciones')
        .insert({
          alumno_id: selectedAlumno,
          curso_id: selectedCurso
        })

      if (error) throw error

      alert('Inscripción creada exitosamente')
      setShowModal(false)
      setSelectedAlumno('')
      setSelectedCurso('')
      cargarDatos()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al crear inscripción: ' + error.message)
    }
  }

  const eliminarInscripcion = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta inscripción?')) return

    try {
      const { error } = await supabase
        .from('inscripciones')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Inscripción eliminada')
      cargarDatos()
    } catch (error: any) {
      console.error('Error:', error)
      alert('Error al eliminar: ' + error.message)
    }
  }

  const alumnosFiltrados = alumnos.filter(a =>
    `${a.profiles.nombre} ${a.profiles.apellidos} ${a.matricula}`
      .toLowerCase()
      .includes(searchAlumno.toLowerCase())
  )

  const cursosFiltrados = cursos.filter(c =>
    `${c.nombre} ${c.grado} ${c.grupo}`
      .toLowerCase()
      .includes(searchCurso.toLowerCase())
  )

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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Inscripciones</h1>
              <p className="text-sm text-gray-500">Administra las inscripciones de alumnos a cursos</p>
            </div>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Inscripción
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Inscripciones Activas</CardTitle>
            <CardDescription>
              Total de inscripciones: {inscripciones.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inscripciones.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No hay inscripciones registradas
                </p>
              ) : (
                inscripciones.map((insc) => (
                  <div
                    key={insc.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">
                          {insc.alumnos.profiles.nombre} {insc.alumnos.profiles.apellidos}
                        </p>
                        <p className="text-sm text-gray-500">
                          Matrícula: {insc.alumnos.matricula} • {insc.alumnos.grado} {insc.alumnos.grupo}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">{insc.cursos.nombre}</p>
                        <p className="text-sm text-gray-500">
                          {insc.cursos.grado} {insc.cursos.grupo}
                          {insc.cursos.profiles && ` • ${insc.cursos.profiles.nombre} ${insc.cursos.profiles.apellidos}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarInscripcion(insc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modal para nueva inscripción */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Nueva Inscripción</CardTitle>
              <CardDescription>Inscribe un alumno a un curso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selección de Alumno */}
              <div>
                <Label>Alumno</Label>
                <Input
                  placeholder="Buscar alumno..."
                  value={searchAlumno}
                  onChange={(e) => setSearchAlumno(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {alumnosFiltrados.map((alumno) => (
                    <div
                      key={alumno.id}
                      onClick={() => setSelectedAlumno(alumno.id)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedAlumno === alumno.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                    >
                      <p className="font-medium">
                        {alumno.profiles.nombre} {alumno.profiles.apellidos}
                      </p>
                      <p className="text-sm text-gray-500">
                        {alumno.matricula} • {alumno.grado} {alumno.grupo}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selección de Curso */}
              <div>
                <Label>Curso</Label>
                <Input
                  placeholder="Buscar curso..."
                  value={searchCurso}
                  onChange={(e) => setSearchCurso(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {cursosFiltrados.map((curso) => (
                    <div
                      key={curso.id}
                      onClick={() => setSelectedCurso(curso.id)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedCurso === curso.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                    >
                      <p className="font-medium">{curso.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {curso.grado} {curso.grupo}
                        {curso.profiles && ` • ${curso.profiles.nombre} ${curso.profiles.apellidos}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={crearInscripcion}
                  disabled={!selectedAlumno || !selectedCurso}
                  className="flex-1"
                >
                  Crear Inscripción
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false)
                    setSelectedAlumno('')
                    setSelectedCurso('')
                    setSearchAlumno('')
                    setSearchCurso('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
