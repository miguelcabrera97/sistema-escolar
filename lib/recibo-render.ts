import { jsPDF } from 'jspdf'
import { DatosRecibo } from './recibo-pdf'

const UNIDADES = ['', 'UN ', 'DOS ', 'TRES ', 'CUATRO ', 'CINCO ', 'SEIS ', 'SIETE ', 'OCHO ', 'NUEVE ']
const DECENAS = ['DIEZ ', 'ONCE ', 'DOCE ', 'TRECE ', 'CATORCE ', 'QUINCE ', 'DIECISES ', 'DIECISIETE ', 'DIECIOCHO ', 'DIECINUEVE ', 'VEINTE ', 'TREINTA ', 'CUARENTA ', 'CINCUENTA ', 'SESENTA ', 'SETENTA ', 'OCHENTA ', 'NOVENTA ']
const CENTENAS = ['', 'CIENTO ', 'DOSCIENTOS ', 'TRESCIENTOS ', 'CUATROCIENTOS ', 'QUINIENTOS ', 'SEISCIENTOS ', 'SETECIENTOS ', 'OCHOCIENTOS ', 'NOVECIENTOS ']

function numeroALetrasSimple(num: number): string {
    const value = Math.trunc(num);
    const cents = Math.round((num - value) * 100);

    if (value === 0) return `CERO PESOS ${cents.toString().padStart(2, '0')}/100 M.N.`;

    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const diez_diecinueve = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const veinte_veintinueve = ['VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];

    function convertGroup(n: number): string {
        if (n === 0) return '';
        if (n === 100) return 'CIEN ';

        let str = '';

        // Centenas
        if (n >= 100) {
            str += centenas[Math.floor(n / 100)] + ' ';
            n %= 100;
        }

        // Decenas y Unidades
        if (n >= 10 && n <= 19) {
            str += diez_diecinueve[n - 10] + ' ';
            return str;
        } else if (n >= 20 && n <= 29) {
            str += veinte_veintinueve[n - 20] + ' ';
            return str;
        } else if (n >= 30) {
            str += decenas[Math.floor(n / 10)];
            if (n % 10 > 0) str += ' Y ' + unidades[n % 10];
            str += ' ';
            return str;
        } else if (n > 0) {
            str += unidades[n] + ' ';
        }
        return str;
    }

    let letras = '';

    if (value >= 1000) {
        const miles = Math.floor(value / 1000);
        const resto = value % 1000;
        if (miles === 1) letras += 'MIL ';
        else letras += convertGroup(miles) + 'MIL ';
        letras += convertGroup(resto);
    } else {
        letras += convertGroup(value);
    }

    return `${letras.trim()} PESOS ${cents.toString().padStart(2, '0')}/100 M.N.`;
}

// Función pura de renderizado a nivel de módulo
export function renderizarCopia(
    doc: jsPDF,
    datos: DatosRecibo,
    startY: number,
    tipo: 'ORIGINAL' | 'COPIA',
    nombreEscuela: string,
    rfcEscuela: string,
    direccion: string,
    logoData: string | null
) {
    const pageWidth = doc.internal.pageSize.getWidth()
    const marginLeft = 15
    const marginRight = 15
    let currentY = startY

    const headerCenterX = (pageWidth / 2) + 10;

    // Logo
    if (logoData) {
        try {
            const logoSize = 25;
            doc.addImage(logoData, 'PNG', marginLeft, currentY, logoSize, logoSize)
        } catch (e) {
            console.warn('Error adding image to PDF', e)
            doc.setFillColor(240, 240, 240);
            doc.rect(marginLeft, currentY, 25, 25, 'F');
        }
    }

    // Nombre Escuela
    doc.setFont('times', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 128)
    doc.text(nombreEscuela, headerCenterX, currentY + 10, { align: 'center' })

    // RFC
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text(`R. F. C.: ${rfcEscuela}`, headerCenterX, currentY + 15, { align: 'center' })

    // Nombre Escuela 2
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 128)
    doc.text('SECUNDARIA Y PREPARATORIA BENEMÉRITO DE LAS AMÉRICAS', headerCenterX, currentY + 20, { align: 'center' })

    // Dirección
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(direccion, headerCenterX, currentY + 25, { align: 'center' })

    // --- FOLIO ---
    doc.setDrawColor(0, 0, 0)
    doc.rect(pageWidth - marginRight - 35, currentY + 5, 30, 15)
    doc.setFontSize(8)
    doc.text('FOLIO', pageWidth - marginRight - 33, currentY + 15, { angle: 90 })
    doc.setFontSize(14)
    doc.setTextColor(200, 0, 0)
    doc.setFont('courier', 'bold')
    const displayFolio = datos.numeroRecibo.length > 6 ? datos.numeroRecibo.slice(-4) : datos.numeroRecibo;
    doc.text(displayFolio, pageWidth - marginRight - 5, currentY + 14, { align: 'right' })

    currentY += 35

    // --- DATOS DEL ALUMNO ---
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 128)

    doc.text('NOMBRE DEL ALUMNO', marginLeft, currentY)
    doc.setDrawColor(0, 0, 0)
    doc.line(marginLeft + 42, currentY, pageWidth - marginRight, currentY)
    doc.setFont('courier', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`${datos.alumnoNombre} ${datos.alumnoApellidos}`, marginLeft + 45, currentY - 1)

    currentY += 8

    // Nivel, Grupo, Fecha
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 128)
    doc.text('NIVEL', marginLeft, currentY)
    doc.line(marginLeft + 12, currentY, marginLeft + 60, currentY)

    doc.text('GRUPO', marginLeft + 65, currentY)
    doc.line(marginLeft + 80, currentY, marginLeft + 110, currentY)

    doc.text('FECHA', marginLeft + 115, currentY)
    doc.line(marginLeft + 130, currentY, pageWidth - marginRight, currentY)

    // Valores
    doc.setFont('courier', 'normal')
    doc.setTextColor(0, 0, 0)

    let nivel = datos.nivelEducativo || '';
    if (!nivel) {
        if (datos.alumnoGrado) {
            const g = parseInt(datos.alumnoGrado);
            nivel = (!isNaN(g) && g > 6) ? 'Secundaria/Prepa' : 'Primaria';
            nivel = 'Prepa/Sec'
        }
    }

    doc.text(nivel, marginLeft + 15, currentY - 1)
    doc.text(datos.alumnoGrupo, marginLeft + 82, currentY - 1)
    let fechaStr = datos.fechaPago;
    try {
        const dateObj = new Date(datos.fechaPago);
        if (!isNaN(dateObj.getTime())) {
            fechaStr = dateObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });
        }
    } catch (e) { }
    doc.text(fechaStr, marginLeft + 132, currentY - 1)

    currentY += 8

    // --- TABLA DE CONCEPTOS ---
    const conceptos = [
        'INSCRIPCIÓN:',
        'GASTOS ADMINISTRATIVOS:',
        'SEGURO ESCOLAR:',
        'LIBROS:',
        'COLEGIATURA:',
        'COLEGIATURA:',
        'OTROS:'
    ]

    const rowHeight = 7
    const conceptoLower = datos.concepto.toLowerCase();

    conceptos.forEach((conceptoLabel, index) => {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 128)
        doc.text(conceptoLabel, marginLeft, currentY)

        doc.setDrawColor(0, 0, 128)
        doc.setLineWidth(0.1)
        doc.line(marginLeft, currentY + 1, pageWidth - marginRight, currentY + 1)

        let montoCelda = '';
        let descripcionCelda = '';

        if (conceptoLabel.includes('INSCRIPCIÓN') && conceptoLower.includes('inscripción')) {
            montoCelda = `${datos.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        } else if (conceptoLabel === 'COLEGIATURA:' && conceptoLower.includes('colegiatura')) {
            if (index === 4) {
                montoCelda = `${datos.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
            }
        } else if (conceptoLabel === 'OTROS:' && !conceptoLower.includes('inscripción') && !conceptoLower.includes('colegiatura')) {
            montoCelda = `${datos.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
            descripcionCelda = `${datos.concepto} ${datos.descripcion || ''}`;
        }

        const xMonto = pageWidth - marginRight - 35;

        if (montoCelda) {
            doc.setFont('courier', 'normal')
            doc.setTextColor(0, 0, 0)
            doc.text(montoCelda, pageWidth - marginRight - 2, currentY, { align: 'right' })
        }

        if (descripcionCelda) {
            doc.setFont('courier', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(100, 100, 100)
            doc.text(descripcionCelda, marginLeft + 20, currentY)
        }

        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 128)
        doc.text('$', xMonto, currentY)

        currentY += rowHeight
    })

    // --- TOTALES ---
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 128)

    const xTotalLabel = pageWidth - marginRight - 50;
    doc.text('TOTAL $', xTotalLabel, currentY)

    doc.setFont('courier', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.text(`${datos.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, pageWidth - marginRight - 2, currentY, { align: 'right' })

    currentY += 8

    // PENDIENTE POR PAGAR
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 128)
    doc.text('PENDIENTE POR PAGAR: $', pageWidth - marginRight - 75, currentY)
    doc.line(pageWidth - marginRight - 35, currentY, pageWidth - marginRight, currentY)

    currentY += 10

    // --- CANTIDAD CON LETRA ---
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 128)
    doc.text('CANTIDAD CON LETRA', marginLeft, currentY)

    currentY += 5
    doc.line(marginLeft, currentY, pageWidth - marginRight, currentY)

    doc.setFont('courier', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    const letra = numeroALetrasSimple(datos.monto)
    doc.text(letra, marginLeft + 5, currentY - 1)

    currentY += 8

    // --- FIRMA ---
    const yFirma = startY + 125

    doc.setDrawColor(0, 0, 128)
    doc.line(pageWidth - marginRight - 50, yFirma, pageWidth - marginRight, yFirma)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 128)
    doc.text('RECIBIÓ', pageWidth - marginRight - 25, yFirma + 4, { align: 'center' })

    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(tipo, pageWidth - marginRight, startY + 5, { align: 'right' })
}
