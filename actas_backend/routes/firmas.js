// routes/firmas.js
const express = require('express');
const router = express.Router();
const firmaController = require('../controllers/firmaController');
const firmaAuthMiddleware = require('../middleware/firmaAuthMiddleware');

// Protegemos esta ruta con nuestro nuevo middleware de firmas
router.post('/crear', firmaAuthMiddleware, firmaController.crearFirma);

module.exports = router;