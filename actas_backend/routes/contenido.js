// routes/contenido.js

const express = require('express');
const router = express.Router();
const contenidoController = require('../controllers/contenidoController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/obtener/:acta_codigo', authMiddleware, contenidoController.obtenerContenidoPorActa);
router.post('/crear', authMiddleware, contenidoController.crearContenido);
router.patch('/actualizar/:id', authMiddleware, contenidoController.actualizarContenido);
router.delete('/eliminar/:id', authMiddleware, contenidoController.eliminarContenido);

module.exports = router;