/**
 * SERVICIO
 * Convierte el texto del informe generado por Claude en un documento .docx
 * con presentación de carta formal corporativa.
 */

'use strict';

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
} = require('docx');

// Detecta títulos de sección tipo "1. ENCABEZADO FORMAL"
const RE_TITULO_SECCION = /^\s*\d{1,2}\.\s+[A-ZÁÉÍÓÚÑ0-9][A-ZÁÉÍÓÚÑ0-9 ,/()-]{3,}$/;

function esTituloSeccion(linea) {
  return RE_TITULO_SECCION.test(linea.trim());
}

/**
 * @param {string} textoInforme - contenido del informe (sin la línea "ESTADO: INFORME")
 * @param {object} [meta]
 * @param {string} [meta.empresa]
 * @returns {Promise<Buffer>}
 */
async function generarDocx(textoInforme, meta = {}) {
  const bloques = textoInforme
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const children = [];

  if (meta.empresa) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: meta.empresa, bold: true, size: 28 })],
        spacing: { after: 240 },
      })
    );
  }

  for (const bloque of bloques) {
    const lineas = bloque.split('\n').map((l) => l.trim());

    // Bloque que es únicamente un título de sección
    if (lineas.length === 1 && esTituloSeccion(lineas[0])) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: lineas[0], bold: true })],
        })
      );
      continue;
    }

    // Bloque mixto: primera línea título + resto párrafo
    if (esTituloSeccion(lineas[0])) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: lineas[0], bold: true })],
        })
      );
      lineas.shift();
    }

    if (lineas.length) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 160, line: 300 },
          children: lineas.flatMap((linea, i) =>
            i === 0
              ? [new TextRun({ text: linea })]
              : [new TextRun({ text: linea, break: 1 })]
          ),
        })
      );
    }
  }

  const doc = new Document({
    creator: meta.empresa || 'Departamento de Servicio',
    title: 'Informe Técnico Automotriz',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

module.exports = { generarDocx };
