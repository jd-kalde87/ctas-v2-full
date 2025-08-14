// middleware/firmaAuthMiddleware.js
const jwt = require('jsonwebtoken');

// Este middleware es similar al otro, pero está diseñado para los tokens de firma
module.exports = function(req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'No hay token, permiso no válido' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token mal formado.' });
    }

    try {
        // Verificamos el token y extraemos los datos del asistente
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.asistente = decoded; // Guardamos los datos decodificados en req.asistente
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token no válido o expirado.' });
    }
};