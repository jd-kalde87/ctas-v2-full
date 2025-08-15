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
            "oPaginate": {
                "sFirst":    "Primero",
                "sLast":     "Último",
                "sNext":     "Siguiente",
                "sPrevious": "Anterior"
            },
            "oAria": {
                "sSortAscending":  ": Activar para ordenar la columna de manera ascendente",
                "sSortDescending": ": Activar para ordenar la columna de manera descendente"
            }
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
    // Se ha convertido la función en 'async' para poder usar 'await' en la generación del PDF.
    $('#tabla-actas tbody').on('click', 'button', async function() {
        const data = tabla.row($(this).parents('tr')).data();
        if (!data) return; // Evitar errores si no hay datos

        // --- Lógica para los botones de NAVEGACIÓN ---
        if ($(this).hasClass('btn-editar-encabezado')) {
            window.cargarVista('editar_acta', data.codigo);
        } 
        else if ($(this).hasClass('btn-gestionar-contenido')) {
            window.cargarVista('gestionar_contenido', data.codigo);
        } 
        else if ($(this).hasClass('btn-generar-qr')) {
            window.cargarVista('generar_qr', data.codigo);
        }
        
        // --- Lógica para el botón de ACCIÓN (Finalizar) ---
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
        
        // --- Lógica para el botón de GENERAR PDF ---
        // --- Lógica para el botón de GENERAR PDF ---
else if ($(this).hasClass('btn-generar-pdf')) {
    const boton = $(this);
    boton.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i>');
    window.mostrarNotificacion('Generando PDF, por favor espera...', 'info');

    try {
        // 1. Cargar el logo de la empresa y los datos del acta simultáneamente
        const [logoBase64, response] = await Promise.all([
            getBase64Image('assets/img/Logo.png'),
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

        // --- 2. Construir el Encabezado (como en el Word) ---
        doc.autoTable({
            startY: 10,
            head: [[
                { content: '', styles: { minCellWidth: 40 } },
                { content: 'Acta de Reunión', styles: { halign: 'center', fontStyle: 'bold', fontSize: 14 } },
                { content: `Código: ${pdfData.acta.codigo}\nVersión: 1\nPágina:`, styles: { halign: 'right', fontSize: 8 } }
            ]],
            theme: 'plain',
            didDrawCell: function(data) {
                if (data.section === 'head' && data.column.index === 0) {
                    // Añadir el logo en la primera celda del encabezado
                    doc.addImage(logoBase64, 'PNG', data.cell.x + 5, data.cell.y + 2, 30, 15);
                }
            },
            headStyles: { valign: 'middle', cellPadding: 2 }
        });

        // --- 3. Añadir la Información General ---
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 5,
            head: [[{ content: '1. Información General', styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }]],
            body: [
                [`Tema: ${pdfData.acta.tema}`, `Tipo de reunión: Comité mensual`],
                [`Fecha: ${new Date(pdfData.acta.fecha).toLocaleDateString('es-CO')}`, `Lugar: ${pdfData.acta.lugar}`],
                [`Hora inicio: ${pdfData.acta.horaInicio}`, `Hora Fin: ${pdfData.acta.horaFin}`]
            ],
            theme: 'grid'
        });

        // --- 4. Añadir el Desarrollo del Temario (Intervenciones) ---
        const desarrolloBody = pdfData.contenido.map((item, index) => [
            index + 1,
            item.temario_code,
            item.intervenciones || 'Sin intervención registrada.'
        ]);

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 10,
            head: [[
                { content: '3. Desarrollo', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }
            ], ['N°', 'Temario', 'Intervenciones']],
            body: desarrolloBody,
            theme: 'grid'
        });

        // --- 5. Añadir los Compromisos ---
        const compromisosBody = pdfData.contenido
            .filter(item => item.compromisos && item.compromisos.trim() !== '')
            .map(item => {
                // Extraer responsable y fecha del texto del compromiso
                const match = item.compromisos.match(/\[Responsable:\s*(.*?)\s*\|\s*Fecha:\s*(.*?)\]/);
                const detalle = item.compromisos.replace(/\[Responsable:.*\]/g, '').replace(/\d+\.\s/g, '').trim();
                const responsable = match ? match[1] : 'No definido';
                const fecha = match ? match[2] : 'No definida';
                return [detalle, responsable, fecha];
            });

        if (compromisosBody.length > 0) {
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 10,
                head: [[{ content: '4. Compromisos', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }],
                       ['Detalle', 'Responsable', 'Fecha']],
                body: compromisosBody,
                theme: 'grid'
            });
        }
        
        // --- 6. Añadir Listado de Asistencia (Firmas) ---
        if (pdfData.firmas && pdfData.firmas.length > 0) {
            const firmasBody = pdfData.firmas.map(f => [`${f.nombre} ${f.apellidos}`, f.cargo, f.empresa, '']);
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 10,
                head: [[
                    { content: 'Listado de Asistencia', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }
                ], ['Nombre Completo', 'Cargo', 'Empresa', 'Firma']],
                body: firmasBody,
                theme: 'grid',
                didDrawCell: function(cellData) {
                    if (cellData.column.index === 3 && cellData.cell.section === 'body') {
                        const firmaBase64 = pdfData.firmas[cellData.row.index].firma;
                        if (firmaBase64) {
                            doc.addImage(firmaBase64, 'PNG', cellData.cell.x + 15, cellData.cell.y + 2, 40, 15);
                        }
                    }
                },
                columnStyles: { 3: { minCellHeight: 25 } }
            });
        }
        
        // --- 7. Añadir número de página en el pie de página ---
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        // --- 8. Guardar el PDF ---
        doc.save(`Acta-${data.codigo}.pdf`);

    } catch (error) {
        console.error('Error al generar PDF:', error);
        window.mostrarNotificacion(error.message, 'danger');
    } finally {
        boton.prop('disabled', false).html('<i class="fas fa-file-pdf"></i>');
    }
    }
        });
    // ****** FIN DE LA MODIFICACIÓN ******
};