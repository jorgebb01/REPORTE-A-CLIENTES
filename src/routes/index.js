'use strict';

const express = require('express');
const ctrl = require('../controllers/informeController');

const router = express.Router();

router.get('/', ctrl.mostrarFormulario);
router.post('/informe', ctrl.crearInforme);
router.get('/informe/resultado', ctrl.mostrarResultado);
router.post('/informe/responder', ctrl.responderConsulta);
router.post('/informe/word', ctrl.descargarWord);
router.post('/informe/nuevo', ctrl.nuevoInforme);

module.exports = router;
