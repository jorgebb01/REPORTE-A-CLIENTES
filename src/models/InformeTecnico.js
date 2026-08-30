/**
 * MODELO
 * Representa los datos de entrada de un informe técnico automotriz.
 * Responsable de: normalizar los datos del formulario, validarlos y
 * construir el mensaje estructurado que se envía a Claude.
 */

'use strict';

/**
 * Definición de campos del formulario.
 * - key: nombre del campo (name en el formulario)
 * - label: etiqueta legible
 * - required: si es obligatorio para poder enviar el formulario
 * - group: agrupación visual en la vista
 * - type: 'text' | 'textarea' | 'date'
 * - help: texto de ayuda opcional
 */
const CAMPOS = [
  // 1. Encabezado formal
  { key: 'ciudad', label: 'Ciudad', required: true, group: 'Encabezado formal', type: 'text' },
  { key: 'fechaInforme', label: 'Fecha del informe', required: true, group: 'Encabezado formal', type: 'date' },
  { key: 'clienteNombre', label: 'Nombre completo del cliente', required: true, group: 'Encabezado formal', type: 'text' },

  // Referencia del vehículo
  { key: 'marca', label: 'Marca del vehículo', required: true, group: 'Vehículo', type: 'text' },
  { key: 'modelo', label: 'Modelo', required: true, group: 'Vehículo', type: 'text' },
  { key: 'anio', label: 'Año', required: true, group: 'Vehículo', type: 'text' },
  { key: 'placa', label: 'Número de placa', required: true, group: 'Vehículo', type: 'text' },
  { key: 'vin', label: 'VIN (si aplica)', required: false, group: 'Vehículo', type: 'text', help: 'Dejar en blanco si no aplica.' },

  // 2. Información general
  { key: 'kilometraje', label: 'Kilometraje registrado al ingreso', required: true, group: 'Información general', type: 'text' },
  { key: 'fechaIngreso', label: 'Fecha de ingreso', required: true, group: 'Información general', type: 'date' },
  { key: 'sucursal', label: 'Taller o sucursal', required: true, group: 'Información general', type: 'text' },
  { key: 'ordenTrabajo', label: 'Número de orden de trabajo (si aplica)', required: false, group: 'Información general', type: 'text' },

  // 3. Motivo de ingreso
  {
    key: 'motivoIngreso',
    label: 'Motivo de ingreso / reclamo reportado por el cliente',
    required: true,
    group: 'Motivo de ingreso',
    type: 'textarea',
    help: 'Síntomas indicados, condiciones descritas y antecedentes relevantes manifestados por el cliente.',
  },

  // 4. Inspecciones
  {
    key: 'inspecciones',
    label: 'Inspecciones y verificaciones realizadas',
    required: true,
    group: 'Inspecciones y diagnóstico',
    type: 'textarea',
    help: 'Revisiones, pruebas de carretera, escaneos electrónicos, inspecciones visuales, mediciones, verificaciones mecánicas, validaciones del fabricante.',
  },

  // 5. Diagnóstico
  {
    key: 'diagnostico',
    label: 'Diagnóstico técnico encontrado',
    required: true,
    group: 'Inspecciones y diagnóstico',
    type: 'textarea',
    help: 'Solo hallazgos comprobados, componentes inspeccionados, condiciones verificadas y evidencia encontrada.',
  },

  // 6. Trabajos realizados
  {
    key: 'trabajos',
    label: 'Trabajos ejecutados',
    required: true,
    group: 'Trabajos y resultados',
    type: 'textarea',
    help: 'Reparaciones, ajustes, reemplazo de piezas, actualizaciones de software, calibraciones, procedimientos correctivos. Si no se realizaron, indíquelo.',
  },

  // 7. Pruebas finales
  {
    key: 'pruebasFinales',
    label: 'Resultado de las pruebas finales',
    required: true,
    group: 'Trabajos y resultados',
    type: 'textarea',
    help: 'Resultado de validaciones posteriores, funcionamiento observado y estado del vehículo tras la intervención.',
  },

  // 8. Observaciones
  {
    key: 'observaciones',
    label: 'Observaciones adicionales / preventivas',
    required: false,
    group: 'Trabajos y resultados',
    type: 'textarea',
    help: 'Recomendaciones de monitoreo, inspecciones futuras, seguimiento técnico, condiciones externas. Opcional.',
  },

  // 9. Cierre / firma
  { key: 'firmanteNombre', label: 'Nombre de quien firma', required: true, group: 'Cierre y firma', type: 'text' },
  { key: 'firmanteCargo', label: 'Cargo de quien firma', required: true, group: 'Cierre y firma', type: 'text' },
  { key: 'empresa', label: 'Nombre de la empresa / concesionaria', required: false, group: 'Cierre y firma', type: 'text' },

  // Notas libres para el modelo
  {
    key: 'notasAsesor',
    label: 'Notas del asesor para la redacción (no se transcriben literalmente)',
    required: false,
    group: 'Cierre y firma',
    type: 'textarea',
    help: 'Contexto adicional, aclaraciones o instrucciones puntuales para la redacción.',
  },
];

