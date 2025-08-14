// assets/js/modules/lista_actas.js

window.inicializarVista = function() {
    
    const spinner = $('#spinner-actas');
    const tablaElement = $('#tabla-actas');

    tablaElement.hide();
    spinner.show();

    const tabla = tablaElement.DataTable({
        "responsive": true,
        "lengthChange": false,
        "autoWidth": false,
        "language": { /* ... objeto de traducción ... */ },
        "ajax": {
            "url": `${APP_CONFIG.backendUrl}actas/obtener`,
            "headers": { "Authorization": `Bearer ${APP_CONFIG.token}` },
            "dataSrc": "", 
            "error": function(xhr) { /* ... manejo de errores ... */ }
        },
        "columns": [
            { "data": "codigo" },
            { "data": "tema" },
            { "data": "lugar" },
            { "data": "fecha" },
            { 
                "data": "firma",
                "render": function(data) {
                    const estado = String(data).toLowerCase();
                    let badgeClass = 'badge-info';
                    if (estado === 'finalizado') badgeClass = 'badge-success';
                    else if (estado === 'borrador') badgeClass = 'badge-secondary';
                    return `<span class="badge ${badgeClass}">${data}</span>`;
                }
            },
            {
                "data": null,
                "defaultContent": `
                    <button class="btn btn-xs btn-primary btn-editar-encabezado" title="Editar Encabezado"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn btn-xs btn-success btn-gestionar-contenido" title="Gestionar Contenido"><i class="fas fa-stream"></i></button>
                    <button class="btn btn-xs btn-warning btn-generar-qr" title="Compartir (QR)"><i class="fas fa-qrcode"></i></button>
                    <button class="btn btn-xs btn-info btn-finalizar-acta" title="Finalizar Acta"><i class="fas fa-check-circle"></i></button>
                    <button class="btn btn-xs btn-danger btn-generar-pdf" title="Generar PDF"><i class="fas fa-file-pdf"></i></button>
                `,
                "orderable": false
            }
        ],
        "order": [[ 3, "desc" ]],
        "initComplete": function() {
            spinner.hide();
            tablaElement.show();
        }
    });

    // ****** INICIO DE LA MODIFICACIÓN ******
    // Ahora este módulo maneja todos los clics de sus botones.
    $('#tabla-actas tbody').on('click', 'button', function() {
        const data = tabla.row($(this).parents('tr')).data();
        if (!data) return; // Evitar errores si no hay datos

        // 1. Lógica para los botones de NAVEGACIÓN
        if ($(this).hasClass('btn-editar-encabezado')) {
            window.cargarVista('editar_acta', data.codigo);
        } 
        else if ($(this).hasClass('btn-gestionar-contenido')) {
            window.cargarVista('gestionar_contenido', data.codigo);
        } 
        else if ($(this).hasClass('btn-generar-qr')) {
            window.cargarVista('generar_qr', data.codigo);
        }
        else if ($(this).hasClass('btn-generar-pdf')) {
            window.cargarVista('generar_pdf', data.codigo);
        }
        // 2. Lógica para el botón de ACCIÓN (Finalizar)
        else if ($(this).hasClass('btn-finalizar-acta')) {
            if (confirm(`¿Estás seguro de que deseas finalizar el acta ${data.codigo}?`)) {
                const url = `${APP_CONFIG.backendUrl}actas/actualizar/${data.codigo}`;
                fetch(url, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${APP_CONFIG.token}`
                    },
                    body: JSON.stringify({ firma: 'Finalizado' }) 
                })
                .then(response => {
                    if (!response.ok) throw new Error(`Error: ${response.statusText}`);
                    return response.json();
                })
                .then(() => {
                    window.mostrarNotificacion('Acta finalizada exitosamente.', 'success');
                    tabla.ajax.reload(); // Recargar la tabla para ver el cambio
                })
                .catch(error => {
                    window.mostrarNotificacion(`No se pudo finalizar el acta. ${error.message}`, 'danger');
                });
            }
        }
    });
    // ****** FIN DE LA MODIFICACIÓN ******
};