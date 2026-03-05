import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { obtenerPadrePorId } from '@/app/actions/usuarios-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Mail, Phone, BookOpen, Users, GraduationCap } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Detalle de Padre/Tutor | Sistema Escolar',
    description: 'Información detallada del padre o tutor',
}

export default async function DetallePadrePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const result = await obtenerPadrePorId(id)

    if (!result.success || !result.data) {
        redirect('/directivo/usuarios')
    }

    const padre = result.data
    const hijos = padre.relacion_alumnos || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/directivo/usuarios?tab=padres">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {padre.nombre} {padre.apellidos}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Badge variant={padre.activo ? 'default' : 'secondary'}>
                                {padre.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <span className="text-sm capitalize">{padre.role}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-500" />
                            Información de Contacto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm font-medium">Correo Electrónico</p>
                                <p className="text-sm text-muted-foreground">{padre.email || 'No especificado'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm font-medium">Teléfono</p>
                                <p className="text-sm text-muted-foreground">{padre.telefono || 'No especificado'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-emerald-500" />
                            Hijos (Alumnos Asociados)
                        </CardTitle>
                        <CardDescription>
                            Estudiantes vinculados a este tutor
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {hijos.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {hijos.map((relacion: any) => {
                                    const alumno = relacion.alumnos
                                    if (!alumno) return null

                                    return (
                                        <div key={relacion.alumno_id} className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {alumno.profiles?.nombre} {alumno.profiles?.apellidos}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Matrícula: {alumno.matricula}
                                                </p>
                                                <div className="flex content-center items-center gap-2 pt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {alumno.grado}° {alumno.grupo}
                                                    </Badge>
                                                    <Badge variant={alumno.profiles?.activo ? 'default' : 'secondary'} className="text-[10px] px-1 h-4">
                                                        {alumno.profiles?.activo ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/directivo/usuarios/alumnos/${alumno.id}`}>
                                                    Ver Perfil
                                                </Link>
                                            </Button>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <Users className="mb-2 h-8 w-8 opacity-20" />
                                <p>No hay alumnos asociados a esta cuenta</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
