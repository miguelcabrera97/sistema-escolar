'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users, UserPlus, List } from 'lucide-react'
import { obtenerTodasLasRelaciones, obtenerPadresSinAlumnos, obtenerAlumnosSinPadre } from '@/app/actions/relaciones-padre-alumno-actions'
import { migrarPadresExistentes, obtenerEstadisticasMigracion } from '@/app/actions/migrar-padres-actions'
import { DialogoAsignarAlumnos } from './DialogoAsignarAlumnos'
import { TablaRelaciones } from './TablaRelaciones'

interface Relacion {
  id: string
  parentesco: string | null
  padre: {
    id: string
    profiles: {
      nombre: string
      apellidos: string
      email: string
    }
  } | null
  alumno: {
    id: string
    matricula: string
    grado: string
    grupo: string
    profiles: {
      nombre: string
      apellidos: string
    }
  } | null
}

interface Padre {
  id: string
  user_id: string
  profiles: {
    nombre: string
    apellidos: string
    email: string
  }
}

interface Alumno {
  id: string
  matricula: string
  grado: string
  grupo: string
  profiles: {
    nombre: string
    apellidos: string
  }
}

export default function RelacionesPadreAlumno() {
  const router = useRouter()
  const [relaciones, setRelaciones] = useState<Relacion[]>([])
  const [padresSinAlumnos, setPadresSinAlumnos] = useState<Padre[]>([])
  const [alumnosSinPadre, setAlumnosSinPadre] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogoAsignarAbierto, setDialogoAsignarAbierto] = useState(false)
  const [necesitaMigracion, setNecesitaMigracion] = useState(false)
  const [migrandoPadres, setMigrandoPadres] = useState(false)
  const [totalPadresDisponibles, setTotalPadresDisponibles] = useState(0)

  useEffect(() => {
    cargarDatos()
    verificarMigracion()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [relacionesResult, padresResult, alumnosResult] = await Promise.all([
        obtenerTodasLasRelaciones(),
        obtenerPadresSinAlumnos(),
        obtenerAlumnosSinPadre()
      ])

      if (relacionesResult.success) {
        setRelaciones(relacionesResult.data || [])
      }

      if (padresResult.success) {
        setPadresSinAlumnos(padresResult.data || [])
      }

      if (alumnosResult.success) {
        setAlumnosSinPadre(alumnosResult.data || [])
      }

      // Calcular total de padres disponibles
      const totalPadres = (padresResult.data?.length || 0) + (relacionesResult.data?.length || 0)
      setTotalPadresDisponibles(totalPadres)
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const verificarMigracion = async () => {
    try {
      const result = await obtenerEstadisticasMigracion()
      if (result.success && result.data) {
        setNecesitaMigracion(result.data.necesitaMigracion)
      }
    } catch (error) {
      console.error('Error al verificar migración:', error)
    }
  }

  const ejecutarMigracion = async () => {
    if (!confirm('¿Deseas migrar los usuarios padre a la tabla de padres?\n\nEsto creará registros en la tabla padres para todos los usuarios con rol padre.')) {
      return
    }

    setMigrandoPadres(true)
    try {
      const result = await migrarPadresExistentes()
      if (result.success && result.data) {
        alert(
          `✅ Migración completada\n\n` +
          `Total de usuarios padre: ${result.data.total}\n` +
          `Migrados: ${result.data.migrados}\n\n` +
          `${result.data.message}`
        )
        setNecesitaMigracion(false)
        // Recargar datos después de la migración
        cargarDatos()
      } else if (!result.success) {
        alert('Error en la migración: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al ejecutar la migración')
    } finally {
      setMigrandoPadres(false)
    }
  }

  const handleSuccess = () => {
    cargarDatos()
  }

  if (loading) {
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/directivo')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Relaciones Padre-Alumno</h1>
                <p className="text-sm text-gray-600">Gestiona las relaciones entre padres y alumnos</p>
              </div>
            </div>
            <div className="flex gap-2">
              {necesitaMigracion && (
                <Button
                  variant="secondary"
                  onClick={ejecutarMigracion}
                  disabled={migrandoPadres}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {migrandoPadres ? 'Migrando...' : 'Migrar Padres'}
                </Button>
              )}
              <Button onClick={() => setDialogoAsignarAbierto(true)} disabled={totalPadresDisponibles === 0}>
                <UserPlus className="h-4 w-4 mr-2" />
                Asignar Alumno a Padre
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Relaciones</p>
                  <p className="text-2xl font-bold">{relaciones.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Padres con alumnos asignados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Padres sin Alumnos</p>
                  <p className="text-2xl font-bold text-yellow-600">{padresSinAlumnos.length}</p>
                </div>
                <Users className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Requieren asignación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alumnos sin Padre</p>
                  <p className="text-2xl font-bold text-red-600">{alumnosSinPadre.length}</p>
                </div>
                <Users className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Necesitan padre asignado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alertas */}
        {totalPadresDisponibles === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">No hay padres en el sistema</p>
                  <p className="text-sm text-blue-700 mt-1 mb-3">
                    Necesitas migrar los usuarios con rol "padre" a la tabla de padres antes de poder asignar alumnos.
                  </p>
                  {necesitaMigracion && (
                    <Button
                      onClick={ejecutarMigracion}
                      disabled={migrandoPadres}
                      size="sm"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {migrandoPadres ? 'Migrando...' : 'Migrar Padres Ahora'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {padresSinAlumnos.length > 0 && totalPadresDisponibles > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900">Padres sin alumnos asignados</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Hay {padresSinAlumnos.length} padre(s) sin alumnos asignados.
                    Haz clic en "Asignar Alumno a Padre" para vincularlos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {alumnosSinPadre.length > 0 && totalPadresDisponibles > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Alumnos sin padre asignado</p>
                  <p className="text-sm text-red-700 mt-1">
                    Hay {alumnosSinPadre.length} alumno(s) sin padre asignado.
                    Estos alumnos no podrán recibir pagos hasta que se les asigne un padre.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla de relaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Relaciones Existentes
            </CardTitle>
            <CardDescription>
              Todas las relaciones padre-alumno en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TablaRelaciones
              relaciones={relaciones}
              onSuccess={handleSuccess}
            />
          </CardContent>
        </Card>
      </main>

      {/* Diálogo para asignar */}
      <DialogoAsignarAlumnos
        open={dialogoAsignarAbierto}
        onOpenChange={setDialogoAsignarAbierto}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
