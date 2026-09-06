/**
 * PLANTILLA DE CONFIGURACIÓN INCRUSTADA
 *
 * Copie este archivo a `embedded.js` y complete los valores reales antes de
 * generar el ejecutable con `npm run build:exe`. `embedded.js` está en
 * .gitignore: la clave nunca se sube al repositorio, solo queda compilada
 * dentro del .exe.
 *
 * Si `embedded.js` no existe, la aplicación usa esta plantilla y toma la
 * configuración de las variables de entorno / `.env`.
 *
 * Un `.env` colocado junto al ejecutable SIEMPRE tiene prioridad sobre estos
 * valores.
 */

'use strict';

module.exports = {
  AI_PROVIDER: 'gemini',

  // Clave de Google AI Studio: https://aistudio.google.com/apikey
  GEMINI_API_KEY: '',
  GEMINI_MODEL: 'gemini-3.5-flash',
  GEMINI_MAX_TOKENS: '16000',

  ANTHROPIC_API_KEY: '',
  CLAUDE_MODEL: 'claude-opus-5',
  CLAUDE_EFFORT: 'high',
  CLAUDE_MAX_TOKENS: '16000',

  PORT: '3000',
  SESSION_SECRET: 'reporte-a-clientes-exe-secret',

  DEFAULT_CIUDAD: 'San José',
  DEFAULT_SUCURSAL: '',
  DEFAULT_FIRMANTE_NOMBRE: '',
  DEFAULT_FIRMANTE_CARGO: 'Gerente de Servicio',
  DEFAULT_EMPRESA: '',
};
