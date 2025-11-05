# Configuración de Mercado Pago

## 1. Obtener tus credenciales de Mercado Pago

1. Ingresa a tu cuenta de [Mercado Pago](https://www.mercadopago.com.mx/)
2. Ve a **Tus integraciones** → **Credenciales**
3. Encontrarás dos tipos de credenciales:
   - **Credenciales de prueba**: Para desarrollo y testing
   - **Credenciales de producción**: Para pagos reales

## 2. Configurar las variables de entorno

Abre el archivo `.env.local` y reemplaza `TU_ACCESS_TOKEN_AQUI` con tu Access Token:

### Para ambiente de prueba (desarrollo):
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Para ambiente de producción:
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890-123456-abcdef1234567890abcdef1234567890-123456789
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

## 3. Configurar el Webhook en Mercado Pago

Los webhooks permiten que Mercado Pago notifique a tu aplicación cuando se realiza un pago.

### En desarrollo (usando ngrok):

1. Instala [ngrok](https://ngrok.com/) si aún no lo tienes
2. Ejecuta tu aplicación: `npm run dev`
3. En otra terminal, ejecuta: `ngrok http 3000`
4. Copia la URL que te da ngrok (ej: `https://abcd1234.ngrok.io`)
5. En Mercado Pago:
   - Ve a **Tus integraciones** → **Webhooks**
   - Click en **Crear webhook**
   - URL de notificación: `https://abcd1234.ngrok.io/api/webhooks/mercadopago`
   - Eventos: Selecciona **payment**
   - Guarda los cambios

### En producción:

1. En Mercado Pago:
   - Ve a **Tus integraciones** → **Webhooks**
   - Click en **Crear webhook**
   - URL de notificación: `https://tudominio.com/api/webhooks/mercadopago`
   - Eventos: Selecciona **payment**
   - Guarda los cambios

## 4. Probar el sistema de pagos

### Con credenciales de prueba:

1. Asegúrate de estar usando el Access Token de prueba
2. Crea un pago desde el panel de directivo
3. Como padre, intenta pagar con Mercado Pago
4. Usa las [tarjetas de prueba de Mercado Pago](https://www.mercadopago.com.mx/developers/es/docs/checkout-api/testing):

**Tarjetas aprobadas:**
- VISA: `4509 9535 6623 3704`
- Mastercard: `5031 7557 3453 0604`

**Datos del titular:**
- Nombre: APRO
- CVV: 123
- Fecha de vencimiento: Cualquier fecha futura

**Tarjetas rechazadas:**
- VISA: `4509 9535 6623 3704` con nombre OCHO (rechazada por fondos insuficientes)

## 5. Verificar que funciona

1. Crea un pago desde `/directivo/pagos`
2. Como padre, ve a `/padre/pagos`
3. Click en "Pagar con Mercado Pago"
4. Serás redirigido a Mercado Pago
5. Completa el pago con una tarjeta de prueba
6. Mercado Pago te redirigirá de vuelta a tu aplicación
7. El webhook procesará el pago automáticamente
8. Verifica en `/padre/pagos` que el estado cambió a "Pagado"

## 6. Monitoreo de pagos

Puedes monitorear todos los pagos desde el panel de Mercado Pago:
- **Actividad** → **Pagos**: Ver todos los pagos recibidos
- **Actividad** → **Webhooks**: Ver el log de notificaciones enviadas

## 7. Pasar a producción

Cuando estés listo para producción:

1. Reemplaza el Access Token de prueba con el de producción en `.env.local`
2. Actualiza `NEXT_PUBLIC_APP_URL` con tu dominio real
3. Configura el webhook en producción (paso 3)
4. Reinicia tu aplicación

## Troubleshooting

### El webhook no recibe notificaciones:
- Verifica que la URL del webhook esté correcta
- En desarrollo, asegúrate de que ngrok esté corriendo
- Revisa los logs en la consola de Next.js
- Verifica en Mercado Pago → Webhooks → Ver detalles del webhook

### Error al crear preferencia:
- Verifica que el Access Token sea correcto
- Revisa que no haya errores de tipo en los datos del pago
- Verifica la consola del navegador y del servidor

### El pago no se marca como pagado:
- Verifica que el webhook esté configurado correctamente
- Revisa los logs del webhook en `/api/webhooks/mercadopago`
- Verifica en Mercado Pago que el pago esté aprobado

## Recursos adicionales

- [Documentación oficial de Mercado Pago](https://www.mercadopago.com.mx/developers/es/docs)
- [API Reference](https://www.mercadopago.com.mx/developers/es/reference)
- [Tarjetas de prueba](https://www.mercadopago.com.mx/developers/es/docs/checkout-api/testing)
