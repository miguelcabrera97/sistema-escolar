import { requireAuth } from '@/lib/auth-helpers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { FormularioGrado } from './FormularioGrado'
import { FormularioGrupo } from './FormularioGrupo'
import { ListaGrados } from './ListaGrados'
import { ListaGrupos } from './ListaGrupos'

export default async function GradosGruposPage() {
  await requireAuth(['directivo'])

  return (
    <div className="min-h-screen bg-gray-50">
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
                Gestión de Grados y Grupos
              </h1>
              <p className="text-gray-600">
                Administra los grados académicos y grupos del colegio
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="grados" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="grados">Grados</TabsTrigger>
            <TabsTrigger value="grupos">Grupos</TabsTrigger>
          </TabsList>

          <TabsContent value="grados" className="space-y-6">
            <FormularioGrado />
            <ListaGrados />
          </TabsContent>

          <TabsContent value="grupos" className="space-y-6">
            <FormularioGrupo />
            <ListaGrupos />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
