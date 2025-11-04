'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Trash2, Download, Search } from 'lucide-react'
import { obtenerTodasLasBoletas, eliminarBoleta } from '@/app/actions/boletas-actions'
import { obtenerAlumnos, Alumno } from '@/app/actions/usuarios-actions'
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
  alumnos: {
    matricula: string
    grado: string
    grupo: string
    profiles: {
      nombre: string
      apellidos: string
    }
  }
}

export default function DirectivoBoletas() {
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
    return (
      boleta.alumnos.matricula.toLowerCase().includes(busquedaLower) ||
      boleta.alumnos.profiles.nombre.toLowerCase().includes(busquedaLower) ||
      boleta.alumnos.profiles.apellidos.toLowerCase().includes(busquedaLower) ||
      boleta.periodo.toLowerCase().includes(busquedaLower) ||
      boleta.ciclo_escolar.toLowerCase().includes(busquedaLower)
    )
  })

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
                  {boletasFiltradas.length} boleta{boletasFiltradas.length !== 1 ? 's' : ''} en el sistema
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
            {boletasFiltradas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p>No hay boletas subidas aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {boletasFiltradas.map((boleta) => (
                  <div
                    key={boleta.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">
                          {boleta.alumnos.profiles.nombre} {boleta.alumnos.profiles.apellidos}
                        </span>
                        <Badge variant="outline">{boleta.alumnos.matricula}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{boleta.periodo}</span> • {boleta.ciclo_escolar} • {boleta.alumnos.grado}° {boleta.alumnos.grupo}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Subido: {new Date(boleta.fecha_subida).toLocaleDateString('es-MX')}
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
