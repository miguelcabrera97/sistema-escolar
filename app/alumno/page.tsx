'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Calendar, Award, User, Lock } from 'lucide-react'

interface Profile {
  nombre: string
  apellidos: string
}

interface Alumno {
  id: string
  matricula: string
  grado: string
  grupo: string
  profiles: Profile
}

interface Curso {
  id: string
  nombre: string
  descripcion: string
  maestro_profiles: Profile
}

interface Inscripcion {
  cursos: Curso
}

interface Entrega {
  id: string
  status: string
  calificacion: string | null
  fecha_entrega: string | null
}

interface Tarea {
  id: string
  titulo: string
  descripcion: string
  fecha_entrega: string
  puntos_maximos: number
  entregas: Entrega[]
}

interface Pago {
  id: string
  concepto: string
  monto: number
  estado: string
  fecha_vencimiento: string
}

export default function AlumnoDashboard() {
  const router = useRouter()
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

  const getSaludo = () => {
    const hora = new Date().getHours()
    if (hora < 12) return 'Buenos días'
    if (hora < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: alumnoData } = await supabase
        .from('alumnos')
        .select('*, profiles(nombre, apellidos)')
        .eq('user_id', user.id)
        .single()

      if (!alumnoData) {
        alert('No se encontró información del alumno')
        return
      }

      setAlumno(alumnoData)

      // Primero obtener las inscripciones con los cursos
      const { data: inscripcionesData, error: inscripcionesError } = await supabase
        .from('inscripciones')
        .select('curso_id')
        .eq('alumno_id', alumnoData.id)

      if (inscripcionesError) {
        console.error('❌ Error al cargar inscripciones:', inscripcionesError)
        console.error('   Código:', inscripcionesError.code)
        console.error('   Mensaje:', inscripcionesError.message)
        console.error('   Detalles:', inscripcionesError.details)
        console.error('   Hint:', inscripcionesError.hint)
      }

      // Obtener los IDs de cursos
      const cursoIds = inscripcionesData?.map((i: any) => i.curso_id) || []

      // Obtener los datos completos de los cursos
      if (cursoIds.length > 0) {
        const { data: cursosData, error: cursosError } = await supabase
          .from('cursos')
          .select(`
            id,
            nombre,
            descripcion,
            maestro_id
          `)
          .in('id', cursoIds)

        if (cursosError) {
          console.error('❌ Error al cargar cursos:', cursosError)
        } else if (cursosData) {
          // Obtener los profiles de los maestros
          const maestroIds = cursosData.map(c => c.maestro_id).filter(Boolean)
          const { data: maestrosProfiles } = await supabase
            .from('profiles')
            .select('id, nombre, apellidos')
            .in('id', maestroIds)

          // Combinar los datos
          const cursosCompletos = cursosData.map(curso => ({
            ...curso,
            maestro_profiles: maestrosProfiles?.find(m => m.id === curso.maestro_id) || { nombre: '', apellidos: '' }
          }))

          setCursos(cursosCompletos)
        }
      }

      const { data: tareasData, error: tareasError } = await supabase
        .from('tareas')
        .select(`
          *,
          entregas!entregas_tarea_id_fkey(id, status, calificacion, fecha_entrega, alumno_id)
        `)
        .in('curso_id', cursoIds)
        .order('fecha_entrega', { ascending: true })

      if (tareasError) {
        console.error('❌ Error al cargar tareas:', tareasError)
        console.error('   Código:', tareasError.code)
        console.error('   Mensaje:', tareasError.message)
        console.error('   Detalles:', tareasError.details)
      }

      if (tareasData) {
        const tareasConEntregas = tareasData.map(tarea => ({
          ...tarea,
          entregas: tarea.entregas?.filter((e: Entrega & { alumno_id?: string }) => e.alumno_id === alumnoData.id) || []
        }))
        setTareas(tareasConEntregas)
      }

      const { data: pagosData, error: pagosError } = await supabase
        .from('pagos')
        .select('*')
        .eq('alumno_id', alumnoData.id)
        .order('fecha_vencimiento', { ascending: true })

      if (pagosError) {
        console.error('❌ Error al cargar pagos:', pagosError)
        console.error('   Código:', pagosError.code)
        console.error('   Mensaje:', pagosError.message)
      }

      if (pagosData) {
        setPagos(pagosData)
      }

    } catch (error) {
      const err = error as Error
      console.error('Error:', err)
      alert('Error al cargar los datos: ' + err.message)
    } finally {
      setLoading(false)
    }
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

  const tareasPendientes = tareas.filter(t => {
    const entrega = t.entregas.find(e => e.id)
    return !entrega || entrega.status === 'pendiente'
  })

  const tareasCalificadas = tareas.filter(t => {
    const entrega = t.entregas.find(e => e.id)
    return entrega?.status === 'calificada'
  })

  const pagosPendientes = pagos.filter(p => p.estado === 'pendiente' || p.estado === 'vencido')
  const totalAdeudo = pagosPendientes.reduce((sum, p) => sum + p.monto, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {getSaludo()}, {alumno?.profiles?.nombre?.split(' ')[0] || ''} 👋
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Matrícula: {alumno?.matricula} • {alumno?.grado} {alumno?.grupo}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cursos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cursos.length}</div>
              <p className="text-xs text-muted-foreground">Inscritos este periodo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tareasPendientes.length}</div>
              <p className="text-xs text-muted-foreground">Por entregar</p>
            </CardContent>
          </Card>


        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Mis Cursos</CardTitle>
              <CardDescription>Cursos en los que estás inscrito</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cursos.map((curso) => (
                  <div key={curso.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{curso.nombre}</h3>
                      <p className="text-sm text-gray-600">
                        <User className="inline h-3 w-3 mr-1" />
                        {curso.maestro_profiles.nombre} {curso.maestro_profiles.apellidos}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mis Tareas</CardTitle>
              <CardDescription>Todas tus tareas: pendientes, entregadas y calificadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tareas.slice(0, 10).map((tarea) => {
                  const entrega = tarea.entregas.find(e => e.id)
                  const vencida = new Date(tarea.fecha_entrega) < new Date()

                  return (
                    <div key={tarea.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{tarea.titulo}</h3>
                        <p className="text-sm text-gray-600">
                          Vence: {new Date(tarea.fecha_entrega).toLocaleDateString()}
                        </p>
                        {entrega?.status === 'calificada' && entrega.calificacion && (
                          <p className="text-sm font-semibold mt-1 text-green-600">
                            Calificación: {entrega.calificacion}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          entrega?.status === 'calificada' ? 'default' :
                            entrega?.status === 'entregada' ? 'secondary' :
                              vencida ? 'destructive' : 'outline'
                        }>
                          {entrega?.status === 'calificada' ? 'Calificada' :
                            entrega?.status === 'entregada' ? 'Entregada' :
                              vencida ? 'Vencida' : 'Pendiente'}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/alumno/tarea/${tarea.id}`)}
                        >
                          Ver
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}