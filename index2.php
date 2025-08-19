<?php
include('config.php');
session_start();
if (!isset($_SESSION['token'])) {
    header("Location: ./login.php");
    exit();
}
$user_nombre = $_SESSION['user_nombre'] ?? 'Usuario';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Panel de Actas</title>
    <link rel="icon" href="./assets/img/favicon16x16.png" type="image/png">
    
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
    <link rel="stylesheet" href="libs/admin-lte/plugins/fontawesome-free/css/all.min.css">
    <link rel="stylesheet" href="libs/datatables/datatables.min.css">
    <link rel="stylesheet" href="libs/admin-lte/dist/css/adminlte.min.css">
    <link rel="stylesheet" href="assets/css/style.css">

    <style>
        /* Estilos para el logo en sidebar */
        .brand-link {
            text-align: center;
            padding: 15px 5px;
            border-bottom: none;
        }
        .brand-link .brand-image {
            height: 45px;
            object-fit: contain;
            opacity: 1;
            transition: all 0.3s ease;
        }
        .brand-text {
            display: none; /* Ocultamos el texto del logo */
        }
        
        /* Logo colapsado (solo favicon) */
        .brand-link-collapsed {
            display: none;
            padding: 10px 5px;
            text-align: center;
        }
        .brand-link-collapsed .brand-image {
            height: 32px;
            width: 32px;
        }
        
        /* Mostrar logo apropiado según estado */
        .sidebar-collapsed .brand-link {
            display: none;
        }
        .sidebar-collapsed .brand-link-collapsed {
            display: block;
        }
        
        /* Ajustes para el panel de usuario */
        .user-panel {
            padding-top: 15px;
        }
    </style>

    <script>
    const APP_CONFIG = {
        token: <?php echo json_encode($_SESSION['token']); ?>,
        backendUrl: <?php echo json_encode(BACKEND_API_URL); ?>
    };
    </script>
</head>
<body class="hold-transition sidebar-mini">
<div class="wrapper">

    <nav class="main-header navbar navbar-expand navbar-white navbar-light">
        <ul class="navbar-nav">
            <li class="nav-item">
                <a class="nav-link" data-widget="pushmenu" href="#" role="button"><i class="fas fa-bars"></i></a>
            </li>
        </ul>
    </nav>
    
    <aside class="main-sidebar sidebar-dark-primary elevation-4">
        <!-- Logo normal -->
        <a href="index.php" class="brand-link">
            <img src="assets/img/Logo.png" alt="Logo Sistema" class="brand-image">
        </a>
        
        <!-- Logo colapsado (favicon) -->
        <a href="index.php" class="brand-link brand-link-collapsed">
            <img src="assets/img/favicon32x32.png" alt="Logo Sistema" class="brand-image">
        </a>
        
        <div class="sidebar">
            <div class="user-panel mt-3 pb-3 mb-3 d-flex">
                <div class="image">
                    <img src="libs/admin-lte/dist/img/user2-160x160.jpg" class="img-circle elevation-2" alt="User Image">
                </div>
                <div class="info">
                    <a href="#" class="d-block"><?php echo htmlspecialchars($user_nombre); ?></a>
                </div>
            </div>
            
            <nav class="mt-2">
                <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                    <li class="nav-item">
                        <a href="#" class="nav-link active" data-vista="dashboard">
                            <i class="nav-icon fas fa-tachometer-alt"></i><p>Dashboard</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" data-vista="crear_acta">
                            <i class="nav-icon fas fa-plus-circle"></i><p>Nueva Acta</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" data-vista="lista_actas">
                            <i class="nav-icon fas fa-file-alt"></i><p>Ver Actas</p>
                        </a>
                    </li>
                    <li class="nav-header">ADMINISTRACIÓN</li>
                    <li class="nav-item">
                        <a href="#" class="nav-link" data-vista="lista_usuarios">
                            <i class="nav-icon fas fa-users"></i><p>Gestionar Usuarios</p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="logout.php" class="nav-link">
                            <i class="nav-icon fas fa-sign-out-alt"></i><p>Cerrar Sesión</p>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    </aside>

    <div class="content-wrapper">
        <main class="content" id="main-content"></main>
    </div>
    
    <footer class="main-footer">
        <strong>Copyright &copy; 2024-<?php echo date('Y'); ?> Sistema de Actas.</strong> Todos los derechos reservados.
    </footer>
</div>

<script src="libs/admin-lte/plugins/jquery/jquery.min.js"></script>
<script src="libs/admin-lte/plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
<script src="libs/admin-lte/dist/js/adminlte.min.js"></script>
<script src="libs/datatables/datatables.min.js"></script> 
<script src="libs/html2canvas/html2canvas.min.js"></script>
<script src="libs/jspdf/jspdf.umd.min.js"></script>
<script src="libs/jspdf.plugin.autotable.min.js"></script>
<script src="libs/qrcode/qrcode.min.js"></script>
<script src="assets/js/app.js"></script>

<script>
$(document).ready(function() {
    // Manejar el estado colapsado del sidebar
    $('[data-widget="pushmenu"]').on('click', function() {
        $('body').toggleClass('sidebar-collapsed');
    });

    // Verificar estado inicial
    if($(window).width() < 992) {
        $('body').addClass('sidebar-collapsed');
    }

    // Manejar redimensionamiento
    $(window).on('resize', function() {
        if($(window).width() < 992) {
            $('body').addClass('sidebar-collapsed');
        } else {
            $('body').removeClass('sidebar-collapsed');
        }
    });
});
</script>
</body>
</html>