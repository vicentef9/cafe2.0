<?php
session_start();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión - Sistema de Cafetería</title>
    <link rel="stylesheet" href="../../css/styles.css">
</head>
<body>
    <div class="login-container">
        <div class="login-box">
            <h1>Sistema de Cafetería</h1>
            <?php if (isset($_SESSION['error'])): ?>
                <div class="error-message">
                    <?php 
                    echo htmlspecialchars($_SESSION['error']);
                    unset($_SESSION['error']);
                    ?>
                </div>
            <?php endif; ?>
            <?php if (isset($_SESSION['success'])): ?>
                <div class="success-message">
                    <?php 
                    echo htmlspecialchars($_SESSION['success']);
                    unset($_SESSION['success']);
                    ?>
                </div>
            <?php endif; ?>
            <form class="login-form" action="../../php/procesar_login.php" method="POST">
                <div class="form-group">
                    <label for="username">Correo Electrónico</label>
                    <input type="email" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <div style="position:relative; display:flex; align-items:center;">
                        <input type="password" id="password" name="password" required style="padding-right:30px;">
                        <span id="togglePassword" style="position:absolute; right:8px; cursor:pointer;">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 12C3.5 7 8 4 12 4C16 4 20.5 7 23 12C20.5 17 16 20 12 20C8 20 3.5 17 1 12Z" stroke="#333" stroke-width="2" fill="none"/>
                                <circle cx="12" cy="12" r="3" stroke="#333" stroke-width="2" fill="none"/>
                            </svg>
                        </span>
                    </div>
                </div>
                <button type="submit" class="login-button">Iniciar Sesión</button>
            <script>
                const passwordInput = document.getElementById('password');
                const togglePassword = document.getElementById('togglePassword');
                let passwordVisible = false;
                togglePassword.addEventListener('click', function() {
                    passwordVisible = !passwordVisible;
                    passwordInput.type = passwordVisible ? 'text' : 'password';
                    togglePassword.innerHTML = passwordVisible
                        ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12C3.5 7 8 4 12 4C16 4 20.5 7 23 12C20.5 17 16 20 12 20C8 20 3.5 17 1 12Z" stroke="#333" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="#333" stroke-width="2" fill="none"/><line x1="4" y1="4" x2="20" y2="20" stroke="#333" stroke-width="2"/></svg>`
                        : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12C3.5 7 8 4 12 4C16 4 20.5 7 23 12C20.5 17 16 20 12 20C8 20 3.5 17 1 12Z" stroke="#333" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="#333" stroke-width="2" fill="none"/></svg>`;
                });
            </script>
            </form>
        </div>
    </div>
</body>
</html> 