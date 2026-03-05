'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { obtenerAuxiliares, desactivarAuxiliar, reactivarAuxiliar, eliminarAuxiliarDefinitivamente } from '@/app/actions/usuarios-actions'
import { Loader2, UserX, UserCheck, Key, Trash2 } from 'lucide-react'
import { DialogoRestablecerPassword } from './DialogoRestablecerPassword'

import { type Auxiliar } from '@/app/types/usuarios'

export function ListaAuxiliares() {
  const [auxiliares, setAuxiliares] = useState<Auxiliar[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState<string | null>(null)
  const [auxiliarPassword, setAuxiliarPassword] = useState<Auxiliar | null>(null)
  const [dialogoPasswordAbierto, setDialogoPasswordAbierto] = useState(false)

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

  const handlePassword = (auxiliar: Auxiliar) => {
    setAuxiliarPassword(auxiliar)
    setDialogoPasswordAbierto(true)
  }

  const handleDesactivar = async (auxiliarId: string) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este auxiliar?')) return

    setProcesando(auxiliarId)
    // Nota: Usamos las funciones de auxiliar
    const result = await desactivarAuxiliar(auxiliarId)
    if (result.success) {
      await cargarAuxiliares()
    } else {
      alert('Error: ' + result.error)
    }
    setProcesando(null)
  }

  const handleReactivar = async (auxiliarId: string) => {
    setProcesando(auxiliarId)
    const result = await reactivarAuxiliar(auxiliarId)
    if (result.success) {
      await cargarAuxiliares()
    } else {
      alert('Error: ' + result.error)
    }
    setProcesando(null)
  }

  const handleEliminarDefinitivo = async (auxiliar: Auxiliar) => {
    if (!confirm(`¿ESTÁS SEGURO de que deseas eliminar a ${auxiliar.nombre} ${auxiliar.apellidos} DEFINITIVAMENTE del sistema? Esto no se puede deshacer y borrará toda su información, cuenta y acceso.`)) return

    setProcesando(auxiliar.id)
    try {
      const result = await eliminarAuxiliarDefinitivamente(auxiliar.id)
      if (result.success) {
        alert(result.data.message)
        await cargarAuxiliares()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar definitivamente')
    } finally {
      setProcesando(null)
    }
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
    <>
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
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePassword(auxiliar)}
                            disabled={!auxiliar.activo || !!procesando}
                            title="Restablecer Contraseña"
                          >
                            <Key className="h-4 w-4 text-amber-600" />
                          </Button>
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
                                <UserX className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReactivar(auxiliar.id)}
                                disabled={procesando === auxiliar.id}
                                title="Reactivar auxiliar"
                              >
                                {procesando === auxiliar.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <UserCheck className="h-4 w-4 text-green-600" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEliminarDefinitivo(auxiliar)}
                                disabled={procesando === auxiliar.id}
                                title="Eliminar definitivamente"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
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

      <DialogoRestablecerPassword
        usuario={auxiliarPassword ? { ...auxiliarPassword, user_id: auxiliarPassword.id } : null}
        open={dialogoPasswordAbierto}
        onOpenChange={setDialogoPasswordAbierto}
        onSuccess={() => alert('Contraseña actualizada correctamente')}
      />
    </>
  )
}
