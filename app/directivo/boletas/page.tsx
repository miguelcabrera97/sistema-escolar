'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Trash2, Download, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { obtenerTodasLasBoletas, eliminarBoleta } from '@/app/actions/boletas-actions'
import { obtenerAlumnos } from '@/app/actions/usuarios-actions'
import { Alumno } from '@/app/types/usuarios'
import FormularioSubirBoleta from './FormularioSubirBoleta'

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

export default function DirectivoBoletas() {
  const router = useRouter()
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

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
  const boletasAgrupadas = boletasFiltradas.reduce((acc, boleta) => {
    const groupId = `${boleta.alumno_id}-${boleta.periodo}-${boleta.ciclo_escolar}`
    if (!acc[groupId]) {
      acc[groupId] = []
    }
    acc[groupId].push(boleta)
    return acc
  }, {} as Record<string, typeof boletasFiltradas>)

  // Convertir a array y ordenar por la fecha de la versión más reciente del grupo
  const gruposBoletas = Object.values(boletasAgrupadas).map(grupo => {
    // Ordenar versiones dentro del grupo de más reciente a más antigua
    const versionesOrdenadas = [...grupo].sort((a, b) => new Date(b.fecha_subida).getTime() - new Date(a.fecha_subida).getTime())
    return {
      id: `${versionesOrdenadas[0].alumno_id}-${versionesOrdenadas[0].periodo}-${versionesOrdenadas[0].ciclo_escolar}`,
      versionActual: versionesOrdenadas[0],
      versionesAnteriores: versionesOrdenadas.slice(1),
      totalVersiones: versionesOrdenadas.length
    }
  }).sort((a, b) => new Date(b.versionActual.fecha_subida).getTime() - new Date(a.versionActual.fecha_subida).getTime())

  if (loading && boletas.length === 0) { // Mostrar cargando solo en la carga inicial
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
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Boletas</h1>
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
                  {gruposBoletas.length} registro{gruposBoletas.length !== 1 ? 's' : ''} en el sistema
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
            {gruposBoletas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No hay boletas subidas aún</p>
              </div>
            ) : (
              <div className="space-y-4">
                {gruposBoletas.map((grupo) => {
                  const boleta = grupo.versionActual
                  const alumno = Array.isArray(boleta.alumnos) ? boleta.alumnos[0] : boleta.alumnos
                  const profiles = alumno?.profiles ? (Array.isArray(alumno.profiles) ? alumno.profiles[0] : alumno.profiles) : null
                  const isExpanded = expandedGroups.has(grupo.id)
                  const tieneAnteriores = grupo.versionesAnteriores.length > 0

                  return (
                    <div key={grupo.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                      {/* Fila Principal (Versión Actual) */}
                      <div
                        className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${tieneAnteriores && isExpanded ? 'border-b border-gray-100 bg-gray-50/50' : ''
                          }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {tieneAnteriores && (
                              <button
                                onClick={() => toggleGroup(grupo.id)}
                                className="mr-1 p-1 hover:bg-gray-200 rounded-full transition-colors focus:outline-none"
                                title={isExpanded ? "Ocultar versiones anteriores" : "Ver versiones anteriores"}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                              </button>
                            )}
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-gray-900">
                              {profiles?.nombre || ''} {profiles?.apellidos || ''}
                            </span>
                            <Badge variant="outline">{alumno?.matricula || '-'}</Badge>
                          </div>
                          <div className={`text-sm text-gray-600 ${tieneAnteriores ? 'ml-8' : 'ml-6'}`}>
                            <span className="font-medium">{boleta.periodo}</span> • {boleta.ciclo_escolar} • {alumno?.grado || '-'}° {alumno?.grupo || '-'}
                          </div>
                          <div className={`text-xs text-gray-500 mt-1 ${tieneAnteriores ? 'ml-8' : 'ml-6'}`}>
                            Subido: {new Date(boleta.fecha_subida).toLocaleString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {boleta.notas && (
                            <div className={`text-xs text-gray-500 mt-1 italic ${tieneAnteriores ? 'ml-8' : 'ml-6'}`}>
                              {boleta.notas}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(boleta.archivo_url, '_blank')}
                            title="Ver PDF Actual"
                          >
                            <Download className="h-4 w-4 md:mr-1" />
                            <span className="hidden md:inline">Ver PDF</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleEliminarBoleta(boleta.id)}
                            title="Eliminar esta boleta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Panel Expandible (Versiones Anteriores) */}
                      {isExpanded && tieneAnteriores && (
                        <div className="bg-gray-50 p-4 border-t border-gray-200">
                          <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3 ml-2">
                            Versiones Anteriores ({grupo.versionesAnteriores.length})
                          </h4>
                          <div className="space-y-2">
                            {grupo.versionesAnteriores.map((boletaAnt, index) => (
                              <div
                                key={boletaAnt.id}
                                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md"
                              >
                                <div className="flex-1 ml-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="text-xs">
                                      Versión {grupo.totalVersiones - index - 1} de {grupo.totalVersiones}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Subido: {new Date(boletaAnt.fecha_subida).toLocaleString('es-MX', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                  {boletaAnt.notas && (
                                    <div className="text-xs text-gray-500 mt-1 italic">
                                      Nota: {boletaAnt.notas}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() => window.open(boletaAnt.archivo_url, '_blank')}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    <span className="text-xs">Ver PDF</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleEliminarBoleta(boletaAnt.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
