// assets/js/modules/lista_actas.js

// Función de ayuda para convertir una imagen a formato Base64
function getBase64Image(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = reject;
        img.src = url;
    });
}

window.inicializarVista = function() {
    
    const spinner = $('#spinner-actas');
    const tablaElement = $('#tabla-actas');

    tablaElement.hide();
    spinner.show();

    const tabla = tablaElement.DataTable({
        "responsive": true,
        "lengthChange": false,
        "autoWidth": false,
        "language": {
            "sProcessing":     "Procesando...",
            "sLengthMenu":     "Mostrar _MENU_ registros",
            "sZeroRecords":    "No se encontraron resultados",
            "sEmptyTable":     "Ningún dato disponible en esta tabla",
            "sInfo":           "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
            "sInfoEmpty":      "Mostrando registros del 0 al 0 de un total de 0 registros",
            "sInfoFiltered":   "(filtrado de un total de _MAX_ registros)",
            "sInfoPostFix":    "",
            "sSearch":         "Buscar:",
            "sUrl":            "",
            "sInfoThousands":  ",",
            "sLoadingRecords": "Cargando...",
            "oPaginate": { "sFirst": "Primero", "sLast": "Último", "sNext": "Siguiente", "sPrevious": "Anterior" },
            "oAria": { "sSortAscending":  ": Activar para ordenar la columna de manera ascendente", "sSortDescending": ": Activar para ordenar la columna de manera descendente" }
        },
        "ajax": {
            "url": `${APP_CONFIG.backendUrl}actas/obtener`,
            "headers": { "Authorization": `Bearer ${APP_CONFIG.token}` },
            "dataSrc": "", 
            "error": function(xhr) {
                spinner.hide();
                console.error("Error al cargar las actas:", xhr.responseText);
                $('#tabla-container').html('<p class="text-danger">No se pudieron cargar las actas.</p>');
            }
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
                "orderable": false,
                // Reemplazamos 'defaultContent' por una función 'render' dinámica
                "render": function(data, type, row) {
                    // Verificamos si el acta de esta fila está finalizada
                    const esFinalizado = row.firma.toLowerCase() === 'finalizado';

                    // Creamos el HTML de cada botón, añadiendo 'disabled' si está finalizada
                    const btnEditar = `<button class="btn btn-xs btn-primary btn-editar-encabezado" title="Editar Encabezado" ${esFinalizado ? 'disabled' : ''}><i class="fas fa-pencil-alt"></i></button>`;
                    const btnContenido = `<button class="btn btn-xs btn-success btn-gestionar-contenido" title="Gestionar Contenido" ${esFinalizado ? 'disabled' : ''}><i class="fas fa-stream"></i></button>`;
                    const btnQr = `<button class="btn btn-xs btn-warning btn-generar-qr" title="Compartir (QR)" ${esFinalizado ? 'disabled' : ''}><i class="fas fa-qrcode"></i></button>`;
                    const btnFinalizar = `<button class="btn btn-xs btn-info btn-finalizar-acta" title="Finalizar Acta" ${esFinalizado ? 'disabled' : ''}><i class="fas fa-check-circle"></i></button>`;
                    
                    // El botón de PDF siempre estará activo
                    const btnPdf = `<button class="btn btn-xs btn-danger btn-generar-pdf" title="Generar PDF"><i class="fas fa-file-pdf"></i></button>`;

                    // Unimos todos los botones en un solo string de HTML
                    return `${btnEditar} ${btnContenido} ${btnQr} ${btnFinalizar} ${btnPdf}`;
                }
            }
        ],
        // --- FIN DE LA MODIFICACIÓN ---
        "order": [[ 3, "desc" ]],
        "initComplete": function() {
            spinner.hide();
            tablaElement.show();
        }
    });

    $('#tabla-actas tbody').on('click', 'button', async function() {
        const data = tabla.row($(this).parents('tr')).data();
        if (!data) return;

        if ($(this).hasClass('btn-editar-encabezado')) {
            window.cargarVista('editar_acta', data.codigo);
        } else if ($(this).hasClass('btn-gestionar-contenido')) {
            window.cargarVista('gestionar_contenido', data.codigo);
        } else if ($(this).hasClass('btn-generar-qr')) {
            window.cargarVista('generar_qr', data.codigo);
        } else if ($(this).hasClass('btn-finalizar-acta')) {
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
                    // --- INICIO DE LA CORRECCIÓN ---
                    // Si la respuesta no es de éxito (ej: 409 Conflict)
                    if (!response.ok) {
                        // Leemos el JSON que viene en el cuerpo de la respuesta de ERROR
                        return response.json().then(errorData => {
                            // Y lanzamos un nuevo error CON el mensaje específico del backend
                            throw new Error(errorData.message || 'Ocurrió un error desconocido.');
                        });
                    }
                    // Si la respuesta es de éxito, la procesamos normalmente
                    return response.json();
                    // --- FIN DE LA CORRECCIÓN ---
                })
                .then(() => {
                    window.mostrarNotificacion('Acta finalizada exitosamente.', 'success');
                    tabla.ajax.reload(); // Recargar la tabla para ver el cambio
                })
                .catch(error => {
                    // Ahora el 'error.message' contendrá el mensaje detallado del backend
                    window.mostrarNotificacion(error.message, 'danger');
                });
            }
        }
        
        // --- Lógica para el botón de GENERAR PDF ---
