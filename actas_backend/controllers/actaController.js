// controllers/actaController.js

const db = require('../config/db');

// Lógica para obtener todas las actas
exports.obtenerActas = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM acta ORDER BY fecha DESC');
        res.json(rows);
    } catch (error) {
        console.error("Error al obtener las actas:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};
// Lógica para crear una nueva acta
exports.crearActa = async (req, res) => {
    // 1. Obtener los datos del cuerpo de la petición
    const {
        tipo_reunion,
        fecha,
        tema,
        lugar,
        temario, // Esto vendrá como un array
        usuarios, // Esto también vendrá como un array
        create_acta_user,
        horaInicio,
        horaFin,
        cantidad_asistentes,
        firma
    } = req.body;

    try {
        // 2. Generar un código único para el acta (ej: ACTA-MMDDYY-N)
        const date = new Date();
        const dateString = `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(date.getFullYear()).slice(-2)}`;
        
        let sequence = 1;
        let codigo;
        let existente;

        // Bucle para asegurar que el código no se repita
        do {
            codigo = `ACTA-${dateString}-${sequence}`;
            const [rows] = await db.query('SELECT codigo FROM acta WHERE codigo = ?', [codigo]);
            existente = rows.length > 0;
            if (existente) sequence++;
        } while (existente);
        
        // 3. Preparar los datos para la inserción
        const nuevaActa = {
            codigo,
            tipo_reunion,
            fecha,
            tema,
            lugar,
            // Convertimos los arrays de temario y usuarios a texto separado por comas
            temario: temario.join(','),
            usuarios: usuarios.join(','),
            create_acta_user,
            horaInicio,
            horaFin,
            cantidad_asistentes,
            firma,
            estado: 1 // 1 = Activo
        };

        // 4. Insertar la nueva acta en la base de datos
        await db.query('INSERT INTO acta SET ?', [nuevaActa]);

        // 5. Devolver el objeto del acta recién creada
        res.status(201).json(nuevaActa);

    } catch (error) {
        console.error("Error al crear el acta:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};
// Lógica para actualizar un acta existente (para editar o finalizar)
exports.actualizarActa = async (req, res) => {
    try {
        const { codigo } = req.params;
        const camposAActualizar = req.body;

        // Si el temario o los usuarios vienen como array, los convertimos a string
        if (camposAActualizar.temario && Array.isArray(camposAActualizar.temario)) {
            camposAActualizar.temario = camposAActualizar.temario.join(',');
        }
        if (camposAActualizar.usuarios && Array.isArray(camposAActualizar.usuarios)) {
            camposAActualizar.usuarios = camposAActualizar.usuarios.join(',');
        }

        const [result] = await db.query('UPDATE acta SET ? WHERE codigo = ?', [camposAActualizar, codigo]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Acta no encontrada.' });
        }

        res.json({ message: 'Acta actualizada exitosamente.' });

    } catch (error) {
        console.error("Error al actualizar el acta:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// Lógica para eliminar un acta
exports.eliminarActa = async (req, res) => {
    try {
        const { codigo } = req.params;

        // IMPORTANTE: Antes de eliminar el acta, debemos eliminar los registros relacionados
        // en otras tablas para evitar errores de clave foránea.
        await db.query('DELETE FROM contenido_acta WHERE acta_ID = ?', [codigo]);
        await db.query('DELETE FROM firmas_user WHERE acta = ?', [codigo]);
        
        // Ahora sí podemos eliminar el acta principal
        const [result] = await db.query('DELETE FROM acta WHERE codigo = ?', [codigo]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Acta no encontrada.' });
        }

        res.json({ message: 'Acta y todos sus datos relacionados han sido eliminados.' });

    } catch (error) {
        console.error("Error al eliminar el acta:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};
// Lógica para obtener UNA SOLA acta por su código
exports.obtenerActaPorCodigo = async (req, res) => {
    try {
        const { codigo } = req.params;
        const [rows] = await db.query('SELECT * FROM acta WHERE codigo = ?', [codigo]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Acta no encontrada.' });
        }

        res.json(rows[0]); // Devolvemos solo el primer resultado, que es el objeto del acta

    } catch (error) {
        console.error("Error al obtener el acta:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};
// Lógica para obtener todos los datos necesarios para un PDF
exports.obtenerPdfData = async (req, res) => {
    try {
        const { codigo } = req.params;

        // 1. Obtener los datos principales del acta
        const [actas] = await db.query('SELECT * FROM acta WHERE codigo = ?', [codigo]);
        if (actas.length === 0) {
            return res.status(404).json({ message: 'Acta no encontrada.' });
        }
        const acta = actas[0];

        // 2. Obtener el contenido del acta
        const [contenido] = await db.query('SELECT * FROM contenido_acta WHERE acta_ID = ?', [codigo]);

        // 3. Obtener los firmantes y sus datos (usando un JOIN)
        const queryFirmas = `
            SELECT 
                u.nombre, 
                u.apellidos,
                u.empresa,
                u.cargo,
                f.firma 
            FROM firmas_user f
            JOIN usuario u ON f.usuario = u.cedula
            WHERE f.acta = ?
        `;
        const [firmas] = await db.query(queryFirmas, [codigo]);

        // 4. Construir y enviar la respuesta completa
        res.json({
            acta,
            contenido,
            firmas
        });

    } catch (error) {
        console.error("Error al obtener los datos para el PDF:", error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};