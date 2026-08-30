'use strict';

require('dotenv').config({ quiet: true });

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
