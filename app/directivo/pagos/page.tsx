'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { obtenerPagosDirectivo, crearPagoDirectivo } from '@/app/actions/pagos-actions'
import { obtenerAlumnos } from '@/app/actions/usuarios-actions'
import { ArrowLeft } from 'lucide-react';
import { Plus } from 'lucide-react';
import { DollarSign } from 'lucide-react';
import { marcarPagoComoPagado } from '@/app/actions/pagos-actions'


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

interface Pago {
  id: string
  concepto: string
  monto: number
  status: string
  fecha_entrega: string
  alumnos: Alumno
}

export default function DirectivoPagos() {
  const router = useRouter()
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [markingAsPaidId, setMarkingAsPaidId] = useState<string | null>(null)
  
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const alumnosResult = await obtenerAlumnos()
      if (alumnosResult.success) {
        setAlumnos(alumnosResult.data || [])
      } else {
        setError(alumnosResult.error)
      }

      const pagosResult = await obtenerPagosDirectivo()
      if (pagosResult.success) {
        setPagos(pagosResult.data || [])
      } else {
        setError(pagosResult.error)
        // Si no está autorizado, podría redirigir
        if (pagosResult.error === 'No autorizado') {
          router.push('/login')
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado al cargar los datos.')
    } finally {
      setLoading(false)
    }
  }

  const handleCrearPago = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formRef.current) return

    setCreando(true)
    setError(null)

    const formData = new FormData(formRef.current)
    const result = await crearPagoDirectivo(formData)

    if (result.success) {
      alert('Pago creado exitosamente')
      setMostrarForm(false)
      formRef.current.reset()
      await cargarDatos() // Recargar la lista de pagos
    } else {
      setError(result.error || 'Ocurrió un error al crear el pago.')
    }

    setCreando(false)
  }

  const handleMarcarComoPagado = async (pagoId: string) => {
    if (!confirm('¿Estás seguro de que deseas marcar este pago como liquidado?')) return

    setError(null)
    setMarkingAsPaidId(pagoId)
    try {
      const result = await marcarPagoComoPagado(pagoId)

      if (result.success) {
        alert('Pago actualizado exitosamente')
        await cargarDatos()
      } else {
        setError(result.error || 'Ocurrió un error al actualizar el pago.')
      }
    } finally {
      setMarkingAsPaidId(null)
    }
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/directivo')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Gestion de Pagos</h1>
            </div>
            <Button onClick={() => setMostrarForm(!mostrarForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {mostrarForm ? 'Cancelar' : 'Nuevo Pago'}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {error && <p className="text-red-500 text-sm bg-red-100 p-3 rounded-md">Error: {error}</p>}
        {mostrarForm && (
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Pago</CardTitle>
              <CardDescription>Genera un cobro para un alumno</CardDescription>
            </CardHeader>
            <CardContent>
              <form ref={formRef} onSubmit={handleCrearPago} className="space-y-4">
                <div>
                  <Label>Alumno</Label>
                  <select
                    name="alumno_id"
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    required
                    disabled={creando}
                  >
                    <option value="">Selecciona un alumno</option>
                    {alumnos.map((alumno) => (
                      <option key={alumno.id} value={alumno.id}>
                        {alumno.matricula} - {alumno.profiles.nombre} {alumno.profiles.apellidos} ({alumno.grado} {alumno.grupo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Concepto</Label>
                  <Input
                    name="concepto"
                    placeholder="Ej: Colegiatura Enero 2025"
                    required
                    disabled={creando}
                  />
                </div>

                <div>
                  <Label>Descripcion (opcional)</Label>
                  <textarea
                    name="descripcion"
                    placeholder="Descripcion del pago..."
                    className="w-full mt-1 px-3 py-2 border rounded-md min-h-[80px]"
                    disabled={creando}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Monto (MXN)</Label>
                    <Input
                      name="monto"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      required
                      disabled={creando}
                    />
                  </div>

                  <div>
                    <Label>Fecha de Vencimiento</Label>
                    <Input
                      name="fecha_entrega"
                      type="date"
                      required
                      disabled={creando}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={creando} className="w-full">
                  {creando ? 'Creando...' : 'Crear Pago'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Pagos Recientes</CardTitle>
            <CardDescription>Ultimos pagos creados en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {pagos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No hay pagos creados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pagos.filter(p => p.alumnos && p.alumnos.profiles).map((pago) => (
                  <div key={pago.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{pago.concepto}</h3>
                        <Badge variant={
                          pago.status === 'pagado' ? 'default' :
                          pago.status === 'vencido' ? 'destructive' : 'outline'
                        }>
                          {pago.status === 'pagado' ? 'Pagado' :
                           pago.status === 'vencido' ? 'Vencido' : 'Pendiente'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {pago.alumnos.profiles.nombre} {pago.alumnos.profiles.apellidos} - {pago.alumnos.matricula}
                      </p>
                      <p className="text-xs text-gray-500">
                        Vence: {new Date(pago.fecha_entrega).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div className="text-xl font-bold">
                        ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
                      {pago.status !== 'pagado' && (
                        <Button 
                          size="sm"
                          onClick={() => handleMarcarComoPagado(pago.id)}
                          disabled={markingAsPaidId === pago.id}
                        >
                          {markingAsPaidId === pago.id ? 'Cargando...' : 'Marcar como Pagado'}
                        </Button>
                      )}
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