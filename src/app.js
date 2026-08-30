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

  if (err.code === 'CLAUDE_NO_CONFIGURADO') {
    mensaje = 'La integración con Claude no está configurada.';
  } else if (err.code === 'CLAUDE_REFUSAL') {
    mensaje = 'El modelo no pudo generar el informe con la información suministrada.';
  } else if (err.status === 401) {
    mensaje = 'La clave de API de Claude es inválida o no está autorizada.';
  } else if (err.status === 429) {
    mensaje = 'Se alcanzó el límite de solicitudes a la API de Claude. Intente nuevamente en unos minutos.';
  }

  res.status(err.status || 500).render('error', {
    titulo: 'Error',
    mensaje,
    detalle,
  });
});

module.exports = app;
