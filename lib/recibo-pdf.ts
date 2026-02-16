import { jsPDF } from 'jspdf'
import { renderizarCopia } from './recibo-render'

export interface DatosRecibo {
  // Datos del pago
  numeroRecibo: string
  fechaPago: string
  monto: number
  concepto: string // Se usará para determinar en qué fila va (Inscripción, Colegiatura, etc.)
  descripcion?: string // Se usará para "OTROS" o detalles adicionales
  metodoPago: string
  referencia?: string

  // Datos del alumno
  alumnoNombre: string
  alumnoApellidos: string
  alumnoMatricula: string
  alumnoGrado: string
  alumnoGrupo: string
  nivelEducativo?: string // Nuevo campo opcional

  // Datos del padre
  padreNombre: string
  padreApellidos: string

  // Datos de la escuela
  nombreEscuela?: string
  rfcEscuela?: string // Nuevo campo
  direccionEscuela?: string
  telefonoEscuela?: string
  logoEscuela?: string
}

// Helper para cargar imagen como base64
const loadImage = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = url
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(img, 0, 0)
      try {
        const dataURL = canvas.toDataURL('image/png')
        resolve(dataURL)
      } catch (e) {
        console.warn('Error converting image to dataURL', e)
        resolve(null)
      }
    }
    img.onerror = () => {
      console.warn(`Error loading image from ${url}`)
      resolve(null) // Resolvemos con null para no romper el flujo
    }
  })
}

/**
 * Genera un recibo PDF con 2 copias en una misma hoja
 */
export async function generarReciboPDF(datos: DatosRecibo): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter' // 215.9 x 279.4 mm
  })

  // Cargar logo
  const nombreEscuela = datos.nombreEscuela || 'GRUPO EDUCATIVO SUD S. C.';
  const rfcEscuela = datos.rfcEscuela || 'GES130503G38';
  const direccion = datos.direccionEscuela || 'Paseo de la Candelaria Mz. 66 Lt. 11, Hacienda Ojo de Agua, Tecámac,\nEstado de México. C. P: 55770';
  const logoUrl = datos.logoEscuela || '/logo.png';

  const logoData = await loadImage(logoUrl)

  // Generar primera copia (Original) - parte superior
  renderizarCopia(doc, datos, 10, 'ORIGINAL', nombreEscuela, rfcEscuela, direccion, logoData)

    // Línea punteada de corte
    ; (doc as any).setLineDash([2, 2]);
  doc.setDrawColor(150, 150, 150)
  doc.line(10, 140, 205, 140);
  ; (doc as any).setLineDash([]);

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('✂ Cortar por aquí', 105, 139, { align: 'center' })

  // Generar segunda copia (Copia) - parte inferior
  renderizarCopia(doc, datos, 145, 'COPIA', nombreEscuela, rfcEscuela, direccion, logoData)

  return doc
}

/**
 * Descarga el PDF con el nombre de archivo especificado
 */
export async function descargarReciboPDF(datos: DatosRecibo, nombreArchivo?: string) {
  const doc = await generarReciboPDF(datos)
  const filename = nombreArchivo || `recibo_${datos.numeroRecibo}.pdf`
  doc.save(filename)
}

/**
 * Abre el PDF en una nueva ventana para imprimir
 */
export async function imprimirReciboPDF(datos: DatosRecibo) {
  const doc = await generarReciboPDF(datos)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
