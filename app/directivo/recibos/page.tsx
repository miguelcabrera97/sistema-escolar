'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Printer, FileText, Search } from 'lucide-react'

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

interface Padre {
  id: string
  profiles: {
    nombre: string
    apellidos: string
    email: string
  }
}

interface ConceptoPago {
  id: string
  nombre: string
  monto_default: number
  descripcion: string | null
}

interface ReciboData {
  folio: string
  fecha: string
  alumno: Alumno | null
  padre: Padre | null
  concepto: string
  monto: number
  descripcion: string
}

export default function RecibosPage() {
  const router = useRouter()
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [padres, setPadres] = useState<Padre[]>([])
  const [conceptos, setConceptos] = useState<ConceptoPago[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlumno, setSelectedAlumno] = useState<string>('')
  const [selectedPadre, setSelectedPadre] = useState<string>('')
  const [selectedConcepto, setSelectedConcepto] = useState<string>('')
  const [monto, setMonto] = useState<string>('')
  const [descripcion, setDescripcion] = useState<string>('')
  const [searchAlumno, setSearchAlumno] = useState('')
  const [searchPadre, setSearchPadre] = useState('')
  const [reciboGenerado, setReciboGenerado] = useState<ReciboData | null>(null)
  const reciboRef = useRef<HTMLDivElement>(null)

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

      // Cargar alumnos
      const { data: alumnosData } = await supabase
        .from('alumnos')
        .select('id, matricula, grado, grupo, user_id')
        .order('matricula')

      const alumnoUserIds = alumnosData?.map(a => a.user_id).filter(Boolean) || []
      const { data: alumnoProfiles } = await supabase
        .from('profiles')
        .select('id, nombre, apellidos')
        .in('id', alumnoUserIds)

      const alumnosCompletos = alumnosData?.map(alumno => ({
        ...alumno,
        profiles: alumnoProfiles?.find(p => p.id === alumno.user_id) || { nombre: '', apellidos: '' }
      })) || []

      setAlumnos(alumnosCompletos)

      // Cargar padres
      const { data: padresData } = await supabase
        .from('profiles')
        .select('id, nombre, apellidos, email')
        .eq('role', 'padre')
        .order('nombre')

      const padresCompletos = padresData?.map(padre => ({
        id: padre.id,
        profiles: {
          nombre: padre.nombre,
          apellidos: padre.apellidos,
          email: padre.email
        }
      })) || []

      setPadres(padresCompletos)

      // Cargar conceptos de pago
      const { data: conceptosData } = await supabase
        .from('conceptos_pago')
        .select('*')
        .order('nombre')

      if (conceptosData) {
        setConceptos(conceptosData)
      }

    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const alumnosFiltrados = alumnos.filter(a =>
    `${a.profiles.nombre} ${a.profiles.apellidos} ${a.matricula}`
      .toLowerCase()
      .includes(searchAlumno.toLowerCase())
  )

  const padresFiltrados = padres.filter(p =>
    `${p.profiles.nombre} ${p.profiles.apellidos} ${p.profiles.email}`
      .toLowerCase()
      .includes(searchPadre.toLowerCase())
  )

  const handleConceptoChange = (conceptoId: string) => {
    setSelectedConcepto(conceptoId)
    const concepto = conceptos.find(c => c.id === conceptoId)
    if (concepto) {
      setMonto(concepto.monto_default.toString())
      setDescripcion(concepto.descripcion || '')
    }
  }

  const generarFolio = () => {
    const fecha = new Date()
    const año = fecha.getFullYear()
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const dia = String(fecha.getDate()).padStart(2, '0')
    const hora = String(fecha.getHours()).padStart(2, '0')
    const minutos = String(fecha.getMinutes()).padStart(2, '0')
    const segundos = String(fecha.getSeconds()).padStart(2, '0')
    return `REC-${año}${mes}${dia}-${hora}${minutos}${segundos}`
  }

  const generarRecibo = async () => {
    if (!selectedAlumno || !selectedPadre || !selectedConcepto || !monto) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    const alumno = alumnos.find(a => a.id === selectedAlumno)
    const padre = padres.find(p => p.id === selectedPadre)
    const concepto = conceptos.find(c => c.id === selectedConcepto)

    if (!alumno || !padre || !concepto) {
      alert('Error al obtener los datos')
      return
    }

    const recibo: ReciboData = {
      folio: generarFolio(),
      fecha: new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      alumno,
      padre,
      concepto: concepto.nombre,
      monto: parseFloat(monto),
      descripcion
    }

    setReciboGenerado(recibo)

    // Registrar el recibo en la base de datos como pago pendiente
    try {
      await supabase.from('pagos').insert({
        alumno_id: alumno.id,
        padre_id: padre.id,
        concepto: concepto.nombre,
        monto: parseFloat(monto),
        descripcion: descripcion || null,
        estado: 'pendiente',
        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
        metodo_pago: 'ventanilla',
        referencia_pago: recibo.folio
      })
    } catch (error) {
      console.error('Error al registrar el recibo:', error)
    }
  }

  const imprimirRecibo = () => {
    if (reciboRef.current) {
      const ventanaImpresion = window.open('', '_blank')
      if (ventanaImpresion) {
        ventanaImpresion.document.write(`
          <html>
            <head>
              <title>Recibo de Pago - ${reciboGenerado?.folio}</title>
              <style>
                @media print {
                  @page { margin: 1cm; }
                  body { margin: 0; }
                }
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                  max-width: 800px;
                  margin: 0 auto;
                }
                .header {
                  text-align: center;
                  border-bottom: 2px solid #000;
                  padding-bottom: 20px;
                  margin-bottom: 20px;
                }
                .logo {
                  font-size: 24px;
                  font-weight: bold;
                  color: #2563eb;
                }
                .info-section {
                  margin: 20px 0;
                  padding: 15px;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                }
                .info-row {
                  display: flex;
                  margin: 10px 0;
                }
                .info-label {
                  font-weight: bold;
                  width: 200px;
                }
                .info-value {
                  flex: 1;
                }
                .monto-section {
                  background: #f3f4f6;
                  padding: 20px;
                  margin: 20px 0;
                  border-radius: 8px;
                  text-align: center;
                }
                .monto-label {
                  font-size: 14px;
                  color: #666;
                  margin-bottom: 5px;
                }
                .monto-valor {
                  font-size: 36px;
                  font-weight: bold;
                  color: #2563eb;
                }
                .footer {
                  margin-top: 40px;
                  padding-top: 20px;
                  border-top: 2px solid #000;
                  text-align: center;
                  font-size: 12px;
                  color: #666;
                }
                .firma-section {
                  margin-top: 60px;
                  display: flex;
                  justify-content: space-around;
                }
                .firma-box {
                  text-align: center;
                }
                .firma-line {
                  border-top: 1px solid #000;
                  width: 200px;
                  margin: 0 auto 10px;
                }
              </style>
            </head>
            <body>
              ${reciboRef.current.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  }
                }
              </script>
            </body>
          </html>
        `)
        ventanaImpresion.document.close()
      }
    }
  }

  const nuevoRecibo = () => {
    setReciboGenerado(null)
    setSelectedAlumno('')
    setSelectedPadre('')
    setSelectedConcepto('')
    setMonto('')
    setDescripcion('')
    setSearchAlumno('')
    setSearchPadre('')
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
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Recibos de Pago</h1>
                <p className="text-sm text-gray-500">Genera recibos para pago en ventanilla</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!reciboGenerado ? (
          <Card>
            <CardHeader>
              <CardTitle>Generar Nuevo Recibo</CardTitle>
              <CardDescription>
                Completa la información para generar un recibo de pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selección de Alumno */}
              <div>
                <Label>Alumno *</Label>
                <Input
                  placeholder="Buscar alumno..."
                  value={searchAlumno}
                  onChange={(e) => setSearchAlumno(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {alumnosFiltrados.map((alumno) => (
                    <div
                      key={alumno.id}
                      onClick={() => setSelectedAlumno(alumno.id)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedAlumno === alumno.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <p className="font-medium">
                        {alumno.profiles.nombre} {alumno.profiles.apellidos}
                      </p>
                      <p className="text-sm text-gray-500">
                        {alumno.matricula} • {alumno.grado} {alumno.grupo}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selección de Padre */}
              <div>
                <Label>Padre/Tutor *</Label>
                <Input
                  placeholder="Buscar padre..."
                  value={searchPadre}
                  onChange={(e) => setSearchPadre(e.target.value)}
                  className="mb-2"
                />
                <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {padresFiltrados.map((padre) => (
                    <div
                      key={padre.id}
                      onClick={() => setSelectedPadre(padre.id)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        selectedPadre === padre.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <p className="font-medium">
                        {padre.profiles.nombre} {padre.profiles.apellidos}
                      </p>
                      <p className="text-sm text-gray-500">{padre.profiles.email}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selección de Concepto */}
              <div>
                <Label htmlFor="concepto">Concepto de Pago *</Label>
                <select
                  id="concepto"
                  value={selectedConcepto}
                  onChange={(e) => handleConceptoChange(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                >
                  <option value="">Selecciona un concepto</option>
                  {conceptos.map((concepto) => (
                    <option key={concepto.id} value={concepto.id}>
                      {concepto.nombre} - ${concepto.monto_default.toLocaleString('es-MX')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <Label htmlFor="monto">Monto *</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Descripción */}
              <div>
                <Label htmlFor="descripcion">Descripción adicional</Label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Información adicional..."
                  className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]"
                />
              </div>

              <Button onClick={generarRecibo} className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                Generar Recibo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={imprimirRecibo}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Recibo
              </Button>
              <Button variant="outline" onClick={nuevoRecibo}>
                Nuevo Recibo
              </Button>
            </div>

            <Card>
              <CardContent className="p-8">
                <div ref={reciboRef}>
                  <div className="header">
                    <div className="logo">SISTEMA ESCOLAR</div>
                    <h2 style={{ margin: '10px 0', fontSize: '20px' }}>RECIBO DE PAGO</h2>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      Folio: <strong>{reciboGenerado.folio}</strong>
                    </p>
                    <p style={{ fontSize: '12px', color: '#666' }}>{reciboGenerado.fecha}</p>
                  </div>

                  <div className="info-section">
                    <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#2563eb' }}>
                      Información del Alumno
                    </h3>
                    <div className="info-row">
                      <div className="info-label">Nombre:</div>
                      <div className="info-value">
                        {reciboGenerado.alumno?.profiles.nombre}{' '}
                        {reciboGenerado.alumno?.profiles.apellidos}
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Matrícula:</div>
                      <div className="info-value">{reciboGenerado.alumno?.matricula}</div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Grado y Grupo:</div>
                      <div className="info-value">
                        {reciboGenerado.alumno?.grado}° {reciboGenerado.alumno?.grupo}
                      </div>
                    </div>
                  </div>

                  <div className="info-section">
                    <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#2563eb' }}>
                      Información del Padre/Tutor
                    </h3>
                    <div className="info-row">
                      <div className="info-label">Nombre:</div>
                      <div className="info-value">
                        {reciboGenerado.padre?.profiles.nombre}{' '}
                        {reciboGenerado.padre?.profiles.apellidos}
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">Email:</div>
                      <div className="info-value">{reciboGenerado.padre?.profiles.email}</div>
                    </div>
                  </div>

                  <div className="info-section">
                    <h3 style={{ marginBottom: '15px', fontSize: '16px', color: '#2563eb' }}>
                      Concepto de Pago
                    </h3>
                    <div className="info-row">
                      <div className="info-label">Concepto:</div>
                      <div className="info-value">{reciboGenerado.concepto}</div>
                    </div>
                    {reciboGenerado.descripcion && (
                      <div className="info-row">
                        <div className="info-label">Descripción:</div>
                        <div className="info-value">{reciboGenerado.descripcion}</div>
                      </div>
                    )}
                  </div>

                  <div className="monto-section">
                    <div className="monto-label">MONTO A PAGAR</div>
                    <div className="monto-valor">
                      ${reciboGenerado.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                      MXN
                    </div>
                  </div>

                  <div className="firma-section">
                    <div className="firma-box">
                      <div className="firma-line"></div>
                      <p style={{ fontSize: '12px' }}>Firma del Padre/Tutor</p>
                    </div>
                    <div className="firma-box">
                      <div className="firma-line"></div>
                      <p style={{ fontSize: '12px' }}>Firma de Recibido</p>
                    </div>
                  </div>

                  <div className="footer">
                    <p>
                      Este recibo debe presentarse en la ventanilla de pagos de la institución.
                    </p>
                    <p>Válido por 30 días a partir de la fecha de emisión.</p>
                    <p style={{ marginTop: '10px' }}>
                      <strong>Conserve este recibo como comprobante de pago.</strong>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
