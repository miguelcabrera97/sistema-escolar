'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { getResendClient } from '@/lib/resend'

interface Result {
    success: boolean
    error?: string
}

export async function solicitarRestablecimientoPassword(email: string): Promise<Result> {
    try {
        if (!email) {
            return { success: false, error: 'El correo es requerido' }
        }

        // 1. Verificar si el usuario existe (opcional, pero buena práctica para no filtrar usuarios)
        // Nota: generateLink no falla si el usuario no existe, pero devuelve un error específico si se configura así.
        // Para simplificar y seguridad, asumiremos éxito genérico o dejaremos que generateLink maneje el error.

        // 2. Generar el link de recuperación usando supabaseAdmin
        const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/restablecer-password`
            }
        })

        if (linkError) {
            console.error('Error generando link:', linkError)
            // No revelar si el usuario existe o no por seguridad, o devolver error genérico
            return { success: false, error: 'No se pudo procesar la solicitud. Verifica el correo.' }
        }

        const { user, properties } = data
        const recoveryLink = properties.action_link

        // 3. Enviar correo con Resend
        const { error: emailError } = await getResendClient().emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: email,
            subject: 'Restablecer tu contraseña - Sistema Escolar',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Restablecer Contraseña</h2>
          <p>Hola,</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Sistema Escolar.</p>
          <p>Si fuiste tú, haz clic en el siguiente botón para crear una nueva contraseña:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${recoveryLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Restablecer Contraseña
            </a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="color: #6b7280; word-break: break-all;">${recoveryLink}</p>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      `
        })

        if (emailError) {
            console.error('Error enviando email:', emailError)
            return { success: false, error: 'Error al enviar el correo electrónico' }
        }

        return { success: true }

    } catch (error) {
        console.error('Error en solicitarRestablecimientoPassword:', error)
        return { success: false, error: 'Error inesperado al procesar la solicitud' }
    }
}
