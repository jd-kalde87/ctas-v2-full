// controllers/contenidoController.js

const db = require('../config/db');

// --- FUNCIÓN DE AYUDA (HELPER) ---
// Esta función reutilizable comprueba si un acta está finalizada.
async function isActaFinalizada(codigoActa) {
    const [actas] = await db.query('SELECT firma FROM acta WHERE codigo = ?', [codigoActa]);
    if (actas.length === 0) {
        throw new Error('Acta no encontrada.');
    }
    return actas[0].firma.toLowerCase() === 'finalizado';
}


// --- Lógica para OBTENER el contenido (No necesita cambios) ---
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

// --- Lógica para AÑADIR contenido (CON VERIFICACIÓN DE BLOQUEO) ---
exports.crearContenido = async (req, res) => {
    try {
        const nuevoContenido = {
            acta_ID: req.body.acta_ID, 
            temario_code: req.body.temario_code,
            intervenciones: req.body.intervenciones,
            compromisos: req.body.compromisos
        };
        
        // --- INICIO DE LA VERIFICACIÓN DE BLOQUEO ---
        if (await isActaFinalizada(nuevoContenido.acta_ID)) {
            return res.status(403).json({ 
                message: 'Acción prohibida: Esta acta está finalizada y su contenido no puede ser modificado.' 
            });
        }
        // --- FIN DE LA VERIFICACIÓN DE BLOQUEO ---

        await db.query('INSERT INTO contenido_acta SET ?', [nuevoContenido]);
        
        res.status(201).json({ message: 'Contenido añadido al acta exitosamente.' });

    } catch (error) {
        console.error("Error al crear contenido:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// --- Lógica para ACTUALIZAR contenido (CON VERIFICACIÓN DE BLOQUEO) ---
exports.actualizarContenido = async (req, res) => {
    try {
        const { id } = req.params; // ID de la fila de contenido
        const camposAActualizar = req.body;
        
        // --- INICIO DE LA VERIFICACIÓN DE BLOQUEO ---
        // 1. Primero, necesitamos saber a qué acta pertenece este contenido.
        const [contenidoRows] = await db.query('SELECT acta_ID FROM contenido_acta WHERE id = ?', [id]);
        if (contenidoRows.length === 0) {
            return res.status(404).json({ message: 'Registro de contenido no encontrado.' });
        }
        const actaCodigo = contenidoRows[0].acta_ID;
        
        // 2. Ahora sí, verificamos si esa acta está finalizada.
        if (await isActaFinalizada(actaCodigo)) {
            return res.status(403).json({ 
                message: 'Acción prohibida: Esta acta está finalizada y su contenido no puede ser modificado.' 
            });
        }
        // --- FIN DE LA VERIFICACIÓN DE BLOQUEO ---
        
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

// --- Lógica para ELIMINAR contenido (CON VERIFICACIÓN DE BLOQUEO) ---
exports.eliminarContenido = async (req, res) => {
    try {
        const { id } = req.params; // ID de la fila de contenido

        // --- INICIO DE LA VERIFICACIÓN DE BLOQUEO ---
        // (Misma lógica que en la función de actualizar)
        const [contenidoRows] = await db.query('SELECT acta_ID FROM contenido_acta WHERE id = ?', [id]);
        if (contenidoRows.length === 0) {
            return res.status(404).json({ message: 'Registro de contenido no encontrado.' });
        }
        const actaCodigo = contenidoRows[0].acta_ID;

        if (await isActaFinalizada(actaCodigo)) {
            return res.status(403).json({ 
                message: 'Acción prohibida: Esta acta está finalizada y su contenido no puede ser eliminado.' 
            });
        }
        // --- FIN DE LA VERIFICACIÓN DE BLOQUEO ---
        
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