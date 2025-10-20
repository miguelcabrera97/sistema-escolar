'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

interface Curso {
  id: string
  nombre: string
  grado: string
  grupo: string
}

export default function CrearTarea() {
  const router = useRouter()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    curso_id: '',
    titulo: '',
    descripcion: '',
    fecha_entrega: '',
    puntos_maximos: ''
  })

  useEffect(() => {
    cargarCursos()
  }, [])

  const cargarCursos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data: cursosData } = await supabase
        .from('cursos')
        .select('id, nombre, grado, grupo')
        .eq('maestro_id', user.id)
        .order('nombre')

      if (cursosData) {
        setCursos(cursosData)
      }
    } catch (error) {
      const err = error as Error
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('tareas')
        .insert({
          curso_id: formData.curso_id,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          fecha_entrega: formData.fecha_entrega,
          puntos_maximos: parseInt(formData.puntos_maximos)
        })

      if (error) throw error

      alert('Tarea creada exitosamente')
      router.push('/maestro')
    } catch (err) {
      const error = err as Error
      console.error('Error:', error)
      alert('Error al crear la tarea: ' + error.message)
    } finally {
      setSubmitting(false)
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

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Tarea</CardTitle>
            <CardDescription>
              Completa el formulario para crear una nueva tarea para tus alumnos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="curso">Curso</Label>
                <select
                  id="curso"
                  value={formData.curso_id}
                  onChange={(e) => setFormData({ ...formData, curso_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  required
                  disabled={submitting}
                >
                  <option value="">Selecciona un curso</option>
                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nombre} - {curso.grado} {curso.grupo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Tarea de Matemáticas Unidad 3"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe la tarea y los objetivos..."
                  className="w-full mt-1 px-3 py-2 border rounded-md min-h-[120px]"
                  required
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fecha">Fecha de Entrega</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha_entrega}
                    onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <Label htmlFor="puntos">Puntos Máximos</Label>
                  <Input
                    id="puntos"
                    type="number"
                    min="1"
                    max="100"
                    value={formData.puntos_maximos}
                    onChange={(e) => setFormData({ ...formData, puntos_maximos: e.target.value })}
                    placeholder="100"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Creando...' : 'Crear Tarea'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}