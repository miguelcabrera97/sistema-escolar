'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'
import { eliminarRelacionPadreAlumno } from '@/app/actions/relaciones-padre-alumno-actions'

interface Relacion {
  id: string
  parentesco: string | null
  padre: {
    id: string
    profiles: {
      nombre: string
      apellidos: string
      email: string
    }
  } | null
  alumno: {
    id: string
    matricula: string
    grado: string
    grupo: string
    profiles: {
      nombre: string
      apellidos: string
    }
  } | null
}

interface Props {
  relaciones: Relacion[]
  onSuccess: () => void
}

export function TablaRelaciones({ relaciones, onSuccess }: Props) {
  const [eliminando, setEliminando] = useState<string | null>(null)

  const handleEliminar = async (relacionId: string, padreName: string, alumnoName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la relación entre ${padreName} y ${alumnoName}?`)) {
      return
    }

    setEliminando(relacionId)
    try {
      const result = await eliminarRelacionPadreAlumno(relacionId)

      if (result.success) {
        alert('Relación eliminada exitosamente')
        onSuccess()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la relación')
    } finally {
      setEliminando(null)
    }
  }

  if (relaciones.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-semibold">No hay relaciones registradas</p>
        <p className="text-sm mt-2">Usa el botón "Asignar Alumno a Padre" para crear relaciones</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Padre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Alumno</TableHead>
            <TableHead>Matrícula</TableHead>
            <TableHead>Grado y Grupo</TableHead>
            <TableHead>Parentesco</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {relaciones.map((relacion) => (
            <TableRow key={relacion.id}>
              <TableCell>
                <div className="font-medium">
                  {relacion.padre?.profiles?.nombre || 'N/A'} {relacion.padre?.profiles?.apellidos || ''}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">
                  {relacion.padre?.profiles?.email || 'N/A'}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {relacion.alumno?.profiles?.nombre || 'N/A'} {relacion.alumno?.profiles?.apellidos || ''}
                </div>
              </TableCell>
              <TableCell>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {relacion.alumno?.matricula || 'N/A'}
                </code>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {relacion.alumno?.grado || '?'}° {relacion.alumno?.grupo || '?'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {relacion.parentesco || 'No especificado'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminar(
                    relacion.id,
                    `${relacion.padre?.profiles?.nombre} ${relacion.padre?.profiles?.apellidos}`,
                    `${relacion.alumno?.profiles?.nombre} ${relacion.alumno?.profiles?.apellidos}`
                  )}
                  disabled={eliminando === relacion.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
