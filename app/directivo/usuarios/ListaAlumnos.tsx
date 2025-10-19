'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { obtenerAlumnos, desactivarAlumno, reactivarAlumno } from '@/app/actions/usuarios-actions'
import { Loader2, Users, Pencil, Trash2, RefreshCw } from 'lucide-react'
import { DialogoEditarAlumno } from './DialogoEditarAlumno'
import { DialogoConfirmarEliminacion } from './DialogoConfirmarEliminacion'

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
    activo: boolean
  }
}

export function ListaAlumnos() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [alumnoEditar, setAlumnoEditar] = useState<Alumno | null>(null)
  const [dialogoEditarAbierto, setDialogoEditarAbierto] = useState(false)
  const [alumnoEliminar, setAlumnoEliminar] = useState<Alumno | null>(null)
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false)
  const [loadingEliminar, setLoadingEliminar] = useState(false)

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

  const handleEditar = (alumno: Alumno) => {
    setAlumnoEditar(alumno)
    setDialogoEditarAbierto(true)
  }

  const handleEliminar = (alumno: Alumno) => {
    setAlumnoEliminar(alumno)
    setDialogoEliminarAbierto(true)
  }

  const handleConfirmarEliminar = async () => {
    if (!alumnoEliminar) return

    setLoadingEliminar(true)
    try {
      const result = await desactivarAlumno(alumnoEliminar.id)

      if (result.success) {
        alert('Alumno desactivado exitosamente')
        setDialogoEliminarAbierto(false)
        cargarAlumnos()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al desactivar alumno')
    } finally {
      setLoadingEliminar(false)
    }
  }

  const handleReactivar = async (alumno: Alumno) => {
    try {
      const result = await reactivarAlumno(alumno.id)

      if (result.success) {
        alert('Alumno reactivado exitosamente')
        cargarAlumnos()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al reactivar alumno')
    }
  }

  const handleSuccess = () => {
    cargarAlumnos()
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
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alumnos.map((alumno) => (
                    <TableRow key={alumno.id} className={!alumno.profiles.activo ? 'opacity-60' : ''}>
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
                      <TableCell>
                        <Badge variant={alumno.profiles.activo ? 'default' : 'secondary'}>
                          {alumno.profiles.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditar(alumno)}
                            disabled={!alumno.profiles.activo}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {alumno.profiles.activo ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEliminar(alumno)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReactivar(alumno)}
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

      <DialogoEditarAlumno
        alumno={alumnoEditar}
        open={dialogoEditarAbierto}
        onOpenChange={setDialogoEditarAbierto}
        onSuccess={handleSuccess}
      />

      <DialogoConfirmarEliminacion
        open={dialogoEliminarAbierto}
        onOpenChange={setDialogoEliminarAbierto}
        onConfirm={handleConfirmarEliminar}
        titulo="¿Eliminar alumno?"
        descripcion={`¿Estás seguro de que deseas desactivar al alumno ${alumnoEliminar?.profiles.nombre} ${alumnoEliminar?.profiles.apellidos}? Esta acción no eliminará los datos permanentemente, pero el alumno no podrá acceder al sistema.`}
        loading={loadingEliminar}
      />
    </>
  )
}
