// assets/js/modules/gestionar_contenido.js

window.inicializarVista = function(actaCodigo) {
    
    const mainContent = $('#main-content');
    const form = $('#form-contenido-acta');

    // --- FUNCIÓN PARA CARGAR EL CONTENIDO EXISTENTE ---
    function cargarContenidoExistente() {
        const contenidoContainer = $('#contenido-existente-container');
        const url = `${APP_CONFIG.backendUrl}contenido-actas/obtener/${actaCodigo}`;
        
        fetch(url, { 
            headers: { 'Authorization': `Bearer ${APP_CONFIG.token}` },
            cache: 'no-cache'
        })
        .then(response => response.json())
        .then(data => {
            contenidoContainer.html('');
            if (data && data.length > 0) {
                data.forEach(item => {
                    let compromisosHtml = '<p class="text-muted small">No hay compromisos.</p>';
                    if (item.compromisos && item.compromisos.trim() !== '') {
                        compromisosHtml = '<table class="table table-sm table-bordered" style="font-size: 0.9em;"><thead><tr><th>Compromiso</th><th>Responsable</th><th>Fecha</th></tr></thead><tbody>';
                        const lineas = item.compromisos.trim().split(/\n/);
                        lineas.forEach(linea => {
                            const match = linea.match(/(.*)\[Responsable:\s(.*)\s\|\sFecha:\s(.*)\]/);
                            if (match) {
                                compromisosHtml += `<tr><td>${match[1].replace(/^\d+\.\s/, '').trim()}</td><td>${match[2].trim()}</td><td>${match[3].trim()}</td></tr>`;
                            }
                        });
                        compromisosHtml += '</tbody></table>';
                    }

                    const contenidoHtml = `
                        <div class="callout callout-info" data-item-id="${item.id}">
                            <div class="float-right">
                                <button class="btn btn-xs btn-primary btn-editar-contenido" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                                <button class="btn btn-xs btn-danger btn-eliminar-contenido" title="Eliminar"><i class="fas fa-trash"></i></button>
                            </div>
                            <h5>${item.temario_code}</h5>
                            <strong>Intervenciones:</strong>
                            <p>${item.intervenciones || 'No registradas.'}</p>
                            <strong>Compromisos:</strong>
                            ${compromisosHtml} 
                        </div>`;
                    const elemento = $(contenidoHtml);
                    elemento.data('itemData', item);
                    contenidoContainer.append(elemento);
                });
            } else {
                contenidoContainer.html('<p class="text-muted">Aún no se ha añadido contenido a esta acta.</p>');
            }
        });
    }

    // --- FUNCIÓN PARA CARGAR EL TEMARIO EN EL DROPDOWN ---
    function cargarTemario() {
         fetch(`${APP_CONFIG.backendUrl}actas/obtener/${actaCodigo}`, { headers: { 'Authorization': `Bearer ${APP_CONFIG.token}` }})
        .then(response => response.json())
        .then(data => {
            const temarioSelect = $('#temario-select');
            temarioSelect.html('<option value="" selected disabled>Seleccione un punto...</option>');
            if (data && data.temario) {
                const temarioItems = Array.isArray(data.temario) ? data.temario : data.temario.split(',');
                temarioItems.forEach(item => {
                    temarioSelect.append(`<option value="${item.trim()}">${item.trim()}</option>`);
                });
            }
        });
    }

    // ===================================================================
    //  MANEJO DE EVENTOS
    // ===================================================================

    // --- Eventos para el formulario dinámico de compromisos ---
    mainContent.on('click', '#btn-agregar-compromiso', function() {
        const nuevoCompromisoHtml = `
            <div class="compromiso-item border rounded p-2 mb-2">
                <div class="form-group"><textarea class="form-control compromiso-descripcion" rows="2" placeholder="Descripción del compromiso..." required></textarea></div>
                <div class="row">
                    <div class="col-md-6"><input type="text" class="form-control compromiso-responsable" placeholder="Responsable"></div>
                    <div class="col-md-6"><input type="date" class="form-control compromiso-fecha"></div>
                </div>
                <div class="row mt-1">
                    <div class="col-md-6"><div class="form-check"><input class="form-check-input compromiso-sin-responsable" type="checkbox"><label class="form-check-label small">Sin Responsable</label></div></div>
                    <div class="col-md-6"><div class="form-check"><input class="form-check-input compromiso-sin-fecha" type="checkbox"><label class="form-check-label small">Sin Fecha</label></div></div>
                </div>
                <button type="button" class="btn btn-xs btn-danger mt-2 btn-remover-compromiso">Eliminar</button>
            </div>`;
        $('#contenedor-compromisos').append(nuevoCompromisoHtml);
    });
    mainContent.on('click', '.btn-remover-compromiso', function() { $(this).closest('.compromiso-item').remove(); });
    mainContent.on('change', '.compromiso-sin-responsable', function() { $(this).closest('.compromiso-item').find('.compromiso-responsable').prop('disabled', this.checked).val(''); });
    mainContent.on('change', '.compromiso-sin-fecha', function() { $(this).closest('.compromiso-item').find('.compromiso-fecha').prop('disabled', this.checked).val(''); });

    // --- Evento para el botón principal de Guardar / Actualizar ---
    mainContent.on('click', '#btn-guardar-contenido', function() {
        const editingId = $(this).data('editing-id');
        let url = `${APP_CONFIG.backendUrl}contenido-actas/crear`;
        let method = 'POST';
        if (editingId) {
            url = `${APP_CONFIG.backendUrl}contenido-actas/actualizar/${editingId}`;
            method = 'PATCH';
        }
        
        let compromisosTexto = '';
        $('#contenedor-compromisos .compromiso-item').each(function(index) {
            const item = $(this);
            const descripcion = item.find('.compromiso-descripcion').val();
            if (descripcion) {
                const responsable = item.find('.compromiso-sin-responsable').is(':checked') ? 'N/A' : item.find('.compromiso-responsable').val() || 'N/A';
                const fecha = item.find('.compromiso-sin-fecha').is(':checked') ? 'N/A' : item.find('.compromiso-fecha').val() || 'N/A';
                compromisosTexto += `${index + 1}. ${descripcion} [Responsable: ${responsable} | Fecha: ${fecha}]\n`;
            }
        });
        
        // ****** INICIO DE LA CORRECCIÓN ******
        const dataToSend = {
            acta_ID: actaCodigo, // <--- Este era el error. Se debe llamar acta_ID
            temario_code: $('#temario-select').val(),
            intervenciones: $('#intervenciones').val(),
            compromisos: compromisosTexto.trim()
        };

        // Si estamos actualizando, no necesitamos enviar el acta_ID, ya que no cambia.
        if (editingId) {
            delete dataToSend.acta_ID;
        }
        // ****** FIN DE LA CORRECCIÓN ******

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${APP_CONFIG.token}`},
            body: JSON.stringify(dataToSend)
        }).then(response => {
            if (!response.ok) throw new Error(editingId ? 'Error al actualizar.' : 'Error al guardar.');
            return response.json();
        }).then(() => {
            window.mostrarNotificacion(editingId ? 'Contenido actualizado.' : 'Contenido añadido.', 'success');
            form[0].reset();
            $('#contenedor-compromisos').html('');
            $('#btn-guardar-contenido').html('<i class="fas fa-plus"></i> Añadir al Acta').removeData('editing-id');
            cargarContenidoExistente();
        }).catch(error => {
            window.mostrarNotificacion(error.message, 'danger');
        });
    });

    // --- Evento para el botón de Eliminar un registro ---
    mainContent.on('click', '.btn-eliminar-contenido', function() {
        if (confirm('¿Estás seguro de que deseas eliminar este registro?')) {
            const itemId = $(this).closest('.callout').data('item-id');
            const url = `${APP_CONFIG.backendUrl}contenido-actas/eliminar/${itemId}`;
            fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${APP_CONFIG.token}` }
            }).then(response => {
                if(response.ok) {
                    window.mostrarNotificacion('Registro eliminado.', 'success');
                    cargarContenidoExistente();
                } else {
                    window.mostrarNotificacion('Error al eliminar.', 'danger');
                }
            });
        }
    });
    
    // --- Evento para el botón de Editar (poblar el formulario) ---
    mainContent.on('click', '.btn-editar-contenido', function() {
        const itemData = $(this).closest('.callout').data('itemData');
        $('#temario-select').val(itemData.temario_code);
        $('#intervenciones').val(itemData.intervenciones);
        
        const contenedorCompromisos = $('#contenedor-compromisos');
        contenedorCompromisos.html('');
        if (itemData.compromisos && itemData.compromisos.trim() !== '') {
            const lineas = itemData.compromisos.trim().split(/\n/);
            lineas.forEach(linea => {
                const match = linea.match(/(.*)\[Responsable:\s(.*)\s\|\sFecha:\s(.*)\]/);
                if (match) {
                    $('#btn-agregar-compromiso').click();
                    const nuevoItem = contenedorCompromisos.find('.compromiso-item:last');
                    const descripcion = match[1].replace(/^\d+\.\s/, '').trim();
                    const responsable = match[2].trim();
                    const fecha = match[3].trim();

                    nuevoItem.find('.compromiso-descripcion').val(descripcion);
                    if (responsable !== 'N/A') nuevoItem.find('.compromiso-responsable').val(responsable);
                    else nuevoItem.find('.compromiso-sin-responsable').prop('checked', true).trigger('change');
                    
                    if (fecha !== 'N/A') nuevoItem.find('.compromiso-fecha').val(fecha);
                    else nuevoItem.find('.compromiso-sin-fecha').prop('checked', true).trigger('change');
                }
            });
        }

        $('#btn-guardar-contenido').html('<i class="fas fa-sync-alt"></i> Actualizar Contenido').data('editing-id', itemData.id);
        window.mostrarNotificacion('Modo de edición activado.', 'info');
    });

    // --- INICIALIZACIÓN Y LIMPIEZA ---
    cargarTemario();
    cargarContenidoExistente();

    mainContent.on('remove', function() {
        mainContent.off('click', '#btn-guardar-contenido');
        mainContent.off('click', '.btn-eliminar-contenido');
        mainContent.off('click', '.btn-editar-contenido');
        mainContent.off('click', '#btn-agregar-compromiso');
        mainContent.off('click', '.btn-remover-compromiso');
        mainContent.off('change', '.compromiso-sin-responsable');
        mainContent.off('change', '.compromiso-sin-fecha');
    });
};