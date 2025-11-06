'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { obtenerGrupos, desactivarGrupo, type Grupo } from '@/app/actions/grados-grupos-actions'
import { Loader2, Users, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ListaGrupos() {
  const router = useRouter()
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)

  const cargarGrupos = async () => {
    setLoading(true)
    const result = await obtenerGrupos()
    if (result.success) {
      setGrupos(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    cargarGrupos()
  }, [])

  const handleDesactivar = async (grupo: Grupo) => {
    if (!confirm(`¿Desactivar el grupo "${grupo.nombre}"?`)) return

    const result = await desactivarGrupo(grupo.id)
    if (result.success) {
      alert('Grupo desactivado exitosamente')
      cargarGrupos()
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
          <Users className="h-5 w-5" />
          Lista de Grupos
        </CardTitle>
        <CardDescription>
          {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} activo{grupos.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {grupos.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No hay grupos registrados</p>
            <p className="text-sm text-gray-400 mt-2">
              Usa el formulario de arriba para agregar el primer grupo
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {grupos.map((grupo) => (
              <div
                key={grupo.id}
                className="border rounded-lg p-4 flex flex-col items-center justify-between gap-3"
              >
                <Badge variant="outline" className="text-2xl font-bold px-4 py-2">
                  {grupo.nombre}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDesactivar(grupo)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 text-red-600 mr-2" />
                  Desactivar
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
