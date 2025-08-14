// assets/js/modules/crear_usuario.js

window.inicializarVista = function() {
    const mainContent = $('#main-content');

    mainContent.on('click', '#btn-guardar-usuario', function() {
        // 1. Recolectar todos los datos del formulario
        const datosUsuario = {
            cedula: $('#cedula-crear').val(),
            nombre: $('#nombre-crear').val(),
            apellidos: $('#apellidos-crear').val(),
            email: $('#email-crear').val(),
            telefono: $('#telefono-crear').val(),
            empresa: $('#empresa-crear').val(),
            cargo: $('#cargo-crear').val(),
            contrasena: $('#contrasena-crear').val(),
            admin: $('#admin-crear').is(':checked'),
            estado: "activo" // Por defecto, los nuevos usuarios se crean como activos
        };

        // 2. Validar que los campos requeridos no estén vacíos
        if (!datosUsuario.cedula || !datosUsuario.nombre || !datosUsuario.apellidos || !datosUsuario.email) {
            window.mostrarNotificacion('Por favor, complete todos los campos requeridos.', 'warning');
            return;
        }

        // 3. Enviar los datos al endpoint de creación del backend
        const url = `${APP_CONFIG.backendUrl}usuario/crear`;

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${APP_CONFIG.token}`
            },
            body: JSON.stringify(datosUsuario)
        })
        .then(response => {
            if (response.status !== 201) { // 201 = Creado
                // Si el backend devuelve un error, lo intentamos mostrar
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Error al crear el usuario.');
                });
            }
            return response.json();
        })
        .then(() => {
            window.mostrarNotificacion('Usuario creado exitosamente.', 'success');
            // Redirigir de vuelta a la lista de usuarios para ver el nuevo registro
            window.cargarVista('lista_usuarios');
        })
        .catch(error => {
            console.error('Error:', error);
            window.mostrarNotificacion(error.message, 'danger');
        });
    });

    // Desvincular evento al salir de la vista para evitar que se ejecute múltiples veces
    mainContent.on('remove', function() {
        mainContent.off('click', '#btn-guardar-usuario');
    });
};