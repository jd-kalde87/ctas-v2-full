// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Leer el token del header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'No hay token, permiso no válido' });
    }

    // El token viene en formato "Bearer <token>", nos quedamos solo con el token.
    const token = authHeader.split(' ')[1];

    // 2. Verificar el token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Guardamos el usuario del token en el objeto de la petición para usarlo después
        req.usuario = decoded;
        next(); // Si el token es válido, continuamos a la siguiente función (el controlador)
    } catch (error) {
        res.status(401).json({ message: 'Token no válido' });
    }
};