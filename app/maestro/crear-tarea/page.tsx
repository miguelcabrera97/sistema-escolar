'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

export default function CrearTarea() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    curso_id: '',
    titulo: '',
    descripcion: '',
    fecha_entrega: '',
    puntos_maximos: 100
  })

  const [cursos, setCursos] = useState<any[]>([])

  // Cargar cursos del maestro
  useState(() => {
    const cargarCursos = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: maestroData } = await supabase
        .from('maestros')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (maestroData) {
        const { data: cursosData } = await supabase
          .from('cursos')
          .select('id, nombre, grado, grupo')
          .eq('maestro_id', maestroData.id)

        setCursos(cursosData || [])
      }
    }
    cargarCursos()
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validar campos
      if (!formData.curso_id || !formData.titulo || !formData.fecha_entrega) {
        throw new Error('Por favor completa todos los campos obligatorios')
      }

      // Insertar tarea
      const { error: insertError } = await supabase
        .from('tareas')
        .insert({
          curso_id: formData.curso_id,
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          fecha_entrega: formData.fecha_entrega,
          puntos_maximos: formData.puntos_maximos
        })

      if (insertError) throw insertError

      // Redirigir al dashboard
      router.push('/maestro')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Tarea</CardTitle>
            <CardDescription>
              Completa la información de la tarea para tus alumnos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seleccionar curso */}
              <div>
                <Label htmlFor="curso">Curso *</Label>
                <select
                  id="curso"
                  value={formData.curso_id}
                  onChange={(e) => setFormData({ ...formData, curso_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Selecciona un curso</option>
                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nombre} - {curso.grado} {curso.grupo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Título */}
              <div>
                <Label htmlFor="titulo">Título de la tarea *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Ejercicios de álgebra"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe la tarea en detalle..."
                  className="w-full mt-1 px-3 py-2 border rounded-md min-h-[120px]"
                />
              </div>

              {/* Fecha de entrega */}
              <div>
                <Label htmlFor="fecha">Fecha de entrega *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha_entrega}
                  onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Puntos máximos */}
              <div>
                <Label htmlFor="puntos">Puntos máximos</Label>
                <Input
                  id="puntos"
                  type="number"
                  value={formData.puntos_maximos}
                  onChange={(e) => setFormData({ ...formData, puntos_maximos: parseInt(e.target.value) })}
                  min={1}
                  max={200}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creando...' : 'Crear Tarea'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}