import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { obtenerPadrePorId } from '@/app/actions/usuarios-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Mail, Phone, Users, GraduationCap, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Perfil de Padre | Sistema Escolar',
    description: 'Información detallada del padre o tutor',
}

function getInitials(nombre: string, apellidos: string) {
    const n = nombre ? nombre[0].toUpperCase() : ''
    const a = apellidos ? apellidos[0].toUpperCase() : ''
    return `${n}${a}`
}

export default async function DetallePadrePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const result = await obtenerPadrePorId(id)

    if (!result.success || !result.data) {
        redirect('/directivo/usuarios')
    }

    const padre = result.data
    const hijos = padre.relacion_alumnos || []
    const initials = getInitials(padre.nombre, padre.apellidos)

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* ENCABEZADO Y NAVEGACIÓN */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200" asChild>
                    <Link href="/directivo/usuarios?tab=padres">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        Usuarios <ChevronRight className="h-3 w-3" /> Padres
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Perfil de Usuario</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* COLUMNA IZQUIERDA: Tarjeta de Perfil Hero y Contacto */}
                <div className="md:col-span-1 space-y-6">
                    {/* Hero Card */}
                    <Card className="border-none shadow-md bg-white overflow-hidden">
                        <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                        <CardContent className="pt-0 relative px-6 pb-6 text-center">
                            <div className="mx-auto flex h-24 w-24 -translate-y-12 items-center justify-center rounded-full border-4 border-white bg-indigo-100 shadow-sm">
                                <span className="text-3xl font-bold text-indigo-700">{initials}</span>
                            </div>
                            <div className="-mt-8 space-y-2">
                                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                                    {padre.nombre} {padre.apellidos}
                                </h2>
                                <div className="flex items-center justify-center gap-2">
                                    <Badge variant={padre.activo ? 'default' : 'secondary'} className={padre.activo ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                        {padre.activo ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                    <Badge variant="outline" className="capitalize text-slate-600 border-slate-200">
                                        {padre.role}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contacto Card */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                                <User className="h-4 w-4 text-blue-500" />
                                Información de Contacto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-md">
                                    <Mail className="h-4 w-4 text-slate-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Correo Electrónico</p>
                                    <p className="text-sm font-medium text-slate-900 break-all">
                                        {padre.email || <span className="text-slate-400 italic">No especificado</span>}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-slate-50 rounded-md">
                                    <Phone className="h-4 w-4 text-slate-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Teléfono</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {padre.telefono || <span className="text-slate-400 italic">No especificado</span>}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* COLUMNA DERECHA: Hijos Asociados */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm bg-white h-full">
                        <CardHeader className="pb-2 border-b border-slate-100">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                                <GraduationCap className="h-5 w-5 text-emerald-500" />
                                Alumnos a su cargo ({hijos.length})
                            </CardTitle>
                            <CardDescription>
                                Estudiantes inscritos vinculados a la cuenta de este tutor.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {hijos.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-1">
                                    {hijos.map((relacion: any) => {
                                        const alumno = relacion.alumnos
                                        if (!alumno) return null
                                        const alumnoInitials = getInitials(alumno.profiles?.nombre, alumno.profiles?.apellidos)

                                        return (
                                            <div key={relacion.alumno_id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-emerald-200 hover:shadow-md">
                                                <div className="flex flex-1 items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                                                        {alumnoInitials}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="font-semibold text-slate-900 text-base leading-none">
                                                            {alumno.profiles?.nombre} {alumno.profiles?.apellidos}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-slate-500">
                                                            <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600">
                                                                {alumno.matricula}
                                                            </span>
                                                            <span className="hidden sm:inline">•</span>
                                                            <span className="font-medium text-emerald-700">
                                                                {alumno.grado}° {alumno.grupo}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                                    <Badge variant={alumno.profiles?.activo ? 'default' : 'secondary'} className={`ml-auto sm:ml-0 ${alumno.profiles?.activo ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none' : ''}`}>
                                                        {alumno.profiles?.activo ? 'Activo' : 'Inactivo'}
                                                    </Badge>
                                                    <Button variant="outline" size="sm" className="w-full sm:w-auto group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200" asChild>
                                                        <Link href={`/directivo/usuarios/alumnos/${alumno.id}`}>
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
                                    <h3 className="text-lg font-medium text-slate-900 mb-1">Sin alumnos asociados</h3>
                                    <p className="text-sm max-w-sm">
                                        Este padre o tutor no tiene ningún alumno registrado a su cargo actualmente en el sistema.
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
