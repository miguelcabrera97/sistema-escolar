/**
 * Script para limpiar la base de datos (CUIDADO: Elimina todos los datos)
 *
 * Uso: npm run clean
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function askConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos.\n¿Estás seguro? (escribe "SI" para confirmar): ', (answer) => {
      rl.close()
      resolve(answer.trim().toUpperCase() === 'SI')
    })
  })
}

async function clean() {
  console.log('🧹 Script de limpieza de base de datos\n')

  const confirmed = await askConfirmation()

  if (!confirmed) {
    console.log('\n❌ Operación cancelada')
    process.exit(0)
  }

  console.log('\n🗑️  Iniciando limpieza...\n')

  try {
    // 1. Eliminar entregas
    console.log('Eliminando entregas...')
    await supabase.from('entregas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('  ✅ Entregas eliminadas')

    // 2. Eliminar tareas
    console.log('Eliminando tareas...')
    await supabase.from('tareas').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('  ✅ Tareas eliminadas')

    // 3. Eliminar inscripciones
    console.log('Eliminando inscripciones...')
    await supabase.from('inscripciones').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('  ✅ Inscripciones eliminadas')

    // 4. Eliminar cursos
    console.log('Eliminando cursos...')
    await supabase.from('cursos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('  ✅ Cursos eliminados')

    // 5. Eliminar padres
    console.log('Eliminando padres...')
    await supabase.from('padres').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('  ✅ Padres eliminados')

    // 6. Eliminar alumnos
    console.log('Eliminando alumnos...')
    await supabase.from('alumnos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('  ✅ Alumnos eliminados')

    // 7. Eliminar maestros
    console.log('Eliminando maestros...')
    await supabase.from('maestros').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('  ✅ Maestros eliminados')

    // 8. Eliminar profiles primero (esto borrará en cascada si está configurado)
    console.log('\nEliminando profiles...')
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    console.log('  ✅ Profiles eliminados')

    // 9. Eliminar usuarios de auth
    console.log('\nEliminando usuarios de autenticación...')
    const { data, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.log(`  ⚠️  Error al listar usuarios: ${listError.message}`)
    } else if (data && data.users.length > 0) {
      let deletedCount = 0
      for (const user of data.users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        if (!deleteError) {
          deletedCount++
        }
      }
      console.log(`  ✅ ${deletedCount} de ${data.users.length} usuarios eliminados`)
    } else {
      console.log('  ✓ No hay usuarios para eliminar')
    }

    console.log('\n✅ Limpieza completada exitosamente!')
    console.log('\n💡 Puedes ejecutar "npm run seed" para llenar la base de datos con datos de prueba')

  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error)
    throw error
  }
}

clean()
  .then(() => {
    console.log('\n✨ Proceso completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error)
    process.exit(1)
  })
