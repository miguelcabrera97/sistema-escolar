'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, ArrowLeft, Search, CheckSquare, Square } from 'lucide-react'
import { crearPagosMasivos, obtenerPadresConAlumnos } from '@/app/actions/pagos-actions'

interface Padre {
    id: string
    profiles: {
        nombre: string
        apellidos: string
        email: string
    }
    padre_alumno: Array<{
        alumno_id: string
        alumnos: {
            id: string
            matricula: string
            grado: string
            grupo: string
            profiles: {
                nombre: string
                apellidos: string
            }
        }
    }>
}

export default function PagosMasivosPage() {
    const router = useRouter()
    const [padres, setPadres] = useState<Padre[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [conceptoNombre, setConceptoNombre] = useState('')
    const [alumnosSeleccionados, setAlumnosSeleccionados] = useState<Set<string>>(new Set())
    const [monto, setMonto] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [fechaVencimiento, setFechaVencimiento] = useState('')
    const [busqueda, setBusqueda] = useState('')

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setLoading(true)
        try {
            const padresResult = await obtenerPadresConAlumnos()
            if (padresResult.success) {
                setPadres(padresResult.data || [])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleTogglePadre = (padre: Padre) => {
        const newSet = new Set(alumnosSeleccionados)
        const alumnosDelPadre = padre.padre_alumno.map(pa => `${padre.id}_${pa.alumno_id}`)
        const todosSeleccionados = alumnosDelPadre.every(id => newSet.has(id))

        if (todosSeleccionados) {
            alumnosDelPadre.forEach(id => newSet.delete(id))
        } else {
            alumnosDelPadre.forEach(id => newSet.add(id))
        }
        setAlumnosSeleccionados(newSet)
    }

    const handleToggleAlumno = (padreId: string, alumnoId: string) => {
        const id = `${padreId}_${alumnoId}`
        const newSet = new Set(alumnosSeleccionados)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setAlumnosSeleccionados(newSet)
    }

    const padresFiltrados = useMemo(() => {
        if (!busqueda) return padres
        const searchLower = busqueda.toLowerCase()
        return padres.filter(padre =>
            padre.profiles.nombre.toLowerCase().includes(searchLower) ||
            padre.profiles.apellidos.toLowerCase().includes(searchLower) ||
            padre.profiles.email.toLowerCase().includes(searchLower) ||
            padre.padre_alumno.some(rel =>
                rel.alumnos.profiles.nombre.toLowerCase().includes(searchLower) ||
                rel.alumnos.profiles.apellidos.toLowerCase().includes(searchLower) ||
                rel.alumnos.matricula.toLowerCase().includes(searchLower)
            )
        )
    }, [padres, busqueda])

    const totalAlumnosVisibles = useMemo(() => {
        return padresFiltrados.reduce((acc, p) => acc + p.padre_alumno.length, 0)
    }, [padresFiltrados])

    const handleSeleccionarTodos = () => {
        const totalAlumnosFiltrados = padresFiltrados.flatMap(p =>
            p.padre_alumno.map(pa => `${p.id}_${pa.alumno_id}`)
        )

        if (alumnosSeleccionados.size === totalAlumnosFiltrados.length && totalAlumnosFiltrados.length > 0) {
            setAlumnosSeleccionados(new Set())
        } else {
            setAlumnosSeleccionados(new Set(totalAlumnosFiltrados))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!conceptoNombre || alumnosSeleccionados.size === 0 || !monto || !fechaVencimiento) {
            alert('Por favor completa todos los campos requeridos y selecciona al menos un alumno')
            return
        }

        const payloadAlumnos = Array.from(alumnosSeleccionados).map(id => {
            const [padre_id, alumno_id] = id.split('_')
            return { padre_id, alumno_id }
        })

        if (!confirm(
            `Se crearán ${payloadAlumnos.length} pagos.\n` +
            `Monto total: $${(parseFloat(monto) * payloadAlumnos.length).toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n\n` +
            `¿Continuar?`
        )) {
            return
        }

        setSubmitting(true)
        try {
            const result = await crearPagosMasivos({
                concepto: conceptoNombre,
                alumnos: payloadAlumnos,
                monto: parseFloat(monto),
                descripcion: descripcion || undefined,
                fecha_vencimiento: fechaVencimiento
            })

            if (result.success) {
                alert(`${result.data.total} pagos creados exitosamente`)
                router.push('/directivo/pagos')
            } else {
                alert('Error: ' + result.error)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Error al crear los pagos')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando datos...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.push('/directivo/pagos')}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver a Pagos
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Crear Pagos Masivos</h1>
                            <p className="text-sm text-gray-600">Genera cobros para múltiples alumnos al mismo tiempo</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Información del pago */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Información del Pago</CardTitle>
                            <CardDescription>Define el concepto y monto que se aplicará a todos los alumnos seleccionados</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Concepto de Pago *</Label>
                                    <Input
                                        type="text"
                                        placeholder="Ej: Colegiatura Marzo, Inscripción..."
                                        value={conceptoNombre}
                                        onChange={(e) => setConceptoNombre(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Monto por alumno (MXN) *</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={monto}
                                        onChange={(e) => setMonto(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Descripción (opcional)</Label>
                                <Textarea
                                    placeholder="Información adicional sobre el pago..."
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    rows={2}
                                />
                            </div>

                            <div className="max-w-xs">
                                <Label>Fecha de Vencimiento *</Label>
                                <Input
                                    type="date"
                                    value={fechaVencimiento}
                                    onChange={(e) => setFechaVencimiento(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Selección de alumnos */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Seleccionar Alumnos
                                    </CardTitle>
                                    <CardDescription>
                                        Selecciona los alumnos a los que se les generará el cobro
                                    </CardDescription>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSeleccionarTodos}
                                >
                                    {alumnosSeleccionados.size === totalAlumnosVisibles && totalAlumnosVisibles > 0
                                        ? (
                                            <>
                                                <Square className="h-4 w-4 mr-1" />
                                                Deseleccionar Todos
                                            </>
                                        ) : (
                                            <>
                                                <CheckSquare className="h-4 w-4 mr-1" />
                                                Seleccionar Todos
                                            </>
                                        )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Buscador */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    className="pl-9"
                                    placeholder="Buscar padre o alumno..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                />
                            </div>

                            {/* Resumen de selección */}
                            {alumnosSeleccionados.size > 0 && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <p className="text-sm font-medium text-blue-900">
                                        {alumnosSeleccionados.size} alumno{alumnosSeleccionados.size !== 1 ? 's' : ''} seleccionado{alumnosSeleccionados.size !== 1 ? 's' : ''}
                                    </p>
                                    {monto && (
                                        <p className="text-xs text-blue-700 mt-1">
                                            Monto total a generar: ${(parseFloat(monto || '0') * alumnosSeleccionados.size).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Lista de padres y alumnos */}
                            <div className="border rounded-lg max-h-[500px] overflow-y-auto divide-y">
                                {padresFiltrados.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                                        <p>No se encontraron padres/alumnos</p>
                                    </div>
                                ) : (
                                    padresFiltrados.map((padre) => {
                                        const todosSusAlumnosSeleccionados = padre.padre_alumno.every(
                                            pa => alumnosSeleccionados.has(`${padre.id}_${pa.alumno_id}`)
                                        )
                                        const algunAlumnoSeleccionado = padre.padre_alumno.some(
                                            pa => alumnosSeleccionados.has(`${padre.id}_${pa.alumno_id}`)
                                        )

                                        return (
                                            <div key={padre.id} className="p-4 hover:bg-gray-50">
                                                {/* Padre */}
                                                <div className="flex items-center gap-3 mb-2">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        checked={todosSusAlumnosSeleccionados}
                                                        ref={(el) => {
                                                            if (el) {
                                                                el.indeterminate = !todosSusAlumnosSeleccionados && algunAlumnoSeleccionado
                                                            }
                                                        }}
                                                        onChange={() => handleTogglePadre(padre)}
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-sm">
                                                            {padre.profiles.nombre} {padre.profiles.apellidos}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{padre.profiles.email}</p>
                                                    </div>
                                                </div>

                                                {/* Alumnos del padre */}
                                                <div className="ml-8 space-y-1 border-l-2 border-gray-100 pl-4 py-1">
                                                    {padre.padre_alumno.map((rel) => (
                                                        <div
                                                            key={rel.alumno_id}
                                                            className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-gray-100 rounded"
                                                            onClick={() => handleToggleAlumno(padre.id, rel.alumno_id)}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                checked={alumnosSeleccionados.has(`${padre.id}_${rel.alumno_id}`)}
                                                                onChange={() => handleToggleAlumno(padre.id, rel.alumno_id)}
                                                            />
                                                            <div className="text-sm flex items-center gap-2">
                                                                <span className="font-medium text-gray-700">
                                                                    {rel.alumnos.profiles.nombre} {rel.alumnos.profiles.apellidos}
                                                                </span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {rel.alumnos.matricula}
                                                                </Badge>
                                                                <span className="text-gray-400 text-xs">
                                                                    {rel.alumnos.grado}° {rel.alumnos.grupo}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Acciones */}
                    <div className="flex justify-between items-center">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/directivo/pagos')}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || alumnosSeleccionados.size === 0 || !conceptoNombre || !monto || !fechaVencimiento}
                            className="min-w-[200px]"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creando pagos...
                                </>
                            ) : (
                                `Crear ${alumnosSeleccionados.size > 0 ? alumnosSeleccionados.size : ''} Pago${alumnosSeleccionados.size !== 1 ? 's' : ''}`
                            )}
                        </Button>
                    </div>
                </form>
            </main>
        </div>
    )
}
