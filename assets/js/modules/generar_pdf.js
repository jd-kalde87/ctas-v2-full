// assets/js/modules/generar_pdf.js

window.inicializarVista = function(actaCodigo) {
    
    // Muestra una notificación al usuario de que el proceso ha comenzado.
    window.mostrarNotificacion('Generando PDF del acta, por favor espera...', 'info');

    // 1. Cargar la plantilla HTML en un div temporal y oculto
    const tempContainer = $('<div>').hide().appendTo('body');
    
    tempContainer.load(`app/plantilla_pdf.php`, { id: actaCodigo }, function() {
        
        // 2. Endpoint del backend para obtener TODOS los datos del acta (incluidas firmas)
        const url = `${APP_CONFIG.backendUrl}actas/obtener-pdf-data/${actaCodigo}`;
        
        fetch(url, { headers: { 'Authorization': `Bearer ${APP_CONFIG.token}` }})
        .then(response => {
            if (!response.ok) throw new Error('No se pudieron obtener los datos para el PDF.');
            return response.json();
        })
        .then(data => {
            // 3. Poblar la plantilla con los datos recibidos
            const acta = data.acta;
            const contenido = data.contenido || [];
            const firmas = data.firmas || [];

            $('#pdf-codigo').text(acta.codigo);
            
            // Poblar Información General
            $('#pdf-info-general').append(`
                <p><strong>Tema:</strong> ${acta.tema}</p>
                <p><strong>Lugar:</strong> ${acta.lugar}</p>
                <p><strong>Fecha:</strong> ${acta.fecha}</p>
                <p><strong>Hora:</strong> ${acta.horaInicio} - ${acta.horaFin}</p>
            `);

            // Poblar Temario
            if (acta.temario) {
                let temarioHtml = '<ol>';
                const temarioItems = Array.isArray(acta.temario) ? acta.temario : acta.temario.split(',');
                temarioItems.forEach(item => { temarioHtml += `<li>${item.trim()}</li>`; });
                temarioHtml += '</ol>';
                $('#pdf-contenido-temario').append(temarioHtml);
            }

            // Poblar Desarrollo y Compromisos (asumiendo que están en el contenido)
            let desarrolloHtml = '<ol>';
            let compromisosHtml = '<table class="asistencia-table"><thead><tr><th>Detalle</th><th>Responsable</th><th>Fecha</th></tr></thead><tbody>';
            contenido.forEach(item => {
                desarrolloHtml += `<li><strong>${item.temario_code}:</strong> ${item.intervenciones || ''}</li>`;
                // Suponiendo que los compromisos vienen en el formato que parseamos antes
                if(item.compromisos) {
                    const lineas = item.compromisos.trim().split(/\\n|\n/);
                    lineas.forEach(linea => {
                        const match = linea.match(/(.*)\[Responsable:\s(.*)\s\|\sFecha:\s(.*)\]/);
                        if (match) {
                           compromisosHtml += `<tr><td>${match[1].replace(/^\d+\.\s/, '').trim()}</td><td>${match[2].trim()}</td><td>${match[3].trim()}</td></tr>`;
                        }
                    });
                }
            });
            desarrolloHtml += '</ol>';
            compromisosHtml += '</tbody></table>';
            $('#pdf-desarrollo').append(desarrolloHtml);
            $('#pdf-compromisos').append(compromisosHtml);

            // Poblar Asistentes y Firmas
            let firmasHtml = '';
            firmas.forEach(firma => {
                firmasHtml += `
                    <tr>
                        <td>${firma.nombreCompleto || 'N/A'}</td>
                        <td>${firma.empresa || 'N/A'}</td>
                        <td>${firma.cargo || 'N/A'}</td>
                        <td><img src="${firma.firmaData}" class="firma-img"></td>
                    </tr>
                `;
            });
            $('#pdf-asistencia tbody').html(firmasHtml);

            // 4. Usar html2canvas para capturar la plantilla como una imagen
            const pdfTemplate = document.getElementById('pdf-template');
            html2canvas(pdfTemplate, { scale: 2 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jspdf.jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const imgProps= pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                let heightLeft = pdfHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();

                // Manejo de múltiples páginas
                while (heightLeft >= 0) {
                  position = heightLeft - pdfHeight;
                  pdf.addPage();
                  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                  heightLeft -= pdf.internal.pageSize.getHeight();
                }
                
                // 5. Descargar el PDF
                pdf.save(`Acta-${actaCodigo}.pdf`);
                
                // Limpiar y volver
                tempContainer.remove();
                window.mostrarNotificacion('PDF generado exitosamente.', 'success');
                window.cargarVista('lista_actas');
            });
        })
        .catch(error => {
            console.error("Error al generar el PDF:", error);
            window.mostrarNotificacion(`Error: ${error.message}`, 'danger');
            tempContainer.remove();
            window.cargarVista('lista_actas');
        });
    });
};