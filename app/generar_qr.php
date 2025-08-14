<?php
// Obtenemos el código del acta que se pasó como parámetro
$acta_codigo = htmlspecialchars($_POST['id'] ?? 'Error');
?>

<div class="content-header">
    <div class="container-fluid">
        <div class="row mb-2">
            <div class="col-sm-6">
                <h1 class="m-0">Compartir Acta</h1>
            </div>
        </div>
    </div>
</div>
<div class="content">
    <div class="container-fluid">
        <div class="card card-primary card-outline">
            <div class="card-header">
                <h5 class="m-0">Código QR y Enlace para el Acta: <strong><?php echo $acta_codigo; ?></strong></h5>
            </div>
            <div class="card-body text-center">
                <p>Muestre este código QR o comparta el enlace con los asistentes para que puedan registrar su firma.</p>
                
                <canvas id="qr-canvas" class="p-2 border"></canvas>
                
                <p class="mt-3">
                    <strong>Enlace directo:</strong>
                    <a href="#" id="qr-link" target="_blank"></a>
                </p>

            </div>
            <div class="card-footer text-center">
                <button class="btn btn-secondary" data-vista="lista_actas"><i class="fas fa-arrow-left"></i> Volver a la Lista</button>
                <button class="btn btn-primary" id="btn-descargar-qr"><i class="fas fa-download"></i> Descargar QR</button>
                
                <a href="#" id="btn-compartir-whatsapp" class="btn btn-success">
                    <i class="fab fa-whatsapp"></i> Compartir por WhatsApp
                </a>
                </div>
        </div>
    </div>
</div>