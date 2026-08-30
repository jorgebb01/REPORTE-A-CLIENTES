/**
 * SERVICIO
 * Encapsula la comunicación con la API de Claude (Anthropic).
 * El controlador no conoce detalles del SDK; solo llama a `generarRespuesta`.
 */

'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');
const { SYSTEM_PROMPT } = require('../prompts/systemPrompt');

let client = null;
function getClient() {
  if (!config.claude.configurado) {
    const err = new Error(
      'No se ha configurado ANTHROPIC_API_KEY. Copie .env.example a .env y agregue su clave.'
    );
    err.code = 'CLAUDE_NO_CONFIGURADO';
    throw err;
  }
  if (!client) {
    client = new Anthropic({ apiKey: config.claude.apiKey });
  }
  return client;
}

/**
 * Envía la conversación a Claude y devuelve el texto de la respuesta.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} mensajes
 * @returns {Promise<{ texto: string, usage: object, model: string }>}
 */
async function generarRespuesta(mensajes) {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: config.claude.model,
    max_tokens: config.claude.maxTokens,
    output_config: { effort: config.claude.effort },
    system: [
      { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ],
    messages: mensajes.map((m) => ({ role: m.role, content: m.content })),
  });

  if (response.stop_reason === 'refusal') {
    const err = new Error(
      'El modelo no pudo procesar la solicitud' +
        (response.stop_details && response.stop_details.explanation
          ? `: ${response.stop_details.explanation}`
          : '.')
    );
    err.code = 'CLAUDE_REFUSAL';
    throw err;
  }

  const texto = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();

  if (!texto) {
    const err = new Error('El modelo devolvió una respuesta vacía.');
    err.code = 'CLAUDE_RESPUESTA_VACIA';
    throw err;
  }

  return { texto, usage: response.usage, model: response.model };
}

/**
 * Interpreta la respuesta del modelo según el protocolo ESTADO: CONSULTA / ESTADO: INFORME.
 *
 * @param {string} texto
 * @returns {{ tipo: 'consulta'|'informe'|'desconocido', contenido: string }}
 */
function interpretarRespuesta(texto) {
  const limpio = texto.trim();
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
