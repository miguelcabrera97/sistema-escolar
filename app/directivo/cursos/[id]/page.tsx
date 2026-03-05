'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, FileText, UserPlus } from 'lucide-react'
import { obtenerCursoPorId, obtenerAlumnosInscritos, obtenerTareasCurso } from '@/app/actions/cursos-actions'
import { DialogoInscribirAlumnos } from '../DialogoInscribirAlumnos'

interface Curso {
    id: string
    nombre: string
    descripcion: string | null
    grado: string
    grupo: string
    maestro_id: string
    maestro_profiles: {
        id: string
        nombre: string
        apellidos: string
        email: string
    } | null
}

interface Alumno {
    id: string
    matricula: string
    profiles: {
        nombre: string
        apellidos: string
        email: string
    }
}

interface Tarea {
    id: string
    titulo: string
    descripcion: string | null
    fecha_entrega: string
    archivo_url: string | null
}

export default function DetalleCursoDirectivo() {
    const router = useRouter()
    const params = useParams()
    const cursoId = params.id as string

    const [curso, setCurso] = useState<Curso | null>(null)
    const [alumnos, setAlumnos] = useState<Alumno[]>([])
    const [tareas, setTareas] = useState<Tarea[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [dialogoInscribirAbierto, setDialogoInscribirAbierto] = useState(false)

    useEffect(() => {
        cargarDatos()
    }, [cursoId])

    const cargarDatos = async () => {
        try {
            setLoading(true)
            setError(null)

            // Cargar información del curso usando Server Action
            const cursoResult = await obtenerCursoPorId(cursoId)
            if (!cursoResult.success) throw new Error(cursoResult.error)
            if (!cursoResult.data) throw new Error('Curso no encontrado')
            setCurso(cursoResult.data)

            // Cargar alumnos inscritos usando Server Action
            const alumnosResult = await obtenerAlumnosInscritos(cursoId)
            if (alumnosResult.success && alumnosResult.data) {
                // Transformar al formato local y ordenar
                const alumnosFormateados = alumnosResult.data.map((item: any) => ({
                    id: item.alumnos.id,
                    matricula: item.alumnos.matricula,
                    profiles: {
                        nombre: item.alumnos.profiles.nombre,
                        apellidos: item.alumnos.profiles.apellidos,
                        email: item.alumnos.profiles.email
                    }
                }))

                // Ordenar alfabéticamente
                alumnosFormateados.sort((a: Alumno, b: Alumno) => {
                    const nombreA = `${a.profiles.nombre} ${a.profiles.apellidos}`.toLowerCase()
                    const nombreB = `${b.profiles.nombre} ${b.profiles.apellidos}`.toLowerCase()
                    return nombreA.localeCompare(nombreB)
                })

                setAlumnos(alumnosFormateados)
            } else {
                console.error('Error al cargar alumnos:', alumnosResult.error)
            }

            // Cargar tareas del curso usando nueva Server Action
            const tareasResult = await obtenerTareasCurso(cursoId)
            if (tareasResult.success && tareasResult.data) {
                setTareas(tareasResult.data)
            } else {
                console.error('Error al cargar tareas:', tareasResult.error)
            }

        } catch (err) {
            console.error('Error:', err)
            setError('Error al cargar los datos del curso')
        } finally {
            setLoading(false)
        }
    }

    const handleSuccessInscripcion = () => {
        cargarDatos()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando detalles del curso...</p>
                </div>
            </div>
        )
    }

    if (error || !curso) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                            <CardTitle className="text-red-600">Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-600 mb-4">{error || 'Curso no encontrado'}</p>
                            <Button onClick={() => router.push('/directivo/cursos')}>
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver a Cursos
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/directivo/cursos')}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {curso.nombre}
                                </h1>
                                <p className="text-gray-600">
                                    {curso.grado}° {curso.grupo}
                                </p>
                            </div>
                        </div>
                        <Button onClick={() => setDialogoInscribirAbierto(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Gestionar Alumnos
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Info del Curso y Maestro */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Descripción del Curso</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700">{curso.descripcion || 'Sin descripción.'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Maestro Asignado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {curso.maestro_profiles ? (
                                <div>
                                    <p className="font-semibold">{curso.maestro_profiles.nombre} {curso.maestro_profiles.apellidos}</p>
                                    <p className="text-sm text-gray-600">{curso.maestro_profiles.email}</p>
                                </div>
                            ) : (
                                <p className="text-red-600 font-medium">Sin maestro asignado (eliminado/no encontrado)</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Alumnos Inscritos</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{alumnos.length}</div>
                            <p className="text-xs text-muted-foreground">Estudiantes activos en el curso</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tareas Creadas</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{tareas.length}</div>
                            <p className="text-xs text-muted-foreground">Trabajos asignados por el maestro</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Lista de Alumnos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lista de Alumnos</CardTitle>
                            <CardDescription>
                                Directorio de estudiantes matriculados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {alumnos.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    No hay alumnos inscritos en este curso
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Matrícula</TableHead>
                                                <TableHead>Nombre Completo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {alumnos.map((alumno) => (
                                                <TableRow key={alumno.id}>
                                                    <TableCell className="font-medium text-gray-500">
                                                        {alumno.matricula}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-blue-900">
                                                        {alumno.profiles.nombre} {alumno.profiles.apellidos}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Lista de Tareas */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Tareas</CardTitle>
                            <CardDescription>
                                Registro de actividades creadas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tareas.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    El maestro aún no ha creado tareas
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {tareas.map((tarea) => (
                                        <div
                                            key={tarea.id}
                                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-gray-50"
                                        >
                                            <div className="flex-1 mb-2 sm:mb-0">
                                                <h3 className="font-semibold text-gray-900">{tarea.titulo}</h3>
                                                {tarea.descripcion && (
                                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                        {tarea.descripcion}
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                                    <Badge variant="outline" className="text-slate-600">
                                                        Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString('es-MX', {
                                                            day: '2-digit', month: 'short', year: 'numeric'
                                                        })}
                                                    </Badge>
                                                    {tarea.archivo_url && (
                                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                            Archivo Adjunto
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Diálogo de Inscribir Alumnos (reutilizado) */}
            <DialogoInscribirAlumnos
                curso={curso}
                open={dialogoInscribirAbierto}
                onOpenChange={setDialogoInscribirAbierto}
                onSuccess={handleSuccessInscripcion}
            />
        </div>
    )
}
