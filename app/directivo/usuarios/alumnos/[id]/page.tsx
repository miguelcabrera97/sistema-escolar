import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { obtenerAlumnoPorId } from '@/app/actions/usuarios-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Mail, Phone, BookOpen, Users, Clock, Hash } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Detalle de Alumno | Sistema Escolar',
    description: 'Información detallada del alumno',
}

export default async function DetalleAlumnoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const result = await obtenerAlumnoPorId(id)

    if (!result.success || !result.data) {
        redirect('/directivo/usuarios')
    }

    const alumno = result.data

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/directivo/usuarios">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {alumno.profiles?.nombre} {alumno.profiles?.apellidos}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Badge variant={alumno.profiles?.activo ? 'default' : 'secondary'}>
                                {alumno.profiles?.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <span className="text-sm">Matrícula: {alumno.matricula}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-500" />
                            Información Personal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Hash className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm font-medium">CURP</p>
                                <p className="text-sm text-muted-foreground">{alumno.curp || 'No especificado'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm font-medium">Correo Electrónico</p>
                                <p className="text-sm text-muted-foreground">{alumno.profiles?.email || 'No especificado'}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                                <p className="text-sm font-medium">Teléfono</p>
                                <p className="text-sm text-muted-foreground">{alumno.profiles?.telefono || 'No especificado'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-emerald-500" />
                            Información Académica
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Grado</p>
                                <p className="text-2xl font-bold">{alumno.grado}°</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Grupo</p>
                                <p className="text-2xl font-bold">{alumno.grupo}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-purple-500" />
                            Padres o Tutores
                        </CardTitle>
                        <CardDescription>
                            Familiares asociados al alumno
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {alumno.padre_alumno && alumno.padre_alumno.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                {alumno.padre_alumno.map((relacion: any) => {
                                    const padreProfile = relacion.padres?.profiles
                                    if (!padreProfile) return null

                                    return (
                                        <div key={relacion.padre_id} className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {padreProfile.nombre} {padreProfile.apellidos}
                                                </p>
                                                <p className="text-sm text-muted-foreground flex gap-3 pt-2">
                                                    {padreProfile.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {padreProfile.email}
                                                        </span>
                                                    )}
                                                    {padreProfile.telefono && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3" />
                                                            {padreProfile.telefono}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/directivo/usuarios/padres/${relacion.padres?.user_id}`}>
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
                                <p>No hay padres registrados para este alumno</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
