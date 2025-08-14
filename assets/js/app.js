$(document).ready(function() {

    const mainContent = $('#main-content');
    const contentWrapper = $('.content-wrapper');

    window.mostrarNotificacion = function(mensaje, tipo = 'success') {
        const alertaHtml = `<div class="alert alert-${tipo} alert-dismissible fade show" role="alert">${mensaje}<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>`;
        $('.content-header').find('.alert').remove();
        $('.content-header').after(alertaHtml);
        setTimeout(() => { $('.content-header').next('.alert').fadeOut(); }, 5000);
    }

    window.cargarVista = function(vista, id = null) {
        let url = 'app/' + vista + '.php';
        let dataToSend = { id: id };

        mainContent.load(url, dataToSend, function(response, status, xhr) {
            if (status == "error") {
                mainContent.html(`<div class="p-3"><div class="alert alert-danger"><strong>Error:</strong> No se pudo cargar la vista <code>${url}</code>.</div></div>`);
            } else {
                $.getScript(`assets/js/modules/${vista}.js`)
                    .done(function() {
                        console.log(`Módulo ${vista}.js cargado.`);
                        if (typeof window.inicializarVista === 'function') {
                            window.inicializarVista(id);
                        }
                    })
                    .fail(function(jqxhr, settings, exception) {
                        if (jqxhr.status === 404) {
                            console.log(`No se encontró un módulo JS para la vista ${vista}.`);
                        } else {
                            console.error(`Error al cargar el módulo ${vista}.js:`, exception);
                        }
                    });
            }
        });
    }

    // Clics en la barra lateral para navegar
    $('.sidebar .nav-link[data-vista]').on('click', function(e) {
        e.preventDefault();
        const vistaSolicitada = $(this).data('vista');
        $('.sidebar .nav-link').removeClass('active');
        $(this).addClass('active');
        window.cargarVista(vistaSolicitada);
    });
    
    // Clics en elementos con 'data-vista' que se cargan dinámicamente
    contentWrapper.on('click', '[data-vista]', function(e) {
        e.preventDefault();
        const vistaSolicitada = $(this).data('vista');
        const linkSidebar = $(`.sidebar .nav-link[data-vista="${vistaSolicitada}"]`);
        
        if (linkSidebar.length > 0) {
             $('.sidebar .nav-link').removeClass('active');
             linkSidebar.addClass('active');
        }
        
        window.cargarVista(vistaSolicitada);
    });

    window.cargarVista('dashboard');

});