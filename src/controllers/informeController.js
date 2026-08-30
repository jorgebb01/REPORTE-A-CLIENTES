/**
 * CONTROLADOR
 * Orquesta el flujo: recibe datos de la vista -> usa el Modelo para validar y
 * construir el mensaje -> llama al Servicio de Claude -> devuelve la vista con
 * las preguntas del modelo o con el informe final. También genera el .docx.
 */

'use strict';

const config = require('../config');
const { InformeTecnico, CAMPOS_POR_GRUPO } = require('../models/InformeTecnico');
const claudeService = require('../services/claudeService');
const { generarDocx } = require('../services/wordService');

function datosIniciales(session) {
  if (session && session.datos) return session.datos;
  return {
    ciudad: config.defaults.ciudad,
    sucursal: config.defaults.sucursal,
    firmanteNombre: config.defaults.firmanteNombre,
    firmanteCargo: config.defaults.firmanteCargo,
    empresa: config.defaults.empresa,
    fechaInforme: new Date().toISOString().slice(0, 10),
  };
}

/** GET / */
function mostrarFormulario(req, res) {
  res.render('index', {
    titulo: 'Nuevo informe técnico',
    camposPorGrupo: CAMPOS_POR_GRUPO,
    datos: datosIniciales(req.session),
    errores: [],
    claudeConfigurado: config.claude.configurado,
  });
}

/** POST /informe  — primer envío del formulario */
async function crearInforme(req, res, next) {
  const informe = new InformeTecnico(req.body);
  const { valido, errores } = informe.validar();

  req.session.datos = informe.toObject();

  if (!valido) {
    return res.status(422).render('index', {
      titulo: 'Nuevo informe técnico',
      camposPorGrupo: CAMPOS_POR_GRUPO,
      datos: informe.toObject(),
      errores,
      claudeConfigurado: config.claude.configurado,
    });
  }

  const conversacion = [
    { role: 'user', content: informe.construirMensajeUsuario() },
  ];

  try {
    const { texto } = await claudeService.generarRespuesta(conversacion);
    conversacion.push({ role: 'assistant', content: texto });
    req.session.conversacion = conversacion;
    return renderResultado(req, res, texto);
  } catch (err) {
    return next(err);
  }
}

/** POST /informe/responder — el asesor responde las preguntas del modelo */
async function responderConsulta(req, res, next) {
  const conversacion = req.session.conversacion;
  if (!conversacion || !conversacion.length) {
    return res.redirect('/');
  }

  const respuesta = (req.body.respuesta || '').trim();
  if (!respuesta) {
    return renderResultado(req, res, conversacion[conversacion.length - 1].content, {
      aviso: 'Escriba una respuesta antes de continuar.',
    });
  }

  conversacion.push({
    role: 'user',
    content:
      'Información adicional suministrada por el asesor en respuesta a sus preguntas:\n\n' +
      respuesta +
      '\n\nContinúe con el flujo de trabajo y responda según el protocolo (ESTADO: CONSULTA o ESTADO: INFORME).',
  });

  try {
    const { texto } = await claudeService.generarRespuesta(conversacion);
    conversacion.push({ role: 'assistant', content: texto });
    req.session.conversacion = conversacion;
    return renderResultado(req, res, texto);
  } catch (err) {
    return next(err);
  }
}

/** POST /informe/nuevo — limpiar y volver a empezar */
function nuevoInforme(req, res) {
  delete req.session.conversacion;
  delete req.session.datos;
  res.redirect('/');
}

/** POST /informe/word — descarga del informe en .docx */
async function descargarWord(req, res, next) {
  const conversacion = req.session.conversacion || [];
  const ultimo = [...conversacion].reverse().find((m) => m.role === 'assistant');

  if (!ultimo) return res.redirect('/');

  const interpretado = claudeService.interpretarRespuesta(ultimo.content);
  if (interpretado.tipo !== 'informe') {
    return res.redirect('/informe/resultado');
  }

  try {
    const datos = req.session.datos || {};
    const buffer = await generarDocx(interpretado.contenido, { empresa: datos.empresa });

    const placa = (datos.placa || 'vehiculo').replace(/[^\w-]+/g, '');
    const fecha = (datos.fechaInforme || new Date().toISOString().slice(0, 10)).replace(/[^\d-]/g, '');
    const nombre = `Informe-Tecnico_${placa}_${fecha}.docx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
    return res.send(buffer);
  } catch (err) {
    return next(err);
  }
}

/** GET /informe/resultado — re-muestra el último resultado (por si se recarga) */
function mostrarResultado(req, res) {
  const conversacion = req.session.conversacion || [];
  const ultimo = [...conversacion].reverse().find((m) => m.role === 'assistant');
  if (!ultimo) return res.redirect('/');
  return renderResultado(req, res, ultimo.content);
}

/** Helper interno para renderizar la vista de resultado. */
function renderResultado(req, res, textoRespuesta, extra = {}) {
  const interpretado = claudeService.interpretarRespuesta(textoRespuesta);
  return res.render('resultado', {
    titulo: interpretado.tipo === 'informe' ? 'Informe técnico generado' : 'Información pendiente',
    tipo: interpretado.tipo,
    contenido: interpretado.contenido,
    datos: req.session.datos || {},
    aviso: extra.aviso || null,
  });
}

module.exports = {
  mostrarFormulario,
  crearInforme,
  responderConsulta,
  nuevoInforme,
  descargarWord,
  mostrarResultado,
};
