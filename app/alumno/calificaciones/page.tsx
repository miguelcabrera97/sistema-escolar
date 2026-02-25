'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Award, FileText, Download, Calendar } from 'lucide-react'
import { obtenerBoletasAlumno } from '@/app/actions/boletas-actions'

interface Profile {
  nombre: string
  apellidos: string
}

interface Alumno {
  id: string
  matricula: string
  grado: string
  grupo: string
  profiles: Profile
}

interface Boleta {
  id: string
  periodo: string
  ciclo_escolar: string
  archivo_url: string
  archivo_nombre: string
  fecha_subida: string
  notas?: string
  subido_por_nombre?: string
}

export default function CalificacionesAlumno() {
  const router = useRouter()
  const [alumno, setAlumno] = useState<Alumno | null>(null)
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: alumnoData } = await supabase
        .from('alumnos')
        .select('*, profiles(nombre, apellidos)')
        .eq('user_id', user.id)
        .single()

      if (!alumnoData) {
        alert('No se encontró información del alumno')
        return
      }

      setAlumno(alumnoData)

      // Obtener boletas del alumno
      const result = await obtenerBoletasAlumno(alumnoData.id)
      if (result.success && result.data) {
        setBoletas(result.data)
      }

    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar las boletas')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando boletas...</p>
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
            Volver al Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header con información del alumno */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-blue-600" />
              Mis Boletas de Calificaciones
            </CardTitle>
            <CardDescription>
              {alumno?.profiles.nombre} {alumno?.profiles.apellidos} - Matrícula: {alumno?.matricula}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{boletas.length}</div>
                <div className="text-sm text-gray-600">Boletas Disponibles</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{alumno?.grado}°</div>
                <div className="text-sm text-gray-600">Grado Actual</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{alumno?.grupo}</div>
                <div className="text-sm text-gray-600">Grupo</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de boletas disponibles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Boletas por Periodo
            </CardTitle>
            <CardDescription>
              Descarga tus boletas de calificaciones oficiales
            </CardDescription>
          </CardHeader>
          <CardContent>
            {boletas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-semibold">No hay boletas disponibles aún</p>
                <p className="text-sm mt-2">
                  Las boletas serán publicadas por el directivo al final de cada periodo
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {boletas.map((boleta, index) => {
                  // Determinar si hay múltiples versiones del mismo periodo/ciclo
                  const versionesSimilares = boletas.filter(
                    b => b.periodo === boleta.periodo && b.ciclo_escolar === boleta.ciclo_escolar
                  )
                  const tieneVersiones = versionesSimilares.length > 1
                  const esVersionMasReciente = tieneVersiones &&
                    versionesSimilares.every(b => new Date(b.fecha_subida) <= new Date(boleta.fecha_subida))

                  return (
                    <div
                      key={boleta.id}
                      className={`flex items-center justify-between p-6 border-2 rounded-lg hover:border-blue-300 transition-colors ${esVersionMasReciente ? 'bg-green-50 border-green-300' : 'bg-white'
                        }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-gray-900">
                              Boleta - {boleta.periodo}
                            </h3>
                            {esVersionMasReciente && tieneVersiones && (
                              <Badge className="bg-green-600">Versión Actual</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {boleta.ciclo_escolar}
                            </span>
                            <span>•</span>
                            <span>
                              Publicado: {new Date(boleta.fecha_subida).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {boleta.notas && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                              {boleta.notas}
                            </p>
                          )}
                        </div>
                      </div>

                      <Button
                        size="lg"
                        onClick={() => window.open(boleta.archivo_url, '_blank')}
                        className="ml-4"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-2">Sobre tus boletas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Las boletas se publican al final de cada periodo escolar</li>
                  <li>Descarga y guarda tus boletas para tu historial académico</li>
                  <li>Si encuentras algún error, contacta a la dirección escolar</li>
                  <li>Las boletas contienen todas tus calificaciones oficiales</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
