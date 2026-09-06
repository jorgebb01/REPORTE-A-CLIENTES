/**
 * PUNTO DE ENTRADA DEL EJECUTABLE
 * Arranca el servidor de informes técnicos y abre el navegador por defecto.
 * Se compila con `npm run build:exe` en un único archivo .exe portátil.
 */

'use strict';

const { execFile } = require('child_process');
const app = require('./src/app');
const config = require('./src/config');

function abrirNavegador(url) {
  const plataforma = process.platform;
  try {
    if (plataforma === 'win32') {
      execFile('cmd', ['/c', 'start', '""', url]);
    } else if (plataforma === 'darwin') {
      execFile('open', [url]);
    } else {
      execFile('xdg-open', [url]);
    }
  } catch (_) {
    /* si falla, el usuario abre la URL manualmente */
  }
}

const server = app.listen(config.port, () => {
  const url = `http://localhost:${config.port}`;
  const proveedor = config.ai.provider;
  const estado = config.ai.configurada
    ? `configurada (${config.ai.modelo})`
    : 'NO configurada';

  console.log('');
  console.log('  ============================================');
  console.log('   Informes Tecnicos Automotrices');
  console.log('  ============================================');
  console.log(`   Servidor:  ${url}`);
  console.log(`   IA (${proveedor}): ${estado}`);
  console.log('');
  console.log('   Deje esta ventana abierta mientras usa la');
  console.log('   aplicacion. Cierrela para detener el servidor.');
  console.log('  ============================================');
  console.log('');

  abrirNavegador(url);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n  El puerto ${config.port} ya esta en uso. Cierre la otra instancia ` +
        `o defina otro puerto con la variable PORT.\n`
    );
  } else {
    console.error('\n  Error al iniciar el servidor:', err.message, '\n');
  }
  process.exitCode = 1;
});
