// Script para confirmar todos los emails de usuarios existentes
// Ejecutar con: npx tsx scripts/confirm-all-emails.ts

import { supabaseAdmin } from '../lib/supabase-admin'

async function confirmAllEmails() {
  try {
    console.log('🔍 Obteniendo lista de usuarios...')

    // Obtener todos los usuarios
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Error al obtener usuarios:', listError)
      return
    }

    if (!users || users.length === 0) {
      console.log('ℹ️  No hay usuarios en el sistema')
      return
    }

    console.log(`📊 Total de usuarios encontrados: ${users.length}`)

    // Filtrar usuarios con email no confirmado
    const usersNotConfirmed = users.filter(user => !user.email_confirmed_at)

    if (usersNotConfirmed.length === 0) {
      console.log('✅ Todos los usuarios ya tienen su email confirmado')
      return
    }

    console.log(`\n📧 Usuarios con email NO confirmado: ${usersNotConfirmed.length}`)
    console.log('─'.repeat(80))

    // Confirmar email de cada usuario
    let successCount = 0
    let errorCount = 0

    for (const user of usersNotConfirmed) {
      console.log(`\n🔄 Procesando: ${user.email}`)

      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        )

        if (updateError) {
          console.error(`  ❌ Error: ${updateError.message}`)
          errorCount++
        } else {
          console.log(`  ✅ Email confirmado exitosamente`)
          successCount++
        }
      } catch (err) {
        console.error(`  ❌ Error inesperado:`, err)
        errorCount++
      }
    }

    // Resumen final
    console.log('\n' + '='.repeat(80))
    console.log('📊 RESUMEN FINAL')
    console.log('='.repeat(80))
    console.log(`✅ Emails confirmados exitosamente: ${successCount}`)
    console.log(`❌ Errores: ${errorCount}`)
    console.log(`📧 Total de usuarios: ${users.length}`)
    console.log(`✓  Usuarios con email confirmado: ${users.length - usersNotConfirmed.length + successCount}`)
    console.log('='.repeat(80))

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
console.log('🚀 Iniciando confirmación de emails...\n')
confirmAllEmails()
  .then(() => {
    console.log('\n✅ Script finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error)
    process.exit(1)
  })