else if ($(this).hasClass('btn-generar-pdf')) {
    const boton = $(this);
    boton.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i>');
    window.mostrarNotificacion('Generando PDF, por favor espera...', 'info');

    try {
        const colorPrincipal = '#2c3e50'; // Azul oscuro para títulos principales
        const colorSecundario = '#ff7300'; // Naranja para las columnas (usando el que definiste)

        const [logoBase64, response] = await Promise.all([
            getBase64Image('assets/img/logo2.png'),
            fetch(`${APP_CONFIG.backendUrl}actas/obtener-pdf-data/${data.codigo}`, {
                headers: { 'Authorization': `Bearer ${APP_CONFIG.token}` }
            })
        ]);

        if (!response.ok) throw new Error('No se pudieron obtener los datos para el PDF.');
        
        const pdfData = await response.json();
        if (!pdfData || !pdfData.acta) throw new Error('El acta no tiene datos válidos.');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        // --- 2. Encabezado ---
        doc.autoTable({
            startY: 10,
            body: [[
                { content: '', styles: { cellWidth: 50 } },
                { content: 'ACTA DE REUNIÓN', styles: { cellWidth: 'auto', halign: 'center', fontStyle: 'bold', fontSize: 16, valign: 'middle' } },
                { content: `Código: ${pdfData.acta.codigo}\nVersión: 1.0\nAprobado: Gerencia`, styles: { cellWidth: 50, halign: 'right', fontSize: 9, valign: 'middle' } }
            ]],
            theme: 'plain',
            didDrawCell: function(data) {
                if (data.section === 'body' && data.column.index === 0) {
                    doc.addImage(logoBase64, 'PNG', data.cell.x, data.cell.y, 45, 18);
                }
            }
        });

        // --- 3. Información General ---
        const infoBody = [
            [`Tema principal:${pdfData.acta.tema || ''}`, `Tipo de reunión: ${pdfData.acta.tipo_reunion || 'N/A'}`],
            [`Fecha: ${new Date(pdfData.acta.fecha).toLocaleDateString('es-CO')}`, `Lugar: ${pdfData.acta.lugar || ''}`],
            [`Hora inicio: ${pdfData.acta.horaInicio || ''}`, `Hora Fin: ${pdfData.acta.horaFin || 'N/A'}`],
            [{ content: `Número de Asistentes: ${pdfData.acta.cantidad_asistentes}`, colSpan: 2 }]
        ];
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 5,
            head: [[{ content: '1. Información General', colSpan: 2, styles: { fontStyle: 'bold', fillColor: colorPrincipal, textColor: 255 } }]],
            body: infoBody,
            theme: 'grid'
        });

        // --- 4. Desarrollo del Temario ---
        const desarrolloBody = pdfData.contenido.map((item, index) => [ index + 1, item.temario_code, item.intervenciones || 'Sin intervención registrada.']);
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [
                [{ content: '2. Desarrollo', colSpan: 3, styles: { fontStyle: 'bold', fillColor: colorPrincipal, textColor: 255 } }],
                [
                    { content: 'N°', styles: { fillColor: colorSecundario, textColor: 255 } },
                    { content: 'Temario', styles: { fillColor: colorSecundario, textColor: 255 } },
                    { content: 'Intervenciones', styles: { fillColor: colorSecundario, textColor: 255 } }
                ]
            ],
            body: desarrolloBody,
            theme: 'grid'
        });

        // --- 5. Compromisos (CON ESTILOS CORREGIDOS) ---
        const compromisosBody = pdfData.contenido
            .filter(item => item.compromisos && item.compromisos.trim() !== '')
            .map(item => {
                const match = item.compromisos.match(/\[Responsable:\s*(.*?)\s*\|\s*Fecha:\s*(.*?)\]/);
                const detalle = item.compromisos.replace(/\[Responsable:.*\]/g, '').replace(/\d+\.\s/g, '').trim();
                const responsable = match ? match[1] : 'No definido';
                const fecha = match ? match[2] : 'No definida';
                return [item.temario_code, detalle, responsable, fecha];
            });

        if (compromisosBody.length > 0) {
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 10,
                head: [
                    [{ content: '3. Compromisos', colSpan: 4, styles: { fontStyle: 'bold', fillColor: colorPrincipal, textColor: 255 } }],
                    [
                        { content: 'Temario', styles: { fillColor: colorSecundario, textColor: 255 } },
                        { content: 'Detalle', styles: { fillColor: colorSecundario, textColor: 255 } },
                        { content: 'Responsable', styles: { fillColor: colorSecundario, textColor: 255 } },
                        { content: 'Fecha', styles: { fillColor: colorSecundario, textColor: 255 } }
                    ]
                ],
                body: compromisosBody,
                theme: 'grid',
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 25 }
                }
            });
        }
        
        // --- 6. Listado de Asistencia (Firmas) ---
        if (pdfData.firmas && pdfData.firmas.length > 0) {
            const firmasBody = pdfData.firmas.map(f => [`${f.nombre} ${f.apellidos}`, f.cargo, f.empresa, '']);
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 10,
                head: [
                    [{ content: '4. Listado de Asistencia', colSpan: 4, styles: { fontStyle: 'bold', fillColor: colorPrincipal, textColor: 255 } }], 
                    [
                        { content:'Nombre Completo', styles: { fillColor: colorSecundario, textColor: 255 } }, 
                        { content: 'Cargo', styles: { fillColor: colorSecundario, textColor: 255 } }, 
                        { content: 'Empresa', styles: { fillColor: colorSecundario, textColor: 255 } }, 
                        { content: 'Firma', styles: { fillColor: colorSecundario, textColor: 255 } }
                    ]
                ],
                body: firmasBody,
                theme: 'grid',
                columnStyles: {
                    0: { cellWidth: 'auto' }, 
                    1: { cellWidth: 35 }, 
                    2: { cellWidth: 40 }, 
                    3: { cellWidth: 50, minCellHeight: 20 } 
                },
                didDrawCell: function(data) {
                    if (data.column.index === 3 && data.cell.section === 'body') {
                        const firmaBase64 = pdfData.firmas[data.row.index].firma;
                        if (firmaBase64) {
                            const cellWidth = data.cell.width;
                            const cellHeight = data.cell.height;
                            const padding = 4;
                            const availableWidth = cellWidth - padding;
                            const availableHeight = cellHeight - padding;
                            const imgProps = doc.getImageProperties(firmaBase64);
                            const aspectRatio = imgProps.width / imgProps.height;
                            let newWidth = availableWidth;
                            let newHeight = newWidth / aspectRatio;
                            if (newHeight > availableHeight) {
                                newHeight = availableHeight;
                                newWidth = newHeight * aspectRatio;
                            }
                            const x = data.cell.x + (cellWidth - newWidth) / 2;
                            const y = data.cell.y + (cellHeight - newHeight) / 2;
                            doc.addImage(firmaBase64, 'PNG', x, y, newWidth, newHeight);
                        }
                    }
                }
            });
        }
        
        // --- 7. Paginación ---
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        // --- 8. Guardar PDF ---
        doc.save(`Acta-${data.codigo}.pdf`);

    } catch (error) {
        console.error('Error al generar PDF:', error);
        window.mostrarNotificacion(error.message, 'danger');
    } finally {
        boton.prop('disabled', false).html('<i class="fas fa-file-pdf"></i>');
    }
    }
        });
};