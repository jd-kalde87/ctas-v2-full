// controllers/contenidoController.js

const db = require('../config/db');

// --- (La función obtenerContenidoPorActa no cambia) ---
exports.obtenerContenidoPorActa = async (req, res) => {
    try {
        const { acta_codigo } = req.params;
        const query = 'SELECT * FROM contenido_acta WHERE TRIM(acta_ID) = TRIM(?)';
        const [rows] = await db.query(query, [acta_codigo]);
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener el contenido del acta:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// ****** INICIO DE LA CORRECCIÓN ******
// Lógica para AÑADIR un nuevo registro de contenido
exports.crearContenido = async (req, res) => {
    try {
        const nuevoContenido = {
            // Se corrige req.body.acta por req.body.acta_ID para que coincida con lo que envía el frontend
            acta_ID: req.body.acta_ID, 
            temario_code: req.body.temario_code,
            intervenciones: req.body.intervenciones,
            compromisos: req.body.compromisos
        };
        
        await db.query('INSERT INTO contenido_acta SET ?', [nuevoContenido]);
        
        res.status(201).json({ message: 'Contenido añadido al acta exitosamente.' });

    } catch (error) {
        console.error("Error al crear contenido:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};
// ****** FIN DE LA CORRECCIÓN ******


// --- (Las funciones actualizarContenido y eliminarContenido no cambian) ---
exports.actualizarContenido = async (req, res) => {
    try {
        const { id } = req.params;
        const camposAActualizar = req.body;
        
        Object.keys(camposAActualizar).forEach(key => {
            if (camposAActualizar[key] === undefined || camposAActualizar[key] === null) {
                delete camposAActualizar[key];
            }
        });
        
        if (Object.keys(camposAActualizar).length === 0) {
            return res.status(400).json({ message: 'No hay campos para actualizar.' });
        }

        const [result] = await db.query('UPDATE contenido_acta SET ? WHERE id = ?', [camposAActualizar, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Registro de contenido no encontrado.' });
        }

        res.json({ message: 'Registro de contenido actualizado exitosamente.' });

    } catch (error) {
        console.error("Error al actualizar contenido:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.eliminarContenido = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM contenido_acta WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Registro de contenido no encontrado.' });
        }

        res.json({ message: 'Registro de contenido eliminado exitosamente.' });

    } catch (error) {
        console.error("Error al eliminar contenido:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};