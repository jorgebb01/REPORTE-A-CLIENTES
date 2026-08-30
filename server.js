'use strict';

const app = require('./src/app');
const config = require('./src/config');

app.listen(config.port, () => {
  console.log(`\n  Informes Técnicos Automotrices`);
  console.log(`  Servidor en http://localhost:${config.port}`);
  console.log(
    `  Claude: ${config.claude.configurado ? `configurado (${config.claude.model})` : 'NO configurado — defina ANTHROPIC_API_KEY en .env'}\n`
  );
});
