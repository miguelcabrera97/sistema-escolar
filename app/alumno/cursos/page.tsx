'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, User, FileText } from 'lucide-react'

const supabase = createClient()

interface Profile {
    nombre: string
    apellidos: string
}

interface Curso {
    id: string
    nombre: string
    descripcion: string
    maestro_id: string
    maestro_profiles: Profile
    tareas_count?: number
}

export default function MisCursosPage() {
    const router = useRouter()
    const [cursos, setCursos] = useState<Curso[]>([])
    const [loading, setLoading] = useState(true)

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

            const { data: alumnoData } = await supabase
                .from('alumnos')
                .select('id')
                .eq('user_id', user.id)
                .single()

            if (!alumnoData) return

            const { data: inscripcionesData } = await supabase
                .from('inscripciones')
                .select('curso_id')
                .eq('alumno_id', alumnoData.id)

            const cursoIds = inscripcionesData?.map((i: any) => i.curso_id) || []

            if (cursoIds.length === 0) {
                setLoading(false)
                return
            }

            const { data: cursosData } = await supabase
                .from('cursos')
                .select('id, nombre, descripcion, maestro_id')
                .in('id', cursoIds)

            if (cursosData) {
                const maestroIds = cursosData.map(c => c.maestro_id).filter(Boolean)
                const { data: maestrosProfiles } = await supabase
                    .from('profiles')
                    .select('id, nombre, apellidos')
                    .in('id', maestroIds)

                // Obtener conteo de tareas por curso
                const { data: tareasData } = await supabase
                    .from('tareas')
                    .select('curso_id')
                    .in('curso_id', cursoIds)

                const cursosCompletos = cursosData.map(curso => {
                    const tareas_count = tareasData?.filter(t => t.curso_id === curso.id).length || 0
                    return {
                        ...curso,
                        maestro_profiles: maestrosProfiles?.find(m => m.id === curso.maestro_id) || { nombre: '', apellidos: '' },
                        tareas_count,
                    }
                })

                setCursos(cursosCompletos)
            }
        } catch (error) {
            console.error('Error al cargar cursos:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando cursos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Mis Cursos</h1>
                <p className="text-gray-500 mt-1">Cursos en los que estás inscrito este periodo</p>
            </div>

            {cursos.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">No tienes cursos asignados</p>
                        <p className="text-gray-400 text-sm mt-1">Contacta a tu directivo para más información.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cursos.map((curso) => (
                        <Card key={curso.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base leading-tight">{curso.nombre}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-0.5">
                                                <User className="h-3 w-3" />
                                                {curso.maestro_profiles.nombre} {curso.maestro_profiles.apellidos}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {curso.descripcion && (
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{curso.descripcion}</p>
                                )}
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {curso.tareas_count} {curso.tareas_count === 1 ? 'tarea' : 'tareas'}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
