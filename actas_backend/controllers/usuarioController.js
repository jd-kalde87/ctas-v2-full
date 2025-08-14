// controllers/usuarioController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Lógica para el Login (CON DEPURACIÓN)
exports.loginUsuario = async (req, res) => {
    console.log("\n--- INICIO DE PETICIÓN DE LOGIN ---");
    
    // Paso 1: Ver qué datos estamos recibiendo del frontend
    const { cedula, contrasena } = req.body;
    console.log(`[Paso 1] Datos recibidos: Cédula=${cedula}, Contraseña=${contrasena ? 'Sí' : 'No'}`);

    if (!cedula || !contrasena) {
        console.log("[ERROR] Faltan cédula o contraseña en la petición.");
        return res.status(400).json({ message: 'Cédula y contraseña son requeridas.' });
    }

    try {
        // Paso 2: Buscar al usuario en la base de datos
        console.log(`[Paso 2] Buscando usuario con cédula: ${cedula}`);
        const [rows] = await db.query('SELECT * FROM usuario WHERE cedula = ?', [cedula]);
        
        if (rows.length === 0) {
            console.log("[ERROR] Usuario no encontrado en la base de datos.");
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const usuario = rows[0];
        console.log("[Paso 2] Usuario encontrado:", usuario.nombre, usuario.apellidos);
        console.log("[Paso 3] Contraseña recibida (texto plano):", contrasena);
        console.log("[Paso 3] Contraseña en la BD (encriptada):", usuario.contrasena);

        // Paso 3: Comparar la contraseña
        console.log("[Paso 3] Comparando contraseñas con bcrypt...");
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!contrasenaValida) {
            console.log("[ERROR] La comparación de bcrypt falló. Las contraseñas NO coinciden.");
            return res.status(401).json({ message: 'Credenciales incorrectas.' });
        }
        
        console.log("[Paso 3] ¡Éxito! La comparación de bcrypt fue correcta.");

        // Paso 4: Verificar si es admin
        console.log(`[Paso 4] Verificando si es admin. Rol: ${usuario.admin}`);
        if (!usuario.admin) {
            console.log("[ERROR] El usuario no es administrador.");
            return res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
        }
        console.log("[Paso 4] El usuario es administrador.");

        // Paso 5: Crear el Token
        const payload = { cedula: usuario.cedula, nombre: usuario.nombre };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log("[Paso 5] Token generado exitosamente.");
        console.log("--- FIN DE PETICIÓN DE LOGIN (ÉXITO) ---");

        res.json({ token, nombre: usuario.nombre, admin: usuario.admin });

    } catch (error) {
        console.error("--- ERROR INESPERADO EN EL LOGIN ---", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// Lógica para validar un asistente y generar un token de firma temporal
exports.obtenerUsuarioParaFirma = async (req, res) => {
    try {
        const { cedula, acta_codigo } = req.body;

        if (!cedula || !acta_codigo) {
            return res.status(400).json({ message: 'La cédula y el código del acta son requeridos.' });
        }

        // 1. Buscar al usuario por su cédula
        const [rows] = await db.query('SELECT * FROM usuario WHERE cedula = ?', [cedula]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        const usuario = rows[0];

        // 2. Crear un payload especial para el token de firma
        const payload = {
            cedula: usuario.cedula,
            nombre: `${usuario.nombre} ${usuario.apellidos}`,
            // Incluimos el acta que está autorizado a firmar para mayor seguridad
            acta_codigo: acta_codigo 
        };

        // 3. Generar un token de corta duración (ej: 15 minutos)
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '15m' 
        });

        // 4. Enviar la respuesta con el token
        // El frontend espera recibir un array con el token, como en el backend antiguo.
        res.json([token]);

    } catch (error) {
        console.error("Error al generar token de firma:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};
exports.obtenerUsuarios = async (req, res) => { /* ... */ };
exports.crearUsuario = async (req, res) => { /* ... */ };
exports.actualizarUsuario = async (req, res) => { /* ... */ };
exports.eliminarUsuario = async (req, res) => { /* ... */ };
exports.hashPassword = async (req, res) => { /* ... */ };