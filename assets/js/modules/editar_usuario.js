// assets/js/modules/editar_usuario.js

window.inicializarVista = function(cedulaUsuario) {
    const mainContent = $('#main-content');
    const form = $('#form-editar-usuario');

    function cargarDatosUsuario() {
        const url = `${APP_CONFIG.backendUrl}usuario/obtener_por_cedulas`;

        fetch(url, { 
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${APP_CONFIG.token}` 
            },
            body: JSON.stringify({ cedulas: [Number(cedulaUsuario)] })
        })
        .then(response => {
            if (!response.ok) throw new Error(`Error del servidor: ${response.statusText}`);
            return response.json();
        })
        .then(data => {
            const usuario = data[0];
            
            // ****** INICIO DE LA MODIFICACIÓN ******
            // Esta línea imprimirá el objeto de usuario en la consola para que podamos verlo.
            console.log("Datos del usuario recibidos del backend:", usuario);
            // ****** FIN DE LA MODIFICACIÓN ******

            if (usuario && usuario.cedula) {
                $('#nombre-editar').val(usuario.nombre);
                $('#apellidos-editar').val(usuario.apellidos);
                $('#email-editar').val(usuario.email);
                $('#telefono-editar').val(usuario.telefono);
                $('#empresa-editar').val(usuario.empresa);
                $('#cargo-editar').val(usuario.cargo);
                $('#estado-editar').val(usuario.estado);
                $('#admin-editar').prop('checked', usuario.admin);
            } else {
                throw new Error('No se encontraron datos para este usuario.');
            }
        })
        .catch(error => {
            console.error('Error al cargar datos del usuario:', error);
            window.mostrarNotificacion(error.message, 'danger');
        });
    }

    // ... (El resto del archivo no necesita cambios) ...
    mainContent.on('click', '#btn-actualizar-usuario', function() { /* ... */ });
    cargarDatosUsuario();
    mainContent.on('remove', function() { /* ... */ });
};