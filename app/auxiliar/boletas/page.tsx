'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Trash2, Download, Search } from 'lucide-react'
import { obtenerTodasLasBoletas, eliminarBoleta } from '@/app/actions/boletas-actions'
import { obtenerAlumnos } from '@/app/actions/usuarios-actions'
import { Alumno } from '@/app/types/usuarios'
import FormularioSubirBoleta from '@/app/directivo/boletas/FormularioSubirBoleta'

interface Boleta {
    id: string
    alumno_id: string
    periodo: string
    ciclo_escolar: string
    archivo_url: string
    archivo_nombre: string
    fecha_subida: string
    notas?: string
    alumnos?: {
        matricula: string
        grado: string
        grupo: string
        profiles: {
            nombre: string
            apellidos: string
        }
    } | any
}

export default function AuxiliarBoletas() {
    const router = useRouter()
    const [alumnos, setAlumnos] = useState<Alumno[]>([])
    const [boletas, setBoletas] = useState<Boleta[]>([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setLoading(true)
        try {
            const alumnosResult = await obtenerAlumnos()
            if (alumnosResult.success && alumnosResult.data) {
                setAlumnos(alumnosResult.data)
            }

            const boletasResult = await obtenerTodasLasBoletas()
            if (boletasResult.success && boletasResult.data) {
                setBoletas(boletasResult.data)
            }

        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEliminarBoleta = async (boletaId: string) => {
        if (!confirm('¿Estás seguro de eliminar esta boleta?')) {
            return
        }

        try {
            const result = await eliminarBoleta(boletaId)

            if (result.success) {
                alert('Boleta eliminada exitosamente')
                await cargarDatos()
            } else {
                alert('Error: ' + result.error)
            }

        } catch (error) {
            console.error('Error:', error)
            alert('Error al eliminar la boleta')
        }
    }

    const boletasFiltradas = boletas.filter(boleta => {
        const busquedaLower = busqueda.toLowerCase()
        const alumno = Array.isArray(boleta.alumnos) ? boleta.alumnos[0] : boleta.alumnos
        const profiles = alumno?.profiles ? (Array.isArray(alumno.profiles) ? alumno.profiles[0] : alumno.profiles) : null

        return (
            alumno?.matricula?.toLowerCase().includes(busquedaLower) ||
            profiles?.nombre?.toLowerCase().includes(busquedaLower) ||
            profiles?.apellidos?.toLowerCase().includes(busquedaLower) ||
            boleta.periodo.toLowerCase().includes(busquedaLower) ||
            boleta.ciclo_escolar.toLowerCase().includes(busquedaLower)
        )
    })

    // Agrupar boletas para detectar versiones múltiples
    const boletasConVersion = boletasFiltradas.map(boleta => {
        const mismaPeriodoCiclo = boletasFiltradas.filter(
            b => b.alumno_id === boleta.alumno_id &&
                b.periodo === boleta.periodo &&
                b.ciclo_escolar === boleta.ciclo_escolar
        )

        const versionesMultiples = mismaPeriodoCiclo.length > 1
        const esUltima = versionesMultiples &&
            mismaPeriodoCiclo.every(b => new Date(b.fecha_subida) <= new Date(boleta.fecha_subida))

        return {
            ...boleta,
            tieneVersiones: versionesMultiples,
            esVersionMasReciente: esUltima,
            numeroVersion: mismaPeriodoCiclo
                .sort((a, b) => new Date(b.fecha_subida).getTime() - new Date(a.fecha_subida).getTime())
                .findIndex(b => b.id === boleta.id) + 1,
            totalVersiones: mismaPeriodoCiclo.length
        }
    })

    if (loading && boletas.length === 0) {
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

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Boletas (Auxiliar)</h1>
                    <p className="text-gray-600">Sube y administra las boletas de calificaciones en PDF</p>
                </div>

                {/* Formulario para subir boleta */}
                <FormularioSubirBoleta alumnos={alumnos} onBoletaSubida={cargarDatos} />

                {/* Lista de boletas */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Boletas Subidas</CardTitle>
                                <CardDescription>
                                    {boletasConVersion.length} boleta{boletasConVersion.length !== 1 ? 's' : ''} en el sistema
                                </CardDescription>
                            </div>
                            <div className="w-64">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder="Buscar..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {boletasConVersion.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                <p>No hay boletas subidas aún</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {boletasConVersion.map((boleta) => {
                                    const alumno = Array.isArray(boleta.alumnos) ? boleta.alumnos[0] : boleta.alumnos
                                    const profiles = alumno?.profiles ? (Array.isArray(alumno.profiles) ? alumno.profiles[0] : alumno.profiles) : null

                                    return (
                                        <div
                                            key={boleta.id}
                                            className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${boleta.esVersionMasReciente ? 'border-green-300 bg-green-50/30' : ''
                                                }`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileText className="h-4 w-4 text-blue-600" />
                                                    <span className="font-semibold">
                                                        {profiles?.nombre || ''} {profiles?.apellidos || ''}
                                                    </span>
                                                    <Badge variant="outline">{alumno?.matricula || '-'}</Badge>
                                                    {boleta.tieneVersiones && (
                                                        <>
                                                            {boleta.esVersionMasReciente ? (
                                                                <Badge variant="default" className="bg-green-600">
                                                                    Versión Actual
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="secondary">
                                                                    Versión {boleta.numeroVersion} de {boleta.totalVersiones}
                                                                </Badge>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium">{boleta.periodo}</span> • {boleta.ciclo_escolar} • {alumno?.grado || '-'}° {alumno?.grupo || '-'}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Subido: {new Date(boleta.fecha_subida).toLocaleString('es-MX', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                                {boleta.notas && (
                                                    <div className="text-xs text-gray-500 mt-1 italic">
                                                        {boleta.notas}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => window.open(boleta.archivo_url, '_blank')}
                                                >
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Ver PDF
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleEliminarBoleta(boleta.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
