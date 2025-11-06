'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { obtenerGrados, desactivarGrado, type Grado } from '@/app/actions/grados-grupos-actions'
import { Loader2, GraduationCap, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ListaGrados() {
  const router = useRouter()
  const [grados, setGrados] = useState<Grado[]>([])
  const [loading, setLoading] = useState(true)

  const cargarGrados = async () => {
    setLoading(true)
    const result = await obtenerGrados()
    if (result.success) {
      setGrados(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarGrados()
  }, [])

  const handleDesactivar = async (grado: Grado) => {
    if (!confirm(`¿Desactivar el grado "${grado.nombre_completo}"?`)) return

    const result = await desactivarGrado(grado.id)
    if (result.success) {
      alert('Grado desactivado exitosamente')
      cargarGrados()
      router.refresh()
    } else {
      alert('Error: ' + result.error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Lista de Grados
        </CardTitle>
        <CardDescription>
          {grados.length} grado{grados.length !== 1 ? 's' : ''} activo{grados.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {grados.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No hay grados registrados</p>
            <p className="text-sm text-gray-400 mt-2">
              Usa el formulario de arriba para agregar el primer grado
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grado Completo</TableHead>
                  <TableHead>Nivel Educativo</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grados.map((grado) => (
                  <TableRow key={grado.id}>
                    <TableCell className="font-medium">
                      {grado.nombre_completo}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {grado.niveles_educativos?.nombre || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{grado.nombre}</TableCell>
                    <TableCell>{grado.orden}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDesactivar(grado)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
