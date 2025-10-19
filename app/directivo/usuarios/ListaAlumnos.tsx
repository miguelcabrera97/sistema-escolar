'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { obtenerAlumnos } from '@/app/actions/usuarios-actions'
import { Loader2, Users } from 'lucide-react'

interface Alumno {
  id: string
  matricula: string
  grado: string
  grupo: string
  fecha_nacimiento: string | null
  profiles: {
    nombre: string
    apellidos: string
    email: string
    telefono: string | null
  }
}

export function ListaAlumnos() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)

  const cargarAlumnos = async () => {
    setLoading(true)
    const result = await obtenerAlumnos()
    if (result.success) {
      setAlumnos(result.data)
    } else {
      console.error('Error al cargar alumnos:', result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarAlumnos()
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
          <Users className="h-5 w-5" />
          Lista de Alumnos
        </CardTitle>
        <CardDescription>
          {alumnos.length} alumno{alumnos.length !== 1 ? 's' : ''} registrado{alumnos.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alumnos.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No hay alumnos registrados</p>
            <p className="text-sm text-gray-400 mt-2">
              Usa el formulario de arriba para agregar el primer alumno
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Grado</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alumnos.map((alumno) => (
                  <TableRow key={alumno.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{alumno.matricula}</Badge>
                    </TableCell>
                    <TableCell>
                      {alumno.profiles.nombre} {alumno.profiles.apellidos}
                    </TableCell>
                    <TableCell>{alumno.grado}°</TableCell>
                    <TableCell>{alumno.grupo}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {alumno.profiles.email}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {alumno.profiles.telefono || '-'}
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
