# Mercado Pago - Checkout API (Orders) Implementation

## 📋 Descripción

El sistema de pagos ha sido actualizado para usar la **Checkout API (Orders)** de Mercado Pago en lugar de Checkout Pro. Esta implementación permite procesar pagos directamente en el sitio web sin redirigir a los usuarios a Mercado Pago.

## 🆚 Diferencias entre Checkout Pro y Checkout API

### Checkout Pro (Anterior)
- ❌ Redirige al usuario a Mercado Pago
- ❌ Pérdida de control sobre la experiencia de usuario
- ✅ Muy fácil de implementar
- ✅ PCI compliance manejado por Mercado Pago

### Checkout API / Orders (Nueva Implementación)
- ✅ El usuario permanece en tu sitio
- ✅ Control total de la experiencia de usuario
- ✅ Formulario personalizado integrado
- ✅ Procesamiento de pagos más rápido
- ⚠️ Requiere más implementación frontend
- ⚠️ Requiere cumplir con estándares PCI (Mercado Pago ayuda con tokenización)

## 🏗️ Arquitectura

```
┌─────────────┐
│   Usuario   │
│   (Padre)   │
└──────┬──────┘
       │
       │ 1. Ingresa datos de tarjeta
       ▼
┌─────────────────────────┐
│  DialogoPagarCheckoutAPI │
│  (Frontend Component)    │
└────────┬────────────────┘
         │
         │ 2. Crea token con SDK de MP
         ▼
┌─────────────────────────┐
│  Mercado Pago SDK (JS)  │
│  mercadopago.com/js/v2  │
└────────┬────────────────┘
         │
         │ 3. Envía token al servidor
         ▼
┌─────────────────────────┐
│  crearPagoCheckoutAPI   │
│  (Server Action)         │
└────────┬────────────────┘
         │
         │ 4. Crea pago con token
         ▼
┌─────────────────────────┐
│  Mercado Pago API       │
│  /v1/payments           │
└────────┬────────────────┘
         │
         │ 5. Respuesta del pago
         ▼
┌─────────────────────────┐
│  Base de Datos          │
│  (Supabase)             │
│  - pagos                │
│  - transacciones_mp     │
└─────────────────────────┘
```

## 📁 Archivos Modificados/Creados

### Backend
1. **`lib/mercadopago.ts`** - Configuración del SDK
   - Agregado: `mercadoPagoPayment` para la API de Orders

2. **`app/actions/pagos-actions.ts`** - Acciones del servidor
   - Agregado: `crearPagoCheckoutAPI()` - Nueva función para procesar pagos

### Frontend
3. **`app/padre/pagos/DialogoPagarCheckoutAPI.tsx`** - Nuevo componente
   - Formulario completo de tarjeta
   - Integración con SDK de Mercado Pago
   - Manejo de errores y validaciones

4. **`app/padre/pagos/PagosPadreContent.tsx`** - Actualizado
   - Cambiado: Usa `DialogoPagarCheckoutAPI` en lugar de `DialogoPagarMercadoPago`

### Archivos Originales (Mantenidos para referencia)
5. **`app/padre/pagos/DialogoPagarMercadoPago.tsx`** - Implementación anterior
   - Todavía disponible si se necesita volver

## 🔧 Configuración Requerida

### Variables de Entorno

Asegúrate de tener estas variables en tu `.env.local`:

