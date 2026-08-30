/**
 * SERVICIO
 * Encapsula la comunicación con la API de Gemini (Google GenAI).
 * Expone la misma interfaz que claudeService: `generarRespuesta(mensajes)`.
 */

'use strict';

const { GoogleGenAI } = require('@google/genai');
const config = require('../config');
const { SYSTEM_PROMPT } = require('../prompts/systemPrompt');

let client = null;
function getClient() {
  if (!config.gemini.configurado) {
    const err = new Error(
      'No se ha configurado GEMINI_API_KEY. Copie .env.example a .env y agregue su clave de Google AI Studio.'
    );
    err.code = 'IA_NO_CONFIGURADA';
    throw err;
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }
  return client;
}

/**
 * Convierte la conversación interna (roles user/assistant) al formato `contents`
 * de Gemini (roles user/model).
 */
function aContents(mensajes) {
  return mensajes.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

/**
 * Envía la conversación a Gemini y devuelve el texto de la respuesta.
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} mensajes
 * @returns {Promise<{ texto: string, usage: object, model: string }>}
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generarRespuesta(mensajes) {
  const ai = getClient();

  const peticion = {
    model: config.gemini.model,
    contents: aContents(mensajes),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: config.gemini.maxTokens,
      temperature: 0.4,
    },
  };

  // Reintento ante 503 (modelo con alta demanda), que suele ser transitorio.
  let response;
  const maxIntentos = 3;
  for (let intento = 1; ; intento++) {
    try {
      response = await ai.models.generateContent(peticion);
      break;
    } catch (e) {
      const status = e && (e.status || (e.response && e.response.status));
      const transitorio = status === 503 || /UNAVAILABLE|high demand|overloaded/i.test(e.message || '');
      if (transitorio && intento < maxIntentos) {
        await sleep(1500 * intento);
        continue;
      }
      throw e;
    }
  }

  const bloqueo =
    response.promptFeedback && response.promptFeedback.blockReason;
  if (bloqueo) {
    const err = new Error(`La solicitud fue bloqueada por Gemini (${bloqueo}).`);
    err.code = 'IA_BLOQUEADA';
    throw err;
  }

  const candidato = (response.candidates && response.candidates[0]) || {};
  const finish = candidato.finishReason;

  const texto = (response.text || '').trim();

  if (!texto) {
    const err = new Error(
      `El modelo devolvió una respuesta vacía${finish ? ` (finishReason: ${finish})` : ''}.`
    );
    err.code = 'IA_RESPUESTA_VACIA';
    throw err;
  }

  if (finish === 'MAX_TOKENS') {
    // No es fatal: se devuelve lo generado, pero se deja constancia.
    console.warn('[gemini] Respuesta truncada por MAX_TOKENS. Suba GEMINI_MAX_TOKENS.');
  }

  return {
    texto,
    usage: response.usageMetadata || {},
    model: config.gemini.model,
  };
}

module.exports = { generarRespuesta };
