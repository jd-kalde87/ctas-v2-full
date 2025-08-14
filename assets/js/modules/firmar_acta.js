// assets/js/firmar_acta.js

document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando página de firma...");
    const mainContainer = document.getElementById('main-container');
    if (!mainContainer) {
        console.error("Error crítico: No se encontró el main-container. Asegúrate que el HTML es correcto.");
        return;
    }
    
    const BACKEND_URL = mainContainer.dataset.backendUrl;
    const ACTA_CODIGO = mainContainer.dataset.actaCodigo;
    const token = sessionStorage.getItem('asistenciaToken');

    if (!token) {
        alert('Acceso denegado. Por favor, valide su documento primero.');
        window.location.href = `asistencia.php?codigo=${ACTA_CODIGO}`;
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        document.getElementById('user-name').textContent = payload.nombre || 'Usuario';
        document.getElementById('user-cedula').textContent = payload.cedula || 'N/A';
    } catch (e) {
        console.error("Error al decodificar el token:", e);
        alert("El token de sesión no es válido. Por favor, intente ingresar de nuevo.");
        return;
    }

    cargarDatosActa(token, BACKEND_URL, ACTA_CODIGO);

    const canvas = document.getElementById('signature-pad');
    const signaturePad = new SignaturePad(canvas);

    document.getElementById('clear-signature').addEventListener('click', () => signaturePad.clear());

    document.getElementById('save-signature').addEventListener('click', () => {
        if (signaturePad.isEmpty()) {
            return alert("Por favor, provea su firma.");
        }
        const signatureData = signaturePad.toDataURL('image/png');
        enviarFirma(token, signatureData, BACKEND_URL, ACTA_CODIGO);
    });
});

async function cargarDatosActa(token, backendUrl, actaCodigo) {
    console.log("Iniciando carga de datos del acta...");
    const loadingSpinner = document.getElementById('loading-spinner');
    try {
        console.log("Paso 1: Obteniendo encabezado desde:", `${backendUrl}actas/obtener/${actaCodigo}`);
        const responseActa = await fetch(`${backendUrl}actas/obtener/${actaCodigo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("Respuesta del encabezado:", responseActa.status, responseActa.statusText);
        if (!responseActa.ok) throw new Error(`No se pudo obtener el encabezado del acta (código: ${responseActa.status})`);
        const acta = await responseActa.json();
        console.log("Datos del encabezado recibidos:", acta);

        console.log("Paso 2: Obteniendo contenido desde:", `${backendUrl}contenido-actas/obtener/${actaCodigo}`);
        let contenido = [];
        const responseContenido = await fetch(`${backendUrl}contenido-actas/obtener/${actaCodigo}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log("Respuesta del contenido:", responseContenido.status, responseContenido.statusText);
        if (responseContenido.ok) {
            contenido = await responseContenido.json();
        } else {
            console.warn('No se encontró contenido para esta acta o hubo un error al cargarlo.');
        }
        console.log("Datos del contenido recibidos:", contenido);

        console.log("Paso 3: Renderizando acta...");
        renderizarActa({ acta: acta, contenido: contenido });
        
        loadingSpinner.style.display = 'none';
        document.getElementById('acta-content').style.display = 'block';
        document.getElementById('firma-container').style.display = 'block';
        console.log("Renderizado completo.");

    } catch (error) {
        console.error("Error final en cargarDatosActa:", error);
        loadingSpinner.innerHTML = `<p class="text-danger font-weight-bold">Error al cargar el acta: ${error.message}</p><p class="text-muted">Revise la consola (F12) para más detalles.</p>`;
    }
}

function renderizarActa(data) {
    const acta = data.acta;
    const contenido = Array.isArray(data.contenido) ? data.contenido : [];
    const container = document.getElementById('acta-content');

    let html = `
        <div class="acta-header">
            <h4>${acta.tema || 'Sin Tema'}</h4>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Lugar:</strong> ${acta.lugar || 'N/A'}</p>
                    <p><strong>Fecha:</strong> ${acta.fecha || 'N/A'}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Hora de Inicio:</strong> ${acta.horaInicio || 'N/A'}</p>
                    <p><strong>Hora de Fin:</strong> ${acta.horaFin || 'N/A'}</p>
                </div>
            </div>
        </div>
        <hr>
    `;

    // --- INICIO DE LA CORRECCIÓN ---
    let temarioItems = [];
    if (acta.temario) {
        if (typeof acta.temario === 'string') {
            // Si es un texto, lo separamos por comas
            temarioItems = acta.temario.split(',');
        } else if (Array.isArray(acta.temario)) {
            // Si ya es un arreglo, simplemente lo usamos
            temarioItems = acta.temario;
        }
    }

    if (temarioItems.length > 0) {
        html += `<h6><strong>Temario:</strong></h6><ol>`;
        temarioItems.forEach(item => {
            // Nos aseguramos de que item sea un string antes de usar .trim()
            html += `<li>${String(item).trim()}</li>`;
        });
        html += `</ol><hr>`;
    }
    // --- FIN DE LA CORRECCIÓN ---

    if (contenido.length > 0) {
        contenido.forEach(item => {
            html += `
                <div class="acta-section">
                    <h5><strong>Punto del Temario:</strong> ${item.temario_code || ''}</h5>
                    <h6>Intervenciones:</h6>
                    <p>${item.intervenciones || 'No hay intervenciones registradas.'}</p>
                    <h6>Compromisos:</h6>
                    <div>${item.compromisos ? parseCompromisos(item.compromisos) : '<p class="text-muted small">No hay compromisos para este punto.</p>'}</div>
                </div>
                <hr class="my-3">
            `;
        });
    } else {
        html += '<p>No hay contenido detallado para esta acta.</p>';
    }

    container.innerHTML = html;
}

function parseCompromisos(compromisosTexto) {
    if (!compromisosTexto || typeof compromisosTexto !== 'string' || compromisosTexto.trim() === '') {
        return '<p class="text-muted small">No hay compromisos para este punto.</p>';
    }
    let html = '<table class="table table-sm table-bordered" style="font-size: 0.9em;"><thead><tr><th>Compromiso</th><th>Responsable</th><th>Fecha</th></tr></thead><tbody>';
    const lineas = compromisosTexto.trim().split(/\\n|\n/);
    lineas.forEach(linea => {
        const match = linea.match(/(\d+\.\s)?(.*)\[Responsable:\s(.*)\s\|\sFecha:\s(.*)\]/);
        if (match) {
            html += `<tr><td>${match[2].trim()}</td><td>${match[3].trim()}</td><td>${match[4].trim()}</td></tr>`;
        }
    });
    html += '</tbody></table>';
    return html;
}

function enviarFirma(token, signatureData, backendUrl, actaCodigo) {
    fetch(`${backendUrl}firmas-users/crear`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ firma: signatureData, acta: actaCodigo })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) throw new Error(data.message);
        sessionStorage.removeItem('asistenciaToken');
        window.location.href = 'gracias.php';
    })
    .catch(error => {
        alert(`Error al guardar la firma: ${error.message}`);
    });
}