```env
# Mercado Pago - Access Token (Server-side)
MERCADOPAGO_ACCESS_TOKEN=APP_USR-XXXXXXXX...

# Mercado Pago - Public Key (Frontend)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-XXXXXXXX...

# URL de la aplicación (para webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Obtener Credenciales

1. Ve a [https://www.mercadopago.com.mx/developers/panel](https://www.mercadopago.com.mx/developers/panel)
2. Selecciona tu aplicación o crea una nueva
3. En "Credenciales" encontrarás:
   - **Access Token** (para el servidor)
   - **Public Key** (para el frontend)

⚠️ **Importante**: Usa las credenciales de **TEST** en desarrollo y las de **PRODUCCIÓN** solo cuando estés listo para producción.

## 💳 Tarjetas de Prueba (Sandbox)

### Tarjetas Aprobadas
- **Visa**: `4075 5957 1648 3764`
- **Mastercard**: `5031 7557 3453 0604`

### Datos de Prueba
- **CVV**: Cualquier número de 3 dígitos (ej: 123)
- **Fecha de vencimiento**: Cualquier fecha futura (ej: 11/25)
- **Nombre**: Cualquier nombre (ej: APRO)
- **RFC/CURP**: Cualquier valor válido
- **Email**: Cualquier email válido

### Tarjetas para Probar Diferentes Escenarios
- **Pago rechazado**: `4000 0000 0000 0010`
- **Fondos insuficientes**: `4000 0000 0000 0028`

Más tarjetas de prueba: [https://www.mercadopago.com.mx/developers/es/docs/testing](https://www.mercadopago.com.mx/developers/es/docs/testing)

## 🚀 Cómo Usar (Usuario Final)

1. El padre inicia sesión en su portal
2. Va a la sección de "Pagos"
3. Selecciona un pago pendiente
4. Hace clic en "Pagar con Tarjeta"
5. Completa el formulario:
   - Número de tarjeta
   - Nombre del titular
   - Fecha de vencimiento (MM/YY)
   - CVV
   - Email
   - RFC o CURP
6. Hace clic en "Pagar"
7. El pago se procesa inmediatamente
8. Recibe confirmación visual
9. El estado del pago se actualiza a "pagado"

## 🔒 Seguridad

### Tokenización
- Los datos de tarjeta **NUNCA** se envían al servidor
- El SDK de Mercado Pago crea un token seguro en el navegador
- Solo el token se envía al servidor
- El servidor usa el token para procesar el pago

### PCI Compliance
- Mercado Pago maneja la tokenización (PCI DSS Level 1)
- Tu servidor nunca ve los datos completos de tarjeta
- Cumplimiento automático de estándares PCI

### HTTPS
- **Obligatorio** en producción
- Mercado Pago rechazará peticiones no seguras

## 🐛 Debugging y Troubleshooting

### Error: "No se pudo identificar el método de pago"
**Causa**: El BIN (primeros 6 dígitos) no es reconocido
**Solución**: Verifica que estás usando una tarjeta válida de prueba

### Error: "Error al procesar la tarjeta"
**Causa**: Datos de tarjeta inválidos
**Solución**: Verifica formato de fecha (MM/YY), CVV, etc.

### Error: "No autenticado"
**Causa**: Sesión expirada
**Solución**: Usuario debe volver a iniciar sesión

### El SDK no carga
**Causa**: Bloqueador de ads o problema de red
**Solución**:
- Verifica que `https://sdk.mercadopago.com/js/v2` es accesible
- Revisa la consola del navegador
- Desactiva bloqueadores de anuncios

### Pago procesado pero no se refleja en la DB
**Causa**: Error en webhook o en la actualización del estado
**Solución**:
- Revisa logs del servidor
- Verifica que el webhook esté configurado
- Revisa la tabla `transacciones_mercadopago`

## 📊 Monitoreo

### Logs del Servidor
Los pagos generan logs en:
```bash
console.log('Error al procesar pago:', error)
console.error('Error al guardar transacción:', transError)
```

### Base de Datos

#### Tabla: `pagos`
Verifica el estado del pago:
```sql
SELECT * FROM pagos WHERE id = '<pago_id>';
```

#### Tabla: `transacciones_mercadopago`
Detalles de la transacción:
```sql
SELECT * FROM transacciones_mercadopago WHERE pago_id = '<pago_id>';
```

