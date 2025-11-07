import { requireAuth } from '@/lib/auth-helpers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { FormularioAlumno } from './FormularioAlumno'
import { FormularioMaestro } from './FormularioMaestro'
import { FormularioAuxiliar } from './FormularioAuxiliar'
import { FormularioPadre } from './FormularioPadre'
import { ListaAlumnos } from './ListaAlumnos'
import { ListaMaestros } from './ListaMaestros'
import { ListaAuxiliares } from './ListaAuxiliares'
import { ListaPadres } from './ListaPadres'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function GestionUsuariosPage() {
  // Solo permite acceso a directivos
  await requireAuth(['directivo'])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/directivo">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Usuarios
              </h1>
              <p className="text-gray-600">
                Administra alumnos y maestros del sistema
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="alumnos" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="alumnos">Alumnos</TabsTrigger>
            <TabsTrigger value="maestros">Maestros</TabsTrigger>
            <TabsTrigger value="auxiliares">Auxiliares</TabsTrigger>
            <TabsTrigger value="padres">Padres/Directivos</TabsTrigger>
          </TabsList>

          {/* Tab de Alumnos */}
          <TabsContent value="alumnos" className="space-y-6">
            <FormularioAlumno />
            <ListaAlumnos />
          </TabsContent>

          {/* Tab de Maestros */}
          <TabsContent value="maestros" className="space-y-6">
            <FormularioMaestro />
            <ListaMaestros />
          </TabsContent>

          {/* Tab de Auxiliares de Calificaciones */}
          <TabsContent value="auxiliares" className="space-y-6">
            <FormularioAuxiliar />
            <ListaAuxiliares />
          </TabsContent>

          {/* Tab de Padres y Directivos */}
          <TabsContent value="padres" className="space-y-6">
            <FormularioPadre />
            <ListaPadres />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
