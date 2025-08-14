// controllers/firmaController.js
const db = require('../config/db');

exports.crearFirma = async (req, res) => {
    // Obtenemos los datos del asistente desde el middleware
    const { cedula, acta_codigo } = req.asistente;
    // Obtenemos la imagen de la firma del cuerpo de la petición
    const { firma } = req.body;

    if (!firma) {
        return res.status(400).json({ message: 'No se proporcionó la firma.' });
    }

    // Usaremos una transacción para asegurar que ambas operaciones se completen con éxito
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insertar la nueva firma en la tabla 'firmas_user'
        await connection.query('INSERT INTO firmas_user SET ?', {
            usuario: cedula,
            acta: acta_codigo,
            firma: firma
        });

        // 2. Actualizar la lista de usuarios en la tabla 'acta'
        // Primero, obtenemos la lista actual de usuarios
        const [actas] = await connection.query('SELECT usuarios FROM acta WHERE codigo = ?', [acta_codigo]);
        let usuariosActuales = actas[0].usuarios ? actas[0].usuarios.split(',') : [];

        // Añadimos la nueva cédula solo si no está ya en la lista
        if (!usuariosActuales.includes(String(cedula))) {
            usuariosActuales.push(cedula);
            await connection.query('UPDATE acta SET usuarios = ? WHERE codigo = ?', [usuariosActuales.join(','), acta_codigo]);
        }

        // Si todo fue bien, confirmamos la transacción
        await connection.commit();
        res.status(201).json({ message: 'Firma registrada exitosamente.' });

    } catch (error) {
        // Si algo falla, revertimos todos los cambios
        await connection.rollback();
        console.error("Error al registrar la firma:", error);
        res.status(500).json({ message: 'Error en el servidor al registrar la firma.' });
    } finally {
        // Siempre liberamos la conexión al final
        connection.release();
    }
};