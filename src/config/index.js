'use strict';

require('dotenv').config({ quiet: true });

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'reporte-a-clientes-dev-secret',

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

module.exports = config;
