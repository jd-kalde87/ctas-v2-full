// assets/js/modules/generar_qr.js

window.inicializarVista = function(actaCodigo) {
    
    $(document).ready(function() {
        const mainContent = $('#main-content');
        const canvas = document.getElementById('qr-canvas');
        const qrLink = document.getElementById('qr-link');

        if (!canvas) {
            console.error("No se encontró el elemento canvas #qr-canvas en la página.");
            return;
        }
        
        const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
        const urlParaFirmar = `${baseUrl}asistencia.php?codigo=${actaCodigo}`;

        qrLink.href = urlParaFirmar;
        qrLink.textContent = urlParaFirmar;

        QRCode.toCanvas(canvas, urlParaFirmar, { width: 300, margin: 2 }, function (error) {
            if (error) {
                console.error("Error al generar el QR:", error);
                $(canvas).replaceWith('<p class="text-danger">Hubo un error al generar el código QR.</p>');
            } else {
                console.log(`QR para ${actaCodigo} generado exitosamente.`);
            }
        });

        mainContent.off('click', '#btn-descargar-qr').on('click', '#btn-descargar-qr', function() {
            const link = document.createElement('a');
            link.download = `QR_Acta_${actaCodigo}.png`;
            link.href = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            link.click();
        });

        mainContent.off('click', '#btn-compartir-whatsapp').on('click', '#btn-compartir-whatsapp', function(e) {
            e.preventDefault();

            // ****** INICIO DE LA CORRECCIÓN ******
            // 1. Se define el texto y el enlace por separado.
            const mensaje = `Hola, por favor firma el acta de reunión ${actaCodigo} en el siguiente enlace:`;
            
            // 2. Se codifica cada parte de forma independiente.
            const mensajeCodificado = encodeURIComponent(mensaje);
            const enlaceCodificado = encodeURIComponent(urlParaFirmar);
            
            // 3. Se unen las partes codificadas con los saltos de línea (que no se codifican).
            const textoWhatsApp = `${mensajeCodificado}%0A%0A${enlaceCodificado}`;
            
            // 4. Se construye la URL final.
            const whatsappUrl = `https://wa.me/?text=${textoWhatsApp}`;
            // ****** FIN DE LA CORRECCIÓN ******
            
            window.open(whatsappUrl, '_blank');
        });

        mainContent.off('click', '#btn-imprimir-qr');
    });
};