# Configurar HTTPS en Desarrollo Local

## Problema
El SDK de Mercado Pago requiere HTTPS para procesar pagos con tarjeta. En desarrollo local (localhost) normalmente usamos HTTP, lo que causa el error:
> "El llenado automático de las formas de pago se inhabilitó porque este formulario no usa una conexión segura."

## Solución 1: Usar ngrok (Más Rápido) ⚡

### 1. Instalar ngrok

**Windows:**
1. Descarga ngrok de: https://ngrok.com/download
2. Descomprime el archivo
3. Opcional: Agrega ngrok al PATH

**Con Chocolatey:**
```bash
choco install ngrok
```

**Con npm (cualquier plataforma):**
```bash
npm install -g ngrok
```

### 2. Iniciar tu aplicación Next.js
```bash
npm run dev
```

### 3. En otra terminal, exponer el puerto con ngrok
```bash
ngrok http 3000
```

### 4. Usar la URL HTTPS de ngrok
ngrok te dará una URL como:
```
Forwarding   https://abcd1234.ngrok.io -> http://localhost:3000
```

**Usa esa URL HTTPS en tu navegador** en lugar de localhost:3000

### Ventajas
✅ Configuración en 2 minutos
✅ No requiere certificados
✅ También sirve para probar webhooks
✅ Puedes compartir la URL para probar en otros dispositivos

### Desventajas
❌ La URL cambia cada vez que reinicias ngrok (excepto con plan pago)
❌ Requiere conexión a internet
❌ Un poco más lento que HTTPS local

---

## Solución 2: HTTPS Local con mkcert (Más Profesional) 🔒

### 1. Instalar mkcert

**Windows (con Chocolatey):**
```bash
choco install mkcert
```

**Windows (manual):**
1. Descarga de: https://github.com/FiloSottile/mkcert/releases
2. Renombra a `mkcert.exe`
3. Agrega al PATH

**macOS:**
```bash
brew install mkcert
brew install nss # para Firefox
```

**Linux:**
```bash
sudo apt install libnss3-tools
wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64
chmod +x mkcert-v1.4.4-linux-amd64
sudo mv mkcert-v1.4.4-linux-amd64 /usr/local/bin/mkcert
```

### 2. Instalar la CA local
```bash
mkcert -install
```

### 3. Crear certificados para localhost
```bash
cd C:\Users\Miguel\Desktop\sistema-escolar
mkcert localhost 127.0.0.1 ::1
```

Esto creará dos archivos:
- `localhost+2.pem` (certificado)
- `localhost+2-key.pem` (llave privada)

### 4. Crear carpeta certs y mover archivos
```bash
mkdir certs
move localhost+2.pem certs\
move localhost+2-key.pem certs\
```

### 5. Actualizar package.json

Modifica el script `dev`:

```json
{
  "scripts": {
    "dev": "node server.js",
    "dev:http": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 6. Crear server.js en la raíz del proyecto

```javascript
const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = 3000

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// HTTPS options
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certs', 'localhost+2-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'localhost+2.pem'))
}

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on https://${hostname}:${port}`)
  })
})
```

### 7. Actualizar .env.local

```env
NEXT_PUBLIC_APP_URL=https://localhost:3000
```

### 8. Iniciar con HTTPS
```bash
npm run dev
```

Ahora puedes acceder a: **https://localhost:3000**

### Ventajas
✅ URL consistente (siempre localhost)
✅ Más rápido que ngrok
✅ No requiere internet
✅ Certificados confiables
✅ Más parecido a producción

### Desventajas
❌ Configuración inicial más compleja
❌ Requiere crear server.js personalizado
❌ No sirve para probar webhooks desde internet

---

## Solución 3: Usar Checkout Pro (Temporal) 🔄

Si necesitas probar AHORA y no quieres configurar HTTPS, puedes volver temporalmente al componente anterior que redirige a Mercado Pago:

### En app/padre/pagos/PagosPadreContent.tsx:

```typescript
// Cambiar esta línea:
import { DialogoPagarCheckoutAPI } from './DialogoPagarCheckoutAPI'

// Por esta:
import { DialogoPagarMercadoPago } from './DialogoPagarMercadoPago'

// Y cambiar el componente usado:
<DialogoPagarMercadoPago
  pago={pagoSeleccionado}
  open={dialogoMercadoPagoAbierto}
  onOpenChange={setDialogoMercadoPagoAbierto}
  onSuccess={handleSuccess}
/>
```

Esto te permitirá probar pagos (aunque con redirección) mientras configuras HTTPS.

---

## Solución 4: Usar Brave/Chrome en modo inseguro (NO RECOMENDADO)

⚠️ **Solo para pruebas rápidas, no para desarrollo continuo**

1. Cierra completamente Chrome/Brave
2. Abre con flag:
```bash
chrome.exe --unsafely-treat-insecure-origin-as-secure="http://localhost:3000"
```

---

## Recomendación Final

Para tu caso, te recomiendo:

1. **Para pruebas rápidas HOY**: Usar **ngrok** (Solución 1)
2. **Para desarrollo continuo**: Configurar **HTTPS local con mkcert** (Solución 2)
3. **Para probar ahora sin configurar nada**: Volver a **Checkout Pro** temporalmente (Solución 3)

---

## Pasos Rápidos con ngrok (Lo más rápido)

```bash
# 1. Instalar ngrok
npm install -g ngrok

# 2. Iniciar tu app (terminal 1)
npm run dev

# 3. Exponer con ngrok (terminal 2)
ngrok http 3000

# 4. Copiar la URL HTTPS que te da ngrok
# Ejemplo: https://abcd1234.ngrok.io

# 5. Abrir esa URL en tu navegador
```

¡Listo! Ahora podrás probar el formulario de pago sin ese error.

---

## Troubleshooting

### "Certificate invalid" con mkcert
```bash
mkcert -uninstall
mkcert -install
```

### ngrok "command not found"
Asegúrate de cerrar y reabrir la terminal después de instalarlo

### "Error: Cannot find module 'https'" con server.js
Asegúrate de estar usando Node.js (no Bun ni Deno)

### Puerto 3000 ya en uso
```bash
# Usa otro puerto
ngrok http 3001
# O
npm run dev -- -p 3001
```
