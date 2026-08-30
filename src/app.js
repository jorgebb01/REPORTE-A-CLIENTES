'use strict';

const path = require('path');
const express = require('express');
const session = require('express-session');

const config = require('./config');
const routes = require('./routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }, // 8 horas
  })
);

app.use('/', routes);

// 404
app.use((req, res) => {
  res.status(404).render('error', {
    titulo: 'Página no encontrada',
    mensaje: 'La ruta solicitada no existe.',
    detalle: null,
  });
});

// Manejo de errores
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);

  let mensaje = 'Ocurrió un error al procesar la solicitud.';
  let detalle = err.message;

  const msg = String(err.message || '');
  const status = err.status || (err.response && err.response.status);

  if (err.code === 'IA_NO_CONFIGURADA' || err.code === 'CLAUDE_NO_CONFIGURADO') {
    mensaje =
      'La integración con la IA no está configurada. Defina GEMINI_API_KEY (o ANTHROPIC_API_KEY) en el archivo .env.';
    detalle = null;
  } else if (err.code === 'IA_BLOQUEADA' || err.code === 'CLAUDE_REFUSAL') {
    mensaje = 'El modelo no pudo generar el informe con la información suministrada.';
  } else if (/credit balance is too low/i.test(msg)) {
    mensaje =
      'La cuenta de Anthropic no tiene saldo suficiente. Ingrese a console.anthropic.com → Plans & Billing y agregue créditos.';
    detalle = null;
  } else if (/API key not valid|API_KEY_INVALID|invalid api key/i.test(msg) || status === 401 || status === 403) {
    mensaje = 'La clave de API es inválida o no está autorizada. Verifique GEMINI_API_KEY en .env.';
    detalle = null;
  } else if (status === 429 || /quota|rate limit|RESOURCE_EXHAUSTED/i.test(msg)) {
    mensaje =
      'Se alcanzó el límite de solicitudes o la cuota del proveedor de IA. Intente nuevamente en unos minutos.';
    detalle = null;
  }

  res.status(status || 500).render('error', {
    titulo: 'Error',
    mensaje,
    detalle,
  });
});

module.exports = app;
