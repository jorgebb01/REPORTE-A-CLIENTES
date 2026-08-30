'use strict';

const app = require('./src/app');
const config = require('./src/config');

app.listen(config.port, () => {
  console.log(`\n  Informes Técnicos Automotrices`);
  console.log(`  Servidor en http://localhost:${config.port}`);
  const nombreVar = config.ai.provider === 'claude' ? 'ANTHROPIC_API_KEY' : 'GEMINI_API_KEY';
  console.log(
    `  IA (${config.ai.provider}): ${
      config.ai.configurada
        ? `configurada (${config.ai.modelo})`
        : `NO configurada — defina ${nombreVar} en .env`
    }\n`
  );
});
