'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Calendar, Award, User } from 'lucide-react'

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
  calificacion: number | null
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
  status: string
  fecha_entrega: string
}

export default function AlumnoDashboard() {
  const router = useRouter()
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)

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

      const { data: inscripcionesData } = await supabase
        .from('inscripciones')
        .select(`
          cursos (
            id,
            nombre,
            descripcion,
            maestro_profiles:profiles!cursos_maestro_id_fkey(nombre, apellidos)
          )
        `)
        .eq('alumno_id', alumnoData.id)

      if (inscripcionesData) {
        setCursos(inscripcionesData.map((i: Inscripcion) => i.cursos))
      }

      const { data: tareasData } = await supabase
        .from('tareas')
        .select(`
          *,
          entregas!entregas_tarea_id_fkey(id, status, calificacion, fecha_entrega)
        `)
        .in('curso_id', inscripcionesData?.map((i: Inscripcion) => i.cursos.id) || [])
        .order('fecha_entrega', { ascending: true })

      if (tareasData) {
        const tareasConEntregas = tareasData.map(tarea => ({
          ...tarea,
          entregas: tarea.entregas?.filter((e: Entrega) => e.id) || []
        }))
        setTareas(tareasConEntregas)
      }

      const { data: pagosData } = await supabase
        .from('pagos')
        .select('*')
        .eq('alumno_id', alumnoData.id)
        .order('fecha_entrega', { ascending: true })

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

  const promedioGeneral = tareasCalificadas.length > 0
    ? tareasCalificadas.reduce((sum, t) => {
        const entrega = t.entregas.find(e => e.id)
        return sum + (entrega?.calificacion || 0)
      }, 0) / tareasCalificadas.length
    : 0

  const pagosPendientes = pagos.filter(p => p.status === 'pendiente' || p.status === 'vencido')
  const totalAdeudo = pagosPendientes.reduce((sum, p) => sum + p.monto, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {alumno?.profiles.nombre} {alumno?.profiles.apellidos}
              </h1>
              <p className="text-gray-600">
                Matrícula: {alumno?.matricula} - {alumno?.grado} {alumno?.grupo}
              </p>
            </div>
            <Button variant="outline" onClick={() => {
              supabase.auth.signOut()
              router.push('/login')
            }}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <Card
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => router.push('/alumno/calificaciones')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promedioGeneral.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Ver calificaciones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalAdeudo.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{pagosPendientes.length} pendientes</p>
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
              <CardTitle>Tareas Recientes</CardTitle>
              <CardDescription>Tareas pendientes y próximas a vencer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tareasPendientes.slice(0, 5).map((tarea) => {
                  const entrega = tarea.entregas.find(e => e.id)
                  const vencida = new Date(tarea.fecha_entrega) < new Date()
                  
                  return (
                    <div key={tarea.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold">{tarea.titulo}</h3>
                        <p className="text-sm text-gray-600">
                          Vence: {new Date(tarea.fecha_entrega).toLocaleDateString()}
                        </p>
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