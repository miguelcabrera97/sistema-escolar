# 🏫 Configurar Logo de la Escuela

## 📍 Dónde Subir el Logo

### Paso 1: Crear la carpeta de assets

1. Abre la carpeta del proyecto
2. Ve a la carpeta `public/`
3. Crea una carpeta llamada `assets/` si no existe
4. La estructura debe quedar así:

```
sistema-escolar/
├── public/
│   └── assets/
│       └── logo-escuela.png  ← Aquí va tu logo
├── app/
├── lib/
└── ...
```

### Paso 2: Subir tu logo

1. Coloca tu archivo de logo en `public/assets/`
2. Nombre recomendado: `logo-escuela.png` (o `.jpg`)
3. El sistema lo detectará automáticamente

---

## 🎨 Requisitos del Logo

### Formato
- **PNG** (con fondo transparente) - Recomendado
- **JPG** (con fondo blanco/de color)
- **SVG** - También soportado

### Dimensiones
- **Ancho**: 200px - 500px
- **Alto**: 200px - 500px
- **Relación de aspecto**: Cuadrado (1:1) o horizontal (16:9, 4:3)

### Peso del Archivo
- Máximo: 500KB
- Recomendado: 100-200KB

### Calidad
- Resolución mínima: 300 DPI para impresión
- Formato de color: RGB

---

## 🔧 Configuración en el Código

El logo ya está configurado automáticamente en el sistema. Se usa en:

### 1. Recibos PDF
El logo aparece en la parte superior izquierda de cada recibo, junto al nombre de la escuela.

**Ubicación del código:** `lib/recibo-pdf.ts`

**Uso automático:**
- Si existe `public/assets/logo-escuela.png`, se usa automáticamente
- Si no existe, solo se muestra el nombre de la escuela

### 2. Configuración Manual (Opcional)

Si quieres usar un logo diferente o desde una URL externa, puedes configurarlo cuando generas el recibo:

```typescript
await obtenerDatosPagoParaRecibo(pagoId, {
  logoEscuela: 'https://ejemplo.com/mi-logo.png' // URL externa
})
```

---

## 📝 Datos de la Escuela

Para personalizar completamente los recibos, crea un archivo de configuración:

### Archivo: `lib/config-escuela.ts`

```typescript
export const configEscuela = {
  nombre: 'COLEGIO BENITO JUÁREZ',
  direccion: 'Av. Principal #123, Col. Centro, CP 12345',
  telefono: 'Tel: (555) 123-4567',
  email: 'info@colegiobenitojuarez.edu.mx',
  logo: '/assets/logo-escuela.png'
}
```

Este archivo se puede importar en las acciones de pagos para usar los datos de la escuela automáticamente.

---

## 🖼️ Ejemplo Visual del Recibo

```
┌─────────────────────────────────────────┐
│  [LOGO]  NOMBRE DE LA ESCUELA          │
│          Dirección de la escuela        │
│          Teléfono: (555) 123-4567      │
│                                         │
│         RECIBO DE PAGO                  │
│            (ORIGINAL)                   │
│                                         │
│  No. Recibo: 001234    Fecha: 15/01/25 │
│  ─────────────────────────────────────  │
│  DATOS DEL ALUMNO                       │
│  Nombre: María López Ramírez            │
│  Matrícula: 2024001    Grado: 3° A     │
│  ─────────────────────────────────────  │
│  DETALLE DEL PAGO                       │
│  Concepto: Examen                       │
│  Método de pago: Mercado Pago           │
│  ─────────────────────────────────────  │
│  TOTAL PAGADO:           $300.00 MXN    │
│                                         │
│  Pagado por: Jorge Pérez García         │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist de Instalación

- [ ] Crear carpeta `public/assets/` si no existe
- [ ] Colocar logo en `public/assets/logo-escuela.png`
- [ ] Verificar que el logo sea menor a 500KB
- [ ] Verificar que el formato sea PNG, JPG o SVG
- [ ] (Opcional) Crear archivo `lib/config-escuela.ts` con datos de la escuela
- [ ] Probar generando un recibo de pago

---

## 🔍 Solución de Problemas

### El logo no aparece en el recibo

**Causa 1**: El archivo no está en la ruta correcta
- Verifica que esté en `public/assets/logo-escuela.png`
- El nombre debe ser exacto (incluyendo la extensión)

**Causa 2**: El archivo es demasiado grande
- Comprime el logo a menos de 500KB
- Usa herramientas como [TinyPNG](https://tinypng.com)

**Causa 3**: Formato no soportado
- Convierte a PNG o JPG
- Usa herramientas online como [Convertio](https://convertio.co)

### El logo se ve pixelado o borroso

**Solución**:
- Usa un logo de mayor resolución (mínimo 500x500px)
- Asegúrate de que sea de buena calidad
- Usa PNG con transparencia para mejor calidad

### El logo es muy grande en el recibo

El tamaño del logo está configurado en `lib/recibo-pdf.ts`:

```typescript
const logoSize = 20 // Tamaño en milímetros
```

Puedes ajustar este valor si es necesario.

---

## 📞 Soporte

Si tienes problemas para configurar el logo:

1. Verifica que el archivo esté en `public/assets/logo-escuela.png`
2. Recarga la página (Ctrl + F5)
3. Revisa la consola del navegador para errores
4. Asegúrate de que el archivo no esté corrupto

---

## 🎯 Próximos Pasos

Una vez configurado el logo, puedes:

1. **Generar un recibo de prueba** para verificar que se vea bien
2. **Ajustar los datos de la escuela** en los recibos
3. **Configurar colores personalizados** (si lo necesitas)
4. **Agregar el logo al sitio web** (header, login, etc.)

---

**Última actualización**: Enero 2025
