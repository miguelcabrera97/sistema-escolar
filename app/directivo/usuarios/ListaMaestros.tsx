'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { obtenerMaestros } from '@/app/actions/usuarios-actions'
import { Loader2, GraduationCap } from 'lucide-react'

interface Maestro {
  id: string
  nombre: string
  apellidos: string
  email: string
  telefono: string | null
}

export function ListaMaestros() {
  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [loading, setLoading] = useState(true)

  const cargarMaestros = async () => {
    setLoading(true)
    const result = await obtenerMaestros()
    if (result.success) {
      setMaestros(result.data)
    } else {
      console.error('Error al cargar maestros:', result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarMaestros()
  }, [])

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
          Lista de Maestros
        </CardTitle>
        <CardDescription>
          {maestros.length} maestro{maestros.length !== 1 ? 's' : ''} registrado{maestros.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {maestros.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No hay maestros registrados</p>
            <p className="text-sm text-gray-400 mt-2">
              Usa el formulario de arriba para agregar el primer maestro
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maestros.map((maestro) => (
                  <TableRow key={maestro.id}>
                    <TableCell className="font-medium">
                      {maestro.nombre} {maestro.apellidos}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {maestro.email}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {maestro.telefono || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">Activo</Badge>
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
