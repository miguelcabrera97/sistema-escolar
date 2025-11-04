'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react'

interface Profile {
  nombre: string
  apellidos: string
}

interface Curso {
  id: string
  nombre: string
  grado: string
  grupo: string
}

interface Tarea {
  id: string
  titulo: string
  descripcion: string
  fecha_entrega: string
  cursos: Curso
}

interface Alumno {
  id: string
  matricula: string
  profiles: Profile
}

interface Entrega {
  id: string
  status: string
  retroalimentacion: string | null
  fecha_entrega: string | null
  archivo_url: string | null
  comentarios: string | null
  alumnos: Alumno
}

export default function EntregasTarea() {
  const params = useParams()
  const router = useRouter()
  const tareaId = params.id as string

  const [tarea, setTarea] = useState<Tarea | null>(null)
  const [entregas, setEntregas] = useState<Entrega[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: tareaData } = await supabase
        .from('tareas')
        .select('*, cursos (id, nombre, grado, grupo, maestro_id)')
        .eq('id', tareaId)
        .single()

      if (tareaData && tareaData.cursos.maestro_id !== user.id) {
        alert('No tienes permiso para ver esta página.')
        router.push('/maestro')
        return
      }

      setTarea(tareaData)

      const { data: entregasData } = await supabase
        .from('entregas')
        .select('id, status, retroalimentacion, fecha_entrega, archivo_url, comentarios, alumnos (id, matricula, profiles (nombre, apellidos))')
        .eq('tarea_id', tareaId)
        .order('fecha_entrega', { ascending: false })

      setEntregas(entregasData || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [tareaId, router])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

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

  const stats = {
    total: entregas.length,
    entregadas: entregas.filter(e => e.status === 'entregada').length,
    pendientes: entregas.filter(e => e.status === 'pendiente').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{tarea?.titulo}</CardTitle>
            <CardDescription>{tarea?.cursos?.nombre} - {tarea?.cursos?.grado} {tarea?.cursos?.grupo}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.entregadas}</div>
                <div className="text-xs text-gray-500">Entregadas</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.pendientes}</div>
                <div className="text-xs text-gray-500">No Entregadas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entregas de Alumnos</CardTitle>
          </CardHeader>
          <CardContent>
            {entregas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No hay entregas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entregas.map((entrega) => (
                  <div key={entrega.id} className="border rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{entrega.alumnos?.profiles?.nombre} {entrega.alumnos?.profiles?.apellidos}</h3>
                        <p className="text-sm text-gray-500">Matricula: {entrega.alumnos?.matricula}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={entrega.status === 'entregada' ? 'default' : 'destructive'}>
                          {entrega.status === 'entregada' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {entrega.status === 'pendiente' && <AlertCircle className="h-3 w-3 mr-1" />}
                          {entrega.status === 'entregada' ? 'Entregada' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>

                    {entrega.status !== 'pendiente' && (
                      <div className="p-4 space-y-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Entregado:</span> {entrega.fecha_entrega ? new Date(entrega.fecha_entrega).toLocaleString('es-MX') : 'N/A'}
                        </div>

                        {entrega.archivo_url && (
                          <Button variant="link" onClick={() => window.open(entrega.archivo_url || '', '_blank')} className="p-0 h-auto">
                            <FileText className="h-4 w-4 mr-2" />
                            Ver archivo
                          </Button>
                        )}

                        {entrega.comentarios && (
                          <div className="p-3 bg-gray-50 rounded">
                            <div className="text-xs font-medium text-gray-500 mb-1">Comentarios:</div>
                            <p className="text-sm text-gray-700">{entrega.comentarios}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}