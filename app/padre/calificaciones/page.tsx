'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Award, FileText, Download, Calendar, User } from 'lucide-react'
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

export default function CalificacionesPadre() {
  const router = useRouter()
  const [hijos, setHijos] = useState<Alumno[]>([])
  const [hijoSeleccionado, setHijoSeleccionado] = useState<string>('')
  const [boletas, setBoletas] = useState<Boleta[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingBoletas, setLoadingBoletas] = useState(false)

  useEffect(() => {
    cargarHijos()
  }, [])

  useEffect(() => {
    if (hijoSeleccionado) {
      cargarBoletas(hijoSeleccionado)
    }
  }, [hijoSeleccionado])

  const cargarHijos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Obtener hijos del padre
      const { data: hijosData } = await supabase
        .from('alumnos')
        .select('*, profiles(nombre, apellidos)')
        .eq('padre_id', user.id)

      if (hijosData && hijosData.length > 0) {
        setHijos(hijosData)
        setHijoSeleccionado(hijosData[0].id) // Seleccionar el primer hijo por defecto
      }

    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar información de los hijos')
    } finally {
      setLoading(false)
    }
  }

  const cargarBoletas = async (alumnoId: string) => {
    setLoadingBoletas(true)
    try {
      const result = await obtenerBoletasAlumno(alumnoId)
      if (result.success && result.data) {
        setBoletas(result.data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoadingBoletas(false)
    }
  }

  if (loading && hijos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (hijos.length === 0) {
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
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No tienes hijos registrados en el sistema</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const hijoActual = hijos.find(h => h.id === hijoSeleccionado)

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
        {/* Selector de hijo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-6 w-6 text-blue-600" />
              Boletas de Calificaciones
            </CardTitle>
            <CardDescription>
              Consulta las boletas oficiales de calificaciones de tus hijos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Seleccionar hijo:
              </label>
              <Select value={hijoSeleccionado} onValueChange={setHijoSeleccionado}>
                <SelectTrigger className="w-full md:w-96">
                  <SelectValue placeholder="Selecciona un hijo" />
                </SelectTrigger>
                <SelectContent>
                  {hijos.map((hijo) => (
                    <SelectItem key={hijo.id} value={hijo.id}>
                      {hijo.profiles.nombre} {hijo.profiles.apellidos} - {hijo.matricula}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingBoletas ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{boletas.length}</div>
                  <div className="text-sm text-gray-600">Boletas Disponibles</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{hijoActual?.grado}°</div>
                  <div className="text-sm text-gray-600">Grado</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{hijoActual?.grupo}</div>
                  <div className="text-sm text-gray-600">Grupo</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información del hijo seleccionado */}
        {hijoActual && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <User className="h-12 w-12 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold">
                    {hijoActual.profiles.nombre} {hijoActual.profiles.apellidos}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Matrícula: {hijoActual.matricula} • Grado: {hijoActual.grado}° {hijoActual.grupo}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de boletas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Boletas por Periodo
            </CardTitle>
            <CardDescription>
              Descarga las boletas de calificaciones oficiales
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingBoletas ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando boletas...</p>
              </div>
            ) : boletas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-semibold">No hay boletas disponibles aún</p>
                <p className="text-sm mt-2">
                  Las boletas serán publicadas por el directivo al final de cada periodo
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {boletas.map((boleta) => (
                  <div
                    key={boleta.id}
                    className="flex items-center justify-between p-6 border-2 rounded-lg hover:border-blue-300 transition-colors bg-white"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          Boleta - {boleta.periodo}
                        </h3>
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
                              day: 'numeric'
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
                ))}
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
                <p className="font-semibold mb-2">Información importante:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Las boletas se publican al final de cada periodo escolar</li>
                  <li>Descarga y guarda las boletas para el historial académico</li>
                  <li>Si encuentras algún error, contacta a la dirección escolar</li>
                  <li>Las boletas contienen las calificaciones oficiales finales</li>
                  <li>Puedes descargar las boletas de todos tus hijos desde este portal</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
