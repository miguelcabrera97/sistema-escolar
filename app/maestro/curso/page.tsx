'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen, Users, Search, ChevronRight, Plus } from 'lucide-react'

const supabase = createClient()

interface Curso {
  id: string
  nombre: string
  descripcion: string
  grado: string
  grupo: string
  total_alumnos: number
  total_tareas: number
}

export default function MaestroCursosPage() {
  const router = useRouter()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)

  const cargarCursos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Obtener cursos del maestro
      const { data: cursosData } = await supabase
        .from('cursos')
        .select('id, nombre, descripcion, grado, grupo')
        .eq('maestro_id', user.id)
        .order('grado')
        .order('nombre')

      if (!cursosData || cursosData.length === 0) {
        setCursos([])
        setLoading(false)
        return
      }

      // Para cada curso obtener conteos
      const cursosConStats = await Promise.all(
        cursosData.map(async (curso) => {
          const [{ count: totalAlumnos }, { count: totalTareas }] = await Promise.all([
            supabase
              .from('inscripciones')
              .select('*', { count: 'exact', head: true })
              .eq('curso_id', curso.id),
            supabase
              .from('tareas')
              .select('*', { count: 'exact', head: true })
              .eq('curso_id', curso.id),
          ])
          return {
            ...curso,
            total_alumnos: totalAlumnos ?? 0,
            total_tareas: totalTareas ?? 0,
          }
        })
      )

      setCursos(cursosConStats)
    } catch (err) {
      console.error('Error cargando cursos:', err)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { cargarCursos() }, [cargarCursos])

  const cursosFiltrados = busqueda
    ? cursos.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        String(c.grado).includes(busqueda) ||
        c.grupo.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
      )
    : cursos

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Cargando cursos…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-purple-600" />
            Mis Cursos
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cursos.length} {cursos.length === 1 ? 'curso asignado' : 'cursos asignados'}
          </p>
        </div>
        <Button onClick={() => router.push('/maestro/crear-tarea')}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Buscador */}
      {cursos.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, grado, grupo o descripción…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* Lista de cursos */}
      {cursos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <BookOpen className="h-12 w-12 mb-4 text-gray-300" />
            <p className="font-medium">No tienes cursos asignados</p>
            <p className="text-sm mt-1">Contacta al directivo para que te asigne cursos</p>
          </CardContent>
        </Card>
      ) : cursosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Search className="h-10 w-10 mb-3 text-gray-300" />
            <p className="font-medium">Sin resultados para "{busqueda}"</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cursosFiltrados.map((curso) => (
            <Card
              key={curso.id}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => router.push(`/maestro/curso/${curso.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-base leading-snug group-hover:text-purple-700 transition-colors">
                      {curso.nombre}
                    </CardTitle>
                    <CardDescription className="mt-0.5">
                      {curso.grado}° — Grupo {curso.grupo}
                    </CardDescription>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-purple-500 transition-colors shrink-0 mt-0.5" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {curso.descripcion && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{curso.descripcion}</p>
                )}
                <div className="flex gap-4 text-sm">
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <Users className="h-4 w-4 text-gray-400" />
                    <strong>{curso.total_alumnos}</strong> alumnos
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-600">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <strong>{curso.total_tareas}</strong> tareas
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
