<?php
include('config.php');
$codigo_acta = htmlspecialchars($_GET['codigo'] ?? '');
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Registro de Nuevo Asistente | VOSIN S.A.S</title>
    <link rel="icon" href="./assets/img/Logo.png" type="image/x-icon">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback">
    <link rel="stylesheet" href="libs/admin-lte/plugins/fontawesome-free/css/all.min.css">
    <link rel="stylesheet" href="libs/admin-lte/dist/css/adminlte.min.css">
</head>
<body class="hold-transition register-page">
<div class="register-box">
    <div class="card card-outline card-primary">
        <div class="card-header text-center">
            <a href="https://vosin.co" target="_blank" rel="noopener noreferrer">
                <img src="assets/img/logo2.png" alt="Logo VOSIN" class="img-fluid mb-4 logo-img">
            </a>
            <h4>Registro de Nuevo Asistente</h4>
        </div>
        <div class="card-body">
            <p class="login-box-msg">Parece que eres nuevo. Por favor, completa tus datos para registrarte.</p>
            <form id="form-registro">
                <input type="text" class="form-control mb-3" id="nombre" placeholder="Nombres" required>
                <input type="text" class="form-control mb-3" id="apellido" placeholder="Apellidos" required>
                <input type="number" class="form-control mb-3" id="num_documento" placeholder="N° de documento" required>
                <input type="number" class="form-control mb-3" id="num_cel" placeholder="N° de celular" required>
                <input type="email" class="form-control mb-3" id="correo" placeholder="Correo electrónico" required>
                <input type="text" class="form-control mb-3" id="empresa" placeholder="Empresa" required>
                <input type="text" class="form-control mb-3" id="cargo" placeholder="Cargo" required>
                <button type="submit" id="btn-registrar" class="btn btn-primary btn-block">Registrarme</button>
            </form>
            <div id="message" class="alert mt-3 text-center" style="display: none;"></div>
        </div>
    </div>
</div>

<script>
    const BACKEND_URL = '<?php echo BACKEND_API_URL; ?>';
    const ACTA_CODIGO = '<?php echo $codigo_acta; ?>';

    document.getElementById('form-registro').addEventListener('submit', function(e) {
        e.preventDefault();
        const datos = {
            nombre: document.getElementById('nombre').value,
            apellidos: document.getElementById('apellido').value,
            cedula: document.getElementById('num_documento').value,
            telefono: document.getElementById('num_cel').value,
            email: document.getElementById('correo').value,
            empresa: document.getElementById('empresa').value,
            cargo: document.getElementById('cargo').value,
            estado: "activo",
            contrasena: "", // La contraseña se puede dejar vacía para asistentes
            admin: false
        };

        // Este es el endpoint que usaba el proyecto antiguo (crear-asistente-acta.php)
        fetch(`${BACKEND_URL}usuario/crear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        })
        .then(response => {
            if (response.status !== 201) throw new Error('El documento ya podría estar en uso.');
            return response.json();
        })
        .then(data => {
            document.getElementById('btn-registrar').disabled = true;
            const messageDiv = document.getElementById('message');
            messageDiv.className = 'alert alert-success mt-3 text-center';
            messageDiv.innerHTML = `¡Registro exitoso! <br> Serás redirigido para que ingreses de nuevo.`;
            messageDiv.style.display = 'block';

            // Redirigir de vuelta a la página de asistencia después de 3 segundos
            setTimeout(() => {
                window.location.href = `asistencia.php?codigo=${ACTA_CODIGO}`;
            }, 3000);
        })
        .catch(error => {
            const messageDiv = document.getElementById('message');
            messageDiv.className = 'alert alert-danger mt-3 text-center';
            messageDiv.textContent = `Error: ${error.message}`;
            messageDiv.style.display = 'block';
        });
    });
</script>
</body>
</html>