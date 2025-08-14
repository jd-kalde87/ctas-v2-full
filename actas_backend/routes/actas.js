// routes/actas.js

const express = require('express');
const router = express.Router();
const actaController = require('../controllers/actaController');
const authMiddleware = require('../middleware/authMiddleware');

// Ruta para obtener TODAS las actas
router.get('/obtener', authMiddleware, actaController.obtenerActas);

// ****** INICIO DE LA NUEVA RUTA ******
// Ruta para obtener UNA SOLA acta por su código
router.get('/obtener/:codigo', authMiddleware, actaController.obtenerActaPorCodigo);
// ****** FIN DE LA NUEVA RUTA ******

// Ruta para crear una nueva acta
router.post('/crear', authMiddleware, actaController.crearActa);

// Ruta para actualizar un acta
router.patch('/actualizar/:codigo', authMiddleware, actaController.actualizarActa);

// Ruta para eliminar un acta
router.delete('/eliminar/:codigo', authMiddleware, actaController.eliminarActa);

// Ruta para obtener todos los datos de un acta para el PDF
router.get('/obtener-pdf-data/:codigo', authMiddleware, actaController.obtenerPdfData);


module.exports = router;