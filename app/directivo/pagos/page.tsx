'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, DollarSign, ArrowLeft } from 'lucide-react'

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
  fecha_vencimiento: string
  alumnos: Alumno
}

export default function DirectivoPagos() {
  const router = useRouter()
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [creando, setCreando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  
  const [formData, setFormData] = useState({
    alumno_id: '',
    concepto: '',
    descripcion: '',
    monto: '',
    fecha_vencimiento: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const { data: alumnosData } = await supabase
        .from('alumnos')
        .select('id, matricula, grado, grupo, profiles(nombre, apellidos)')
        .order('matricula')

      if (alumnosData) {
        setAlumnos(alumnosData)
      }

      const { data: pagosData } = await supabase
        .from('pagos')
        .select('*, alumnos(id, matricula, grado, grupo, profiles(nombre, apellidos))')
        .order('created_at', { ascending: false })
        .limit(20)

      if (pagosData) {
        setPagos(pagosData)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const crearPago = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreando(true)

    try {
      const { error } = await supabase
        .from('pagos')
        .insert({
          alumno_id: formData.alumno_id,
          concepto: formData.concepto,
          descripcion: formData.descripcion || null,
          monto: parseFloat(formData.monto),
          fecha_vencimiento: formData.fecha_vencimiento,
          status: 'pendiente'
        })

      if (error) throw error

      alert('Pago creado exitosamente')
      setMostrarForm(false)
      setFormData({
        alumno_id: '',
        concepto: '',
        descripcion: '',
        monto: '',
        fecha_vencimiento: ''
      })
      await cargarDatos()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al crear el pago')
    } finally {
      setCreando(false)
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
        {mostrarForm && (
          <Card>
            <CardHeader>
              <CardTitle>Crear Nuevo Pago</CardTitle>
              <CardDescription>Genera un cobro para un alumno</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={crearPago} className="space-y-4">
                <div>
                  <Label>Alumno</Label>
                  <select
                    value={formData.alumno_id}
                    onChange={(e) => setFormData({ ...formData, alumno_id: e.target.value })}
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
                    value={formData.concepto}
                    onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                    placeholder="Ej: Colegiatura Enero 2025"
                    required
                    disabled={creando}
                  />
                </div>

                <div>
                  <Label>Descripcion (opcional)</Label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripcion del pago..."
                    className="w-full mt-1 px-3 py-2 border rounded-md min-h-[80px]"
                    disabled={creando}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Monto (MXN)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.monto}
                      onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                      placeholder="0.00"
                      required
                      disabled={creando}
                    />
                  </div>

                  <div>
                    <Label>Fecha de Vencimiento</Label>
                    <Input
                      type="date"
                      value={formData.fecha_vencimiento}
                      onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
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
                        Vence: {new Date(pago.fecha_vencimiento).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </div>
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