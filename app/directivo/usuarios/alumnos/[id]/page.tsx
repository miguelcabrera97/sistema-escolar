import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { obtenerAlumnoPorId } from '@/app/actions/usuarios-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Mail, Phone, BookOpen, Users, Clock, Hash, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Perfil de Alumno | Sistema Escolar',
    description: 'Información detallada del alumno',
}

function getInitials(nombre: string, apellidos: string) {
    const n = nombre ? nombre[0].toUpperCase() : ''
    const a = apellidos ? apellidos[0].toUpperCase() : ''
    return `${n}${a}`
}

export default async function DetalleAlumnoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const result = await obtenerAlumnoPorId(id)

    if (!result.success || !result.data) {
        redirect('/directivo/usuarios')
    }

    const alumno = result.data
    const initials = getInitials(alumno.profiles?.nombre, alumno.profiles?.apellidos)

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* ENCABEZADO Y NAVEGACIÓN */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200" asChild>
                    <Link href="/directivo/usuarios">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        Usuarios <ChevronRight className="h-3 w-3" /> Alumnos
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Perfil de Estudiante</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* COLUMNA IZQUIERDA: Hero Card del Alumno */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="border-none shadow-md bg-white overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
                        <CardContent className="pt-0 relative px-6 pb-6 text-center">
                            <div className="mx-auto flex h-24 w-24 -translate-y-12 items-center justify-center rounded-full border-4 border-white bg-teal-50 shadow-sm">
                                <span className="text-3xl font-bold text-teal-700">{initials}</span>
                            </div>
                            <div className="-mt-8 space-y-2">
                                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                    {alumno.profiles?.nombre} {alumno.profiles?.apellidos}
                                </h2>
                                <p className="text-sm font-mono bg-slate-100 text-slate-600 py-0.5 px-3 rounded-full inline-block">
                                    {alumno.matricula}
                                </p>
                                <div className="flex items-center justify-center gap-2 pt-2">
                                    <Badge variant={alumno.profiles?.activo ? 'default' : 'secondary'} className={alumno.profiles?.activo ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                        {alumno.profiles?.activo ? 'Cursando' : 'Inactivo'}
                                    </Badge>
                                    <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                                        {alumno.grado}° {alumno.grupo}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contacto Card */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                                <User className="h-4 w-4 text-emerald-500" />
                                Información General
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-md">
                                    <Hash className="h-4 w-4 text-slate-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">CURP</p>
                                    <p className="text-sm font-medium text-slate-900 font-mono">
                                        {alumno.curp || <span className="text-slate-400 italic">No especificado</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-md">
                                    <Mail className="h-4 w-4 text-slate-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Correo Institucional</p>
                                    <p className="text-sm font-medium text-slate-900 break-all">
                                        {alumno.profiles?.email || <span className="text-slate-400 italic">No especificado</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-md">
                                    <Phone className="h-4 w-4 text-slate-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Teléfono Personal</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {alumno.profiles?.telefono || <span className="text-slate-400 italic">No especificado</span>}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* COLUMNA DERECHA: Padres/Tutores y Académico */}
                <div className="md:col-span-2 space-y-6">

                    {/* Tarjeta de Resumen Académico Rápido */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-indigo-100 text-sm font-medium mb-1">Nivel Actual</p>
                                    <p className="text-3xl font-bold">{alumno.grado}° Grado</p>
                                </div>
                                <BookOpen className="h-10 w-10 text-indigo-200 opacity-80" />
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-slate-300 text-sm font-medium mb-1">Grupo Asignado</p>
                                    <p className="text-3xl font-bold">Grupo {alumno.grupo}</p>
                                </div>
                                <Users className="h-10 w-10 text-slate-600 opacity-80" />
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2 border-b border-slate-100">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                                <Users className="h-5 w-5 text-purple-500" />
                                Padres / Tutores Asignados
                            </CardTitle>
                            <CardDescription>
                                Responsables legales y de contacto del estudiante.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {alumno.padre_alumno && alumno.padre_alumno.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-1">
                                    {alumno.padre_alumno.map((relacion: any) => {
                                        const padreProfile = relacion.padres?.profiles
                                        if (!padreProfile) return null
                                        const padreInitials = getInitials(padreProfile.nombre, padreProfile.apellidos)

                                        return (
                                            <div key={relacion.padre_id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-purple-200 hover:shadow-md">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold shrink-0">
                                                        {padreInitials}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="font-semibold text-slate-900 text-base leading-none">
                                                            {padreProfile.nombre} {padreProfile.apellidos}
                                                        </h3>
                                                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 pt-1 text-sm text-slate-500">
                                                            {padreProfile.email ? (
                                                                <span className="flex items-center gap-1.5">
                                                                    <Mail className="h-3.5 w-3.5" />
                                                                    {padreProfile.email}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 italic">Sin correo</span>
                                                            )}
                                                            {padreProfile.telefono ? (
                                                                <span className="flex items-center gap-1.5">
                                                                    <Phone className="h-3.5 w-3.5" />
                                                                    {padreProfile.telefono}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 italic">Sin teléfono</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end mt-2 sm:mt-0">
                                                    <Button variant="outline" size="sm" className="w-full sm:w-auto group-hover:bg-purple-50 group-hover:text-purple-700 group-hover:border-purple-200" asChild>
                                                        <Link href={`/directivo/usuarios/padres/${relacion.padres?.user_id}`}>
                                                            Ver Perfil
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                        <Users className="h-8 w-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900 mb-1">Sin tutores asignados</h3>
                                    <p className="text-sm max-w-sm">
                                        Este estudiante no tiene cuentas de padres o tutores vinculadas actualmente. Puedes asociarlos desde el menú de Relaciones.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
