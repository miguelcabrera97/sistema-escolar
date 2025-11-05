import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Ruta de prueba para verificar que supabaseAdmin funciona
export async function GET() {
  try {
    console.log('🧪 TEST: Verificando supabaseAdmin')
    console.log('Service Role Key existe?', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('supabaseAdmin existe?', !!supabaseAdmin)

    // Intentar una consulta simple
    const { data: profiles, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, nombre')
      .limit(1)

    if (selectError) {
      console.error('❌ Error en SELECT:', selectError)
      return NextResponse.json({
        success: false,
        error: 'Error en SELECT',
        details: selectError
      }, { status: 500 })
    }

    console.log('✅ SELECT funciona, perfiles encontrados:', profiles?.length)

    // Intentar insertar en pagos (esto debería funcionar con service_role)
    const testData = {
      concepto: 'TEST - Borrar',
      padre_id: '00000000-0000-0000-0000-000000000000', // UUID dummy
      alumno_id: '00000000-0000-0000-0000-000000000000', // UUID dummy
      descripcion: 'Prueba de inserción con service_role',
      monto: 1.00,
      fecha_vencimiento: new Date().toISOString().split('T')[0],
      estado: 'pendiente',
      creado_por: '00000000-0000-0000-0000-000000000000'
    }

    console.log('🔐 Intentando INSERT de prueba...')
    const { data: pago, error: insertError } = await supabaseAdmin
      .from('pagos')
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error en INSERT:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Error en INSERT',
        details: insertError,
        testData
      }, { status: 500 })
    }

    console.log('✅ INSERT exitoso:', pago)

    // Limpiar el registro de prueba
    if (pago?.id) {
      await supabaseAdmin.from('pagos').delete().eq('id', pago.id)
      console.log('🗑️ Registro de prueba eliminado')
    }

    return NextResponse.json({
      success: true,
      message: 'supabaseAdmin funciona correctamente',
      profilesCount: profiles?.length,
      insertTest: 'OK'
    })

  } catch (error: any) {
    console.error('❌ Error general:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
