'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { obtenerMaestros, desactivarMaestro, reactivarMaestro } from '@/app/actions/usuarios-actions'
import { Loader2, GraduationCap, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { DialogoEditarMaestro } from './DialogoEditarMaestro'
import { DialogoConfirmarEliminacion } from './DialogoConfirmarEliminacion'

interface Maestro {
  id: string
  nombre: string
  apellidos: string
  email: string
  telefono: string | null
  activo: boolean
}

export function ListaMaestros() {
  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [loading, setLoading] = useState(true)
  const [maestroEditar, setMaestroEditar] = useState<Maestro | null>(null)
  const [dialogoEditarAbierto, setDialogoEditarAbierto] = useState(false)
  const [maestroEliminar, setMaestroEliminar] = useState<Maestro | null>(null)
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false)
  const [loadingEliminar, setLoadingEliminar] = useState(false)

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

  const handleEditar = (maestro: Maestro) => {
    setMaestroEditar(maestro)
    setDialogoEditarAbierto(true)
  }

  const handleEliminar = (maestro: Maestro) => {
    setMaestroEliminar(maestro)
    setDialogoEliminarAbierto(true)
  }

  const handleConfirmarEliminar = async () => {
    if (!maestroEliminar) return

    setLoadingEliminar(true)
    try {
      const result = await desactivarMaestro(maestroEliminar.id)

      if (result.success) {
        alert('Maestro desactivado exitosamente')
        setDialogoEliminarAbierto(false)
        cargarMaestros()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al desactivar maestro')
    } finally {
      setLoadingEliminar(false)
    }
  }

  const handleReactivar = async (maestro: Maestro) => {
    try {
      const result = await reactivarMaestro(maestro.id)

      if (result.success) {
        alert('Maestro reactivado exitosamente')
        cargarMaestros()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al reactivar maestro')
    }
  }

  const handleSuccess = () => {
    cargarMaestros()
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
    <>
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
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maestros.map((maestro) => (
                    <TableRow key={maestro.id} className={!maestro.activo ? 'opacity-60' : ''}>
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
                        <Badge variant={maestro.activo ? 'default' : 'secondary'}>
                          {maestro.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditar(maestro)}
                            disabled={!maestro.activo}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {maestro.activo ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminar(maestro)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReactivar(maestro)}
                            >
                              <RefreshCw className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DialogoEditarMaestro
        maestro={maestroEditar}
        open={dialogoEditarAbierto}
        onOpenChange={setDialogoEditarAbierto}
        onSuccess={handleSuccess}
      />

      <DialogoConfirmarEliminacion
        open={dialogoEliminarAbierto}
        onOpenChange={setDialogoEliminarAbierto}
        onConfirm={handleConfirmarEliminar}
        titulo="¿Eliminar maestro?"
        descripcion={`¿Estás seguro de que deseas desactivar al maestro ${maestroEliminar?.nombre} ${maestroEliminar?.apellidos}? Esta acción no eliminará los datos permanentemente, pero el maestro no podrá acceder al sistema.`}
        loading={loadingEliminar}
      />
    </>
  )
}
