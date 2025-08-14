// assets/js/modules/lista_usuarios.js

window.inicializarVista = function() {
    
    // ****** INICIO DE LAS MODIFICACIONES ******
    const spinner = $('#spinner-usuarios');
    const tablaElement = $('#tabla-usuarios');

    // Ocultamos la tabla al inicio para que solo se vea el spinner
    tablaElement.hide();
    spinner.show();

    const tabla = tablaElement.DataTable({
        "responsive": true,
        "lengthChange": false,
        "autoWidth": false,
        "language": { /* ... objeto de traducción ... */ },
        "ajax": {
            "url": `${APP_CONFIG.backendUrl}usuario/obtener`,
            "type": "GET",
            "headers": { "Authorization": `Bearer ${APP_CONFIG.token}` },
            "dataSrc": ""
        },
        "columns": [
            { "data": "cedula" },
            { "data": null, "render": function(data, type, row) { return `${row.nombre || ''} ${row.apellidos || ''}`; }},
            { "data": "email" },
            { "data": "empresa" },
            { "data": "cargo" },
            { "data": "admin", "render": function(data) { return data ? '<span class="badge badge-success">Admin</span>' : '<span class="badge badge-secondary">Asistente</span>'; }},
            { "data": "estado", "render": function(data) { const estado = String(data).toLowerCase(); return estado === 'activo' ? `<span class="badge badge-primary">${data}</span>` : `<span class="badge badge-danger">${data}</span>`; }},
            {
                "data": null,
                "defaultContent": `
                    <button class="btn btn-xs btn-primary btn-editar-usuario" title="Editar Usuario"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn btn-xs btn-danger btn-eliminar-usuario" title="Eliminar Usuario"><i class="fas fa-trash"></i></button>
                `,
                "orderable": false
            }
        ],
        // Esta función se ejecuta cuando DataTables ha terminado de cargar y dibujar la tabla
        "initComplete": function(settings, json) {
            // Ocultamos el spinner y mostramos la tabla
            spinner.hide();
            tablaElement.show();
        },
        "error": function (xhr, error, thrown) {
            spinner.html('<p class="text-danger">No se pudieron cargar los datos.</p>');
            console.error("Error al cargar los usuarios: ", error, thrown);
            if (xhr.status === 401) {
                window.mostrarNotificacion('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'danger');
            }
        }
    });
    // ****** FIN DE LAS MODIFICACIONES ******

    // El resto de la lógica para los botones no cambia
    $('#tabla-usuarios tbody').on('click', '.btn-editar-usuario', function() {
        const data = tabla.row($(this).parents('tr')).data();
        window.cargarVista('editar_usuario', data.cedula);
    });

    $('#tabla-usuarios tbody').on('click', '.btn-eliminar-usuario', function() {
        const data = tabla.row($(this).parents('tr')).data();
        if (confirm(`¿Estás seguro de que deseas eliminar al usuario ${data.nombre}?`)) {
            const url = `${APP_CONFIG.backendUrl}usuario/eliminar/${data.cedula}`;
            fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${APP_CONFIG.token}` }
            })
            .then(response => {
                if (!response.ok) throw new Error(`Error del servidor: ${response.statusText}`);
                return response.json();
            })
            .then(() => {
                window.mostrarNotificacion('Usuario eliminado exitosamente.', 'success');
                tabla.ajax.reload();
            })
            .catch(error => {
                window.mostrarNotificacion(`No se pudo eliminar el usuario. ${error.message}`, 'danger');
            });
        }
    });
};