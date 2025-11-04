'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { obtenerAuxiliares, desactivarMaestro, reactivarMaestro } from '@/app/actions/usuarios-actions'
import { Loader2, UserX, UserCheck } from 'lucide-react'

interface Auxiliar {
  id: string
  nombre: string
  apellidos: string
  email: string
  telefono: string | null
  activo: boolean
}

export function ListaAuxiliares() {
  const [auxiliares, setAuxiliares] = useState<Auxiliar[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)

  const cargarAuxiliares = async () => {
    setLoading(true)
    const result = await obtenerAuxiliares()
    if (result.success) {
      setAuxiliares(result.data)
    } else {
      alert('Error al cargar auxiliares: ' + result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarAuxiliares()
  }, [])

  const handleDesactivar = async (auxiliarId: string) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este auxiliar?')) return

    setProcesando(auxiliarId)
    // Nota: Usamos las funciones de maestro porque el comportamiento es el mismo
    const result = await desactivarMaestro(auxiliarId)
    if (result.success) {
      await cargarAuxiliares()
    } else {
      alert('Error: ' + result.error)
    }
    setProcesando(null)
  }

  const handleReactivar = async (auxiliarId: string) => {
    setProcesando(auxiliarId)
    const result = await reactivarMaestro(auxiliarId)
    if (result.success) {
      await cargarAuxiliares()
    } else {
      alert('Error: ' + result.error)
    }
    setProcesando(null)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Auxiliares de Calificaciones</CardTitle>
        <CardDescription>
          Personal autorizado para calificar tareas en todo el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {auxiliares.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay auxiliares registrados
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auxiliares.map((auxiliar) => (
                  <TableRow key={auxiliar.id}>
                    <TableCell className="font-medium">
                      {auxiliar.nombre} {auxiliar.apellidos}
                    </TableCell>
                    <TableCell>{auxiliar.email}</TableCell>
                    <TableCell>{auxiliar.telefono || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={auxiliar.activo ? 'default' : 'secondary'}>
                        {auxiliar.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {auxiliar.activo ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDesactivar(auxiliar.id)}
                          disabled={procesando === auxiliar.id}
                        >
                          {procesando === auxiliar.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Desactivar
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReactivar(auxiliar.id)}
                          disabled={procesando === auxiliar.id}
                        >
                          {procesando === auxiliar.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Reactivar
                            </>
                          )}
                        </Button>
                      )}
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
