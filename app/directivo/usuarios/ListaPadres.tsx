'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { obtenerPadresYDirectivos } from '@/app/actions/usuarios-actions'
import { Loader2, Users } from 'lucide-react'

interface Usuario {
  id: string
  nombre: string
  apellidos: string
  email: string
  telefono?: string
  role: string
  activo: boolean
}

export function ListaPadres() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)

  const cargarUsuarios = async () => {
    setLoading(true)
    const result = await obtenerPadresYDirectivos()
    if (result.success) {
      setUsuarios(result.data)
    } else {
      console.error('Error al cargar usuarios:', result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarUsuarios()
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

  const padres = usuarios.filter(u => u.role === 'padre')
  const directivos = usuarios.filter(u => u.role === 'directivo')

  return (
    <div className="space-y-6">
      {/* Lista de Directivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Directivos
          </CardTitle>
          <CardDescription>
            {directivos.length} directivo{directivos.length !== 1 ? 's' : ''} en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {directivos.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay directivos registrados</p>
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
                  {directivos.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">
                        {usuario.nombre} {usuario.apellidos}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {usuario.email}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {usuario.telefono || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={usuario.activo ? 'default' : 'secondary'}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Padres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Padres/Tutores
          </CardTitle>
          <CardDescription>
            {padres.length} padre{padres.length !== 1 ? 's' : ''} registrado{padres.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {padres.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay padres registrados</p>
              <p className="text-sm text-gray-400 mt-2">
                Usa el formulario de arriba para agregar el primer padre
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
                  {padres.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">
                        {usuario.nombre} {usuario.apellidos}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {usuario.email}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {usuario.telefono || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={usuario.activo ? 'default' : 'secondary'}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
