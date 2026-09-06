'use strict';

require('dotenv').config({ quiet: true });

// Valores incrustados en el ejecutable. Solo se aplican cuando la variable de
// entorno (o el .env) no define la clave, de modo que un .env externo siempre
// puede sobreescribirlos.
//
// `embedded.js` NO está versionado (contiene la clave real que se compila en el
// .exe). Si no existe, se usa `embedded.example.js` con placeholders y la
// aplicación funciona con lo que haya en `.env`.
let embedded;
try {
  embedded = require('./embedded');
} catch (_) {
  embedded = require('./embedded.example');
}
for (const [clave, valor] of Object.entries(embedded)) {
  if (process.env[clave] === undefined || process.env[clave] === '') {
    if (valor !== '') process.env[clave] = valor;
  }
}

// Proveedor de IA a utilizar: 'gemini' (por defecto) o 'claude'.
const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'reporte-a-clientes-dev-secret',

  ai: {
    provider,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS, 10) || 16000,
  },

  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-opus-5',
    effort: process.env.CLAUDE_EFFORT || 'high',
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS, 10) || 16000,
  },

  defaults: {
    ciudad: process.env.DEFAULT_CIUDAD || '',
    sucursal: process.env.DEFAULT_SUCURSAL || '',
    firmanteNombre: process.env.DEFAULT_FIRMANTE_NOMBRE || '',
    firmanteCargo: process.env.DEFAULT_FIRMANTE_CARGO || '',
    empresa: process.env.DEFAULT_EMPRESA || '',
  },
};

config.claude.configurado = Boolean(config.claude.apiKey);
config.gemini.configurado = Boolean(config.gemini.apiKey);

// ¿Está configurado el proveedor activo?
config.ai.configurada =
  provider === 'claude' ? config.claude.configurado : config.gemini.configurado;

config.ai.modelo = provider === 'claude' ? config.claude.model : config.gemini.model;

module.exports = config;
