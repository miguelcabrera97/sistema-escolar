# Guía de Configuración de Supabase para Recuperación de Contraseñas

Para que el sistema de recuperación de contraseñas funcione correctamente, debes realizar las siguientes configuraciones en tu proyecto de Supabase.

## 1. Configuración de URLs

Ve a **Authentication** > **URL Configuration** en el panel de Supabase.

### Site URL
Esta es la URL principal de tu sitio.
- **Local**: `http://localhost:3000`
- **Producción**: `https://tu-dominio.com`

### Redirect URLs
Debes agregar las URLs a las que Supabase tiene permitido redirigir a los usuarios después de acciones de correo (como confirmar cuenta o restablecer contraseña).

Asegúrate de tener agregadas las siguientes:
- `http://localhost:3000/**` (Esto permite cualquier subruta en local)
- O específicamente:
  - `http://localhost:3000/restablecer-password`
  - `http://localhost:3000/auth/callback`

> [!IMPORTANT]
> Si estás en producción, reemplaza `localhost:3000` con tu dominio real.

## 2. Plantilla de Correo (Email Templates)

Ve a **Authentication** > **Email Templates**.

### Reset Password
Selecciona la plantilla "Reset Password". Aquí puedes personalizar el correo que reciben los usuarios.

**Asunto (Subject):**
```text
Restablecer tu contraseña - Sistema Escolar
```

**Cuerpo (Body):**
Asegúrate de incluir el enlace de confirmación. Puedes usar este ejemplo básico:

```html
<h2>Restablecer Contraseña</h2>

<p>Sigue este enlace para restablecer tu contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer Contraseña</a></p>

<p>Si no solicitaste esto, puedes ignorar este correo.</p>
```

> [!WARNING]
> Es CRÍTICO que el enlace `<a href="{{ .ConfirmationURL }}">` esté presente. Sin la variable `{{ .ConfirmationURL }}`, el flujo no funcionará.

## 3. SMTP (Opcional pero Recomendado)

Por defecto, Supabase tiene un límite de correos por hora. Para producción, se recomienda configurar tu propio proveedor de SMTP.

Ve a **Project Settings** > **Authentication** > **SMTP Settings** para configurarlo si usas servicios como Resend, SendGrid, AWS SES, etc.