### Panel de Mercado Pago
Ve todas las transacciones en:
[https://www.mercadopago.com.mx/activities](https://www.mercadopago.com.mx/activities)

## 🔄 Flujo de Datos Completo

1. **Usuario ingresa datos** → Frontend
2. **Validación básica** → Frontend (formato, campos requeridos)
3. **Crear token de tarjeta** → SDK de Mercado Pago (frontend)
4. **Enviar token al servidor** → `crearPagoCheckoutAPI()`
5. **Procesar pago** → Mercado Pago API
6. **Guardar transacción** → Tabla `transacciones_mercadopago`
7. **Actualizar estado** → Tabla `pagos` (si approved)
8. **Webhook (opcional)** → Confirma pago asíncronamente
9. **Respuesta al usuario** → Frontend muestra resultado

## 🆕 Funcionalidades Nuevas

### Procesamiento Instantáneo
- El pago se procesa inmediatamente
- No hay redirección
- Respuesta en segundos

### Mejor UX
- El usuario permanece en el sitio
- Formulario integrado
- Feedback visual inmediato

### Manejo de Errores Mejorado
- Mensajes de error específicos
- Validaciones en tiempo real
- Estados de carga claros

## ⚠️ Consideraciones de Producción

### 1. Cambiar a Credenciales de Producción
```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-<token-de-produccion>
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-<public-key-produccion>
```

### 2. Configurar Dominio Real
```env
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### 3. Configurar Webhooks
En el panel de Mercado Pago:
- URL: `https://tu-dominio.com/api/webhooks/mercadopago`
- Eventos: Seleccionar "Payments"

### 4. HTTPS Obligatorio
- Adquiere certificado SSL
- Configura tu servidor para HTTPS
- Mercado Pago rechazará peticiones HTTP

### 5. Testing Exhaustivo
- Probar tarjetas aprobadas
- Probar tarjetas rechazadas
- Probar diferentes navegadores
- Probar diferentes dispositivos

## 📚 Documentación Oficial

- [Checkout API - Docs](https://www.mercadopago.com.mx/developers/es/docs/checkout-api/landing)
- [Checkout API - Integration](https://www.mercadopago.com.mx/developers/es/docs/checkout-api/integration-configuration/card/integrate-via-cardform)
- [SDK de Javascript](https://www.mercadopago.com.mx/developers/es/docs/sdks-library/client-side/mp-instance-js)
- [Testing](https://www.mercadopago.com.mx/developers/es/docs/testing)

## 🎓 Próximos Pasos (Mejoras Futuras)

1. **Añadir soporte para pagos en cuotas**
   - Mostrar opciones de cuotas disponibles
   - Calcular intereses

2. **Guardar tarjetas (tokenización)**
   - Permitir guardar tarjetas para pagos futuros
   - Usar Customer API de Mercado Pago

3. **Añadir más métodos de pago**
   - OXXO
   - Transferencia bancaria
   - Mercado Pago wallet

4. **Mejorar reportes**
   - Dashboard de pagos para directivos
   - Exportar historial de pagos
   - Gráficas y estadísticas

## ✅ Checklist de Implementación

- [x] Actualizar `lib/mercadopago.ts`
- [x] Crear función `crearPagoCheckoutAPI()`
- [x] Crear componente `DialogoPagarCheckoutAPI`
- [x] Actualizar `PagosPadreContent` para usar nuevo componente
- [ ] Probar con tarjetas de prueba
- [ ] Verificar webhooks
- [ ] Testing en diferentes navegadores
- [ ] Preparar para producción
- [ ] Configurar monitoreo y alertas

## 🤝 Soporte

Para problemas o preguntas:
1. Revisa los logs del servidor
2. Consulta la documentación oficial de Mercado Pago
3. Revisa la sección de Troubleshooting en este documento
4. Contacta al equipo de desarrollo

---

**Última actualización**: Enero 2025
**Versión del SDK**: v2
**Versión de Mercado Pago NPM**: 2.10.0
