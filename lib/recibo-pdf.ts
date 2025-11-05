import { jsPDF } from 'jspdf'

export interface DatosRecibo {
  // Datos del pago
  numeroRecibo: string
  fechaPago: string
  monto: number
  concepto: string
  descripcion?: string
  metodoPago: string
  referencia?: string

  // Datos del alumno
  alumnoNombre: string
  alumnoApellidos: string
  alumnoMatricula: string
  alumnoGrado: string
  alumnoGrupo: string

  // Datos del padre
  padreNombre: string
  padreApellidos: string

  // Datos de la escuela
  nombreEscuela?: string
  direccionEscuela?: string
  telefonoEscuela?: string
}

/**
 * Genera un recibo PDF con 2 copias en una misma hoja
 * - Copia superior: Original
 * - Copia inferior: Copia
 */
export function generarReciboPDF(datos: DatosRecibo): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter' // 215.9 x 279.4 mm
  })

  const nombreEscuela = datos.nombreEscuela || 'SISTEMA ESCOLAR'
  const direccion = datos.direccionEscuela || ''
  const telefono = datos.telefonoEscuela || ''

  // Generar primera copia (Original) - parte superior
  generarRecibo(doc, datos, 10, 'ORIGINAL', nombreEscuela, direccion, telefono)

  // Línea punteada de corte
  doc.setLineDash([2, 2])
  doc.setDrawColor(150, 150, 150)
  doc.line(10, 140, 205, 140)
  doc.setLineDash([]) // Resetear línea sólida

  // Texto en la línea de corte
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('✂ Cortar por aquí', 105, 139, { align: 'center' })

  // Generar segunda copia (Copia) - parte inferior
  generarRecibo(doc, datos, 145, 'COPIA', nombreEscuela, direccion, telefono)

  return doc
}

/**
 * Genera un recibo individual en la posición Y especificada
 */
function generarRecibo(
  doc: jsPDF,
  datos: DatosRecibo,
  startY: number,
  tipo: 'ORIGINAL' | 'COPIA',
  nombreEscuela: string,
  direccion: string,
  telefono: string
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const marginLeft = 15
  const marginRight = 15
  const contentWidth = pageWidth - marginLeft - marginRight

  let currentY = startY

  // Encabezado - Nombre de la escuela
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(nombreEscuela, pageWidth / 2, currentY, { align: 'center' })
  currentY += 6

  if (direccion) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(direccion, pageWidth / 2, currentY, { align: 'center' })
    currentY += 4
  }

  if (telefono) {
    doc.setFontSize(9)
    doc.text(telefono, pageWidth / 2, currentY, { align: 'center' })
    currentY += 4
  }

  currentY += 3

  // Título del recibo
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('RECIBO DE PAGO', pageWidth / 2, currentY, { align: 'center' })
  currentY += 5

  // Tipo de recibo (ORIGINAL o COPIA)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(100, 100, 100)
  doc.text(`(${tipo})`, pageWidth / 2, currentY, { align: 'center' })
  currentY += 8

  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')

  // Información del recibo
  doc.setFontSize(9)

  // Número de recibo y fecha en la misma línea
  doc.setFont('helvetica', 'bold')
  doc.text('No. Recibo:', marginLeft, currentY)
  doc.setFont('helvetica', 'normal')
  doc.text(datos.numeroRecibo, marginLeft + 25, currentY)

  doc.setFont('helvetica', 'bold')
  doc.text('Fecha:', pageWidth - marginRight - 45, currentY)
  doc.setFont('helvetica', 'normal')
  doc.text(datos.fechaPago, pageWidth - marginRight - 25, currentY)
  currentY += 7

  // Línea separadora
  doc.setDrawColor(200, 200, 200)
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY)
  currentY += 5

  // Datos del alumno
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DATOS DEL ALUMNO', marginLeft, currentY)
  currentY += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  doc.text('Nombre:', marginLeft, currentY)
  doc.text(`${datos.alumnoNombre} ${datos.alumnoApellidos}`, marginLeft + 20, currentY)
  currentY += 4

  doc.text('Matrícula:', marginLeft, currentY)
  doc.text(datos.alumnoMatricula, marginLeft + 20, currentY)

  doc.text('Grado:', marginLeft + 80, currentY)
  doc.text(`${datos.alumnoGrado}° ${datos.alumnoGrupo}`, marginLeft + 95, currentY)
  currentY += 6

  // Línea separadora
  doc.setDrawColor(200, 200, 200)
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY)
  currentY += 5

  // Datos del pago
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DEL PAGO', marginLeft, currentY)
  currentY += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')

  doc.text('Concepto:', marginLeft, currentY)
  doc.text(datos.concepto, marginLeft + 25, currentY)
  currentY += 4

  if (datos.descripcion) {
    doc.text('Descripción:', marginLeft, currentY)
    const descripcionLineas = doc.splitTextToSize(datos.descripcion, contentWidth - 30)
    doc.text(descripcionLineas, marginLeft + 25, currentY)
    currentY += (descripcionLineas.length * 4) + 2
  } else {
    currentY += 2
  }

  doc.text('Método de pago:', marginLeft, currentY)
  const metodoPagoTexto = datos.metodoPago === 'mercadopago' ? 'Mercado Pago' :
                          datos.metodoPago === 'manual' ? 'Efectivo/Transferencia' :
                          datos.metodoPago
  doc.text(metodoPagoTexto, marginLeft + 30, currentY)
  currentY += 4

  if (datos.referencia) {
    doc.text('Referencia:', marginLeft, currentY)
    doc.text(datos.referencia, marginLeft + 25, currentY)
    currentY += 4
  }

  currentY += 2

  // Línea separadora
  doc.setDrawColor(200, 200, 200)
  doc.line(marginLeft, currentY, pageWidth - marginRight, currentY)
  currentY += 5

  // Monto - destacado
  doc.setFillColor(240, 240, 240)
  doc.rect(marginLeft, currentY - 4, contentWidth, 10, 'F')

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL PAGADO:', marginLeft + 2, currentY + 2)

  doc.setFontSize(14)
  doc.setTextColor(0, 128, 0) // Verde
  const montoTexto = `$${datos.monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`
  doc.text(montoTexto, pageWidth - marginRight - 2, currentY + 2, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  currentY += 12

  // Pagado por
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Pagado por:', marginLeft, currentY)
  doc.text(`${datos.padreNombre} ${datos.padreApellidos}`, marginLeft + 22, currentY)
  currentY += 6

  // Nota al pie
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  doc.text(
    'Este recibo es válido como comprobante de pago. Conserve este documento para futuras referencias.',
    pageWidth / 2,
    currentY + 2,
    { align: 'center', maxWidth: contentWidth }
  )
}

/**
 * Descarga el PDF con el nombre de archivo especificado
 */
export function descargarReciboPDF(datos: DatosRecibo, nombreArchivo?: string) {
  const doc = generarReciboPDF(datos)
  const filename = nombreArchivo || `recibo_${datos.numeroRecibo}.pdf`
  doc.save(filename)
}

/**
 * Abre el PDF en una nueva ventana para imprimir
 */
export function imprimirReciboPDF(datos: DatosRecibo) {
  const doc = generarReciboPDF(datos)
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
