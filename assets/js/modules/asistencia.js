// assets/js/modules/asistencia.js

// Esperamos a que todo el HTML de la página esté cargado para empezar a trabajar
document.addEventListener('DOMContentLoaded', function() {
    
    // Obtenemos las variables desde los atributos data-* en el HTML
    const mainContainer = document.getElementById('main-container');
    const BACKEND_URL = mainContainer.dataset.backendUrl;
    const ACTA_CODIGO = mainContainer.dataset.actaCodigo;

    const form = document.getElementById('form-asistencia');
    const btnValidar = document.getElementById('btn-validar');
    const btnText = document.getElementById('btn-text');
    const btnSpinner = document.getElementById('btn-spinner');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const cedula = document.getElementById('cedula').value;
        if (!cedula) {
            mostrarError('Por favor, ingrese un número de documento.');
            return;
        }

        btnValidar.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';
        errorMessage.style.display = 'none';

        const endpoint = `${BACKEND_URL}usuario/obtener_por_cedulas`;

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula: cedula, acta_codigo: ACTA_CODIGO })
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                window.location.href = `crear_asistente_publico.php?codigo=${ACTA_CODIGO}`;
                throw new Error('Usuario no encontrado, redirigiendo a registro.');
            }
        })
        .then(data => {
            if (data && data[0]) {
                const token = data[0];
                sessionStorage.setItem('asistenciaToken', token);
                window.location.href = `firmar_acta.php?codigo=${ACTA_CODIGO}`;
            } else {
                throw new Error('Respuesta inesperada del servidor. No se recibió el token.');
            }
        })
        .catch(error => {
            if (error.message !== 'Usuario no encontrado, redirigiendo a registro.') {
                mostrarError(error.message);
                btnValidar.disabled = false;
                btnText.style.display = 'inline-block';
                btnSpinner.style.display = 'none';
            }
        });
    });

    function mostrarError(mensaje) {
        errorMessage.textContent = mensaje;
        errorMessage.style.display = 'block';
    }
});