import { requireAuth } from '@/lib/auth-helpers'
import { ListaCursos } from './ListaCursos'
import { FormularioCurso } from './FormularioCurso'

export default async function CursosPage() {
  await requireAuth(['directivo'])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cursos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Crea cursos, asigna maestros e inscribe alumnos
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Formulario de creación */}
        <FormularioCurso />

        {/* Lista de cursos */}
        <ListaCursos />
      </main>
    </div>
  )
}