const CAMPOS_POR_GRUPO = CAMPOS.reduce((acc, campo) => {
  (acc[campo.group] = acc[campo.group] || []).push(campo);
  return acc;
}, {});

class InformeTecnico {
  /**
   * @param {Record<string, string>} datos - normalmente req.body
   */
  constructor(datos = {}) {
    for (const campo of CAMPOS) {
      const valor = datos[campo.key];
      this[campo.key] = typeof valor === 'string' ? valor.trim() : '';
    }
  }

  /**
   * Valida los campos obligatorios.
   * @returns {{ valido: boolean, errores: Array<{campo: string, mensaje: string}> }}
   */
  validar() {
    const errores = [];
    for (const campo of CAMPOS) {
      if (campo.required && !this[campo.key]) {
        errores.push({ campo: campo.key, mensaje: `El campo "${campo.label}" es obligatorio.` });
      }
    }
    return { valido: errores.length === 0, errores };
  }

  /** Objeto plano solo con los datos del informe. */
  toObject() {
    const obj = {};
    for (const campo of CAMPOS) obj[campo.key] = this[campo.key];
    return obj;
  }

  /**
   * Construye el mensaje de usuario para Claude a partir de los datos.
   * Presenta los datos de forma estructurada y marca explícitamente lo faltante.
   * @returns {string}
   */
  construirMensajeUsuario() {
    const v = (x) => (x && x.length ? x : '(no suministrado)');
    const vin = this.vin ? this.vin : '(no aplica / no suministrado)';
    const orden = this.ordenTrabajo ? this.ordenTrabajo : '(no aplica / no suministrado)';
    const observaciones = this.observaciones ? this.observaciones : '(sin observaciones adicionales suministradas)';
    const empresa = this.empresa ? this.empresa : '(no suministrado)';
    const notas = this.notasAsesor ? this.notasAsesor : '(sin notas)';

    return [
      'Solicito la elaboración de un informe técnico automotriz con los siguientes datos suministrados por el asesor de servicio.',
      '',
      'DATOS DEL ENCABEZADO',
      `- Ciudad: ${v(this.ciudad)}`,
      `- Fecha del informe: ${v(this.fechaInforme)}`,
      `- Nombre completo del cliente: ${v(this.clienteNombre)}`,
      '',
      'REFERENCIA DEL VEHÍCULO',
      `- Marca: ${v(this.marca)}`,
      `- Modelo: ${v(this.modelo)}`,
      `- Año: ${v(this.anio)}`,
      `- Placa: ${v(this.placa)}`,
      `- VIN: ${vin}`,
      '',
      'INFORMACIÓN GENERAL DEL VEHÍCULO',
      `- Kilometraje al ingreso: ${v(this.kilometraje)}`,
      `- Fecha de ingreso: ${v(this.fechaIngreso)}`,
      `- Taller o sucursal: ${v(this.sucursal)}`,
      `- Número de orden de trabajo: ${orden}`,
      '',
      'MOTIVO DE INGRESO (manifestado por el cliente)',
      v(this.motivoIngreso),
      '',
      'INSPECCIONES Y VERIFICACIONES REALIZADAS',
      v(this.inspecciones),
      '',
      'DIAGNÓSTICO TÉCNICO ENCONTRADO',
      v(this.diagnostico),
      '',
      'TRABAJOS EJECUTADOS',
      v(this.trabajos),
      '',
      'RESULTADO DE LAS PRUEBAS FINALES',
      v(this.pruebasFinales),
      '',
      'OBSERVACIONES ADICIONALES / PREVENTIVAS',
      observaciones,
      '',
      'CIERRE Y FIRMA',
      `- Nombre de quien firma: ${v(this.firmanteNombre)}`,
      `- Cargo de quien firma: ${v(this.firmanteCargo)}`,
      `- Empresa / concesionaria: ${empresa}`,
      '',
      'NOTAS DEL ASESOR PARA LA REDACCIÓN (no transcribir literalmente)',
      notas,
      '',
      'Aplica el flujo de trabajo obligatorio y responde siguiendo el protocolo de respuesta (ESTADO: CONSULTA o ESTADO: INFORME).',
    ].join('\n');
  }
}

module.exports = { InformeTecnico, CAMPOS, CAMPOS_POR_GRUPO };
