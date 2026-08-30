/**
 * SERVICIO (fachada)
 * Punto único de acceso a la IA para el controlador. Selecciona el proveedor
 * según config.ai.provider ('gemini' por defecto, o 'claude') y expone:
 *   - generarRespuesta(mensajes)
 *   - interpretarRespuesta(texto)
 */

'use strict';

const config = require('../config');

const proveedor =
  config.ai.provider === 'claude'
    ? require('./claudeService')
    : require('./geminiService');

/**
 * @param {Array<{role: 'user'|'assistant', content: string}>} mensajes
 * @returns {Promise<{ texto: string, usage: object, model: string }>}
 */
function generarRespuesta(mensajes) {
  return proveedor.generarRespuesta(mensajes);
}

/**
 * Interpreta la respuesta del modelo según el protocolo
 * ESTADO: CONSULTA / ESTADO: INFORME. Es independiente del proveedor.
 *
 * @param {string} texto
 * @returns {{ tipo: 'consulta'|'informe'|'desconocido', contenido: string }}
 */
function interpretarRespuesta(texto) {
  const limpio = String(texto || '').trim();
  const primeraLinea = limpio.split('\n', 1)[0].trim().toUpperCase();

  if (primeraLinea.startsWith('ESTADO: CONSULTA') || primeraLinea.startsWith('ESTADO:CONSULTA')) {
    return { tipo: 'consulta', contenido: limpio.replace(/^ESTADO:\s*CONSULTA\s*/i, '').trim() };
  }
  if (primeraLinea.startsWith('ESTADO: INFORME') || primeraLinea.startsWith('ESTADO:INFORME')) {
    return { tipo: 'informe', contenido: limpio.replace(/^ESTADO:\s*INFORME\s*/i, '').trim() };
  }
  return { tipo: 'desconocido', contenido: limpio };
}

module.exports = { generarRespuesta, interpretarRespuesta };
