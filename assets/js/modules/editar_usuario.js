// assets/js/modules/editar_usuario.js

window.inicializarVista = function(cedulaUsuario) {
    const form = $('#form-editar-usuario');
    // Asumiré que tienes un spinner. Si no, esta línea no hará nada.
    const spinner = $('#spinner-editar-usuario'); 
    
    spinner.show();
    form.hide();

    // 1. CONSTRUIMOS LA URL CORRECTA (GET con la cédula al final)
    const url = `${APP_CONFIG.backendUrl}usuario/obtener/${cedulaUsuario}`;

    // 2. HACEMOS LA PETICIÓN CORRECTA (GET, sin body)
    fetch(url, { 
        headers: { 'Authorization': `Bearer ${APP_CONFIG.token}` } 
    })
    .then(response => {
        if (!response.ok) throw new Error(`Error del servidor: ${response.statusText}`);
        return response.json();
    })
    .then(usuario => {
        // 3. POBLAMOS EL FORMULARIO CON LOS IDs DE TU HTML
        if (usuario && usuario.cedula) {
            // Se rellena el título y los campos del formulario
            $('h5.m-0 strong').text(usuario.cedula);
            $('#nombre-editar').val(usuario.nombre);
            $('#apellidos-editar').val(usuario.apellidos);
            $('#email-editar').val(usuario.email);
            $('#telefono-editar').val(usuario.telefono);
            $('#empresa-editar').val(usuario.empresa);
            $('#cargo-editar').val(usuario.cargo);
            $('#estado-editar').val(usuario.estado);
            $('#admin-editar').prop('checked', usuario.admin === 1); // El === 1 es importante
            
            spinner.hide();
            form.show();
        } else {
            throw new Error('No se encontraron datos para este usuario.');
        }
    })
    .catch(error => {
        console.error('Error al cargar datos del usuario:', error);
        window.mostrarNotificacion(error.message, 'danger');
        spinner.hide();
        // Muestra un error en el cuerpo de la tarjeta si falla la carga
        $('.card-body').html('<p class="text-danger">Error: No se pudieron cargar los datos del usuario.</p>');
    });

    // 4. LÓGICA PARA EL BOTÓN DE ACTUALIZAR
    $('#btn-actualizar-usuario').on('click', function() {
        const datosActualizados = {
            nombre: $('#nombre-editar').val(),
            apellidos: $('#apellidos-editar').val(),
            email: $('#email-editar').val(),
            telefono: $('#telefono-editar').val(),
            empresa: $('#empresa-editar').val(),
            cargo: $('#cargo-editar').val(),
            estado: $('#estado-editar').val(),
            admin: $('#admin-editar').is(':checked') ? 1 : 0
        };

        const updateUrl = `${APP_CONFIG.backendUrl}usuario/actualizar/${cedulaUsuario}`;
        fetch(updateUrl, {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${APP_CONFIG.token}` 
            },
            body: JSON.stringify(datosActualizados)
        })
        .then(response => {
            if (!response.ok) throw new Error('No se pudo actualizar el usuario.');
            return response.json();
        })
        .then(data => {
            window.mostrarNotificacion(data.message, 'success');
            window.cargarVista('lista_usuarios');
        })
        .catch(error => {
            window.mostrarNotificacion(error.message, 'danger');
        });
    });

    // Lógica para el botón Cancelar
    $('button[data-vista="lista_usuarios"]').on('click', function() {
        window.cargarVista('lista_usuarios');
    });
};