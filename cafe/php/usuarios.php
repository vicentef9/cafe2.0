<?php
// Set headers first
header('Content-Type: application/json');

// Start session before any output
session_start();

// Include database connection
require_once 'conexion.php';

// Clear any output buffers
ob_clean();

// Verificar autenticación
if (!isset($_SESSION['usuario_id']) || $_SESSION['rol'] !== 'administrador') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$accion = $_GET['accion'] ?? '';

// Función para validar datos de usuario
function validarUsuario($datos) {
    global $accion;
    $errores = [];
    
    if (empty($datos['nombre'])) {
        $errores[] = 'El nombre es requerido';
    }
    
    if (empty($datos['apellido'])) {
        $errores[] = 'El apellido es requerido';
    }
    
    if (empty($datos['email'])) {
        $errores[] = 'El email es requerido';
    } elseif (!filter_var($datos['email'], FILTER_VALIDATE_EMAIL)) {
        $errores[] = 'El email no es válido';
    }
    
    // Si estamos creando un usuario nuevo, la contraseña es obligatoria
    if (empty($datos['password']) && $accion === 'crear') {
        $errores[] = 'La contraseña es requerida';
    } 
    
    // Siempre validar contraseña si se proporciona una, independientemente de si es creación o actualización
    if (!empty($datos['password'])) {
        // Validaciones de contraseña mejoradas
        $password = trim($datos['password']); // Eliminar espacios
        
        // Validar longitud mínima
        if (strlen($password) < 8) {
            $errores[] = 'La contraseña debe tener al menos 8 caracteres';
        }
        
        // Validar contenido de la contraseña
        if (!preg_match('/[a-z]/', $password)) {
            $errores[] = 'La contraseña debe incluir al menos una letra minúscula';
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            $errores[] = 'La contraseña debe incluir al menos una letra mayúscula';
        }
        
        if (!preg_match('/\d/', $password)) {
            $errores[] = 'La contraseña debe incluir al menos un número';
        }
        
        if (!preg_match('/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/', $password)) {
            $errores[] = 'La contraseña debe incluir al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)';
        }
        
        // Lista de contraseñas comunes
        $contrasenasComunes = [
            '123456', 'password', '123456789', '12345678', '12345', '1234567', 
            'qwerty', 'abc123', 'password123', 'admin', '123123', 'welcome',
            'letmein', 'monkey', '1234567890', 'dragon', 'trustno1', 'hello',
            'freedom', 'whatever', 'michael', 'jesus', 'superman', 'princess',
            '123abc', 'password1', 'admin123', 'guest', 'user', 'test'
        ];
        
        if (in_array(strtolower($password), $contrasenasComunes)) {
            $errores[] = 'La contraseña es muy común. Por favor, elige una contraseña más segura.';
        }
        
        // Verificar patrones inseguros
        if (preg_match('/(.)\1{2,}/', $password)) {
            $errores[] = 'La contraseña no debe contener caracteres repetidos consecutivos.';
        }
        
        if (preg_match('/123|abc|qwe|asd|zxc|987|654|321/i', $password)) {
            $errores[] = 'La contraseña no debe contener secuencias comunes como "123", "abc", "qwe", etc.';
        }
        
        // Verificar si la contraseña contiene información personal (nombre, apellido, email)
        $nombre = strtolower($datos['nombre'] ?? '');
        $apellido = strtolower($datos['apellido'] ?? '');
        $email = strtolower(explode('@', $datos['email'] ?? '')[0]);
        
        $passwordLower = strtolower($password);
        if ((strlen($nombre) > 2 && strpos($passwordLower, $nombre) !== false) ||
            (strlen($apellido) > 2 && strpos($passwordLower, $apellido) !== false) ||
            (strlen($email) > 2 && strpos($passwordLower, $email) !== false)) {
            $errores[] = 'La contraseña no debe contener información personal como nombre, apellido o email.';
        }
    }
    
    if (empty($datos['rol'])) {
        $errores[] = 'El rol es requerido';
    } elseif (!in_array($datos['rol'], ['administrador', 'empleado'])) {
        $errores[] = 'El rol no es válido';
    }
    
    return $errores;
}

// Manejar las diferentes acciones
switch ($accion) {
    case 'listar':
        try {
            $stmt = $conn->query("SELECT id, nombre, apellido, email, rol, estado FROM empleados ORDER BY id DESC");
            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $usuarios
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error al listar usuarios: ' . $e->getMessage()
            ]);
        }
        break;
        
    case 'obtener':
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                throw new Exception('ID no proporcionado');
            }

            $stmt = $conn->prepare("SELECT id, nombre, apellido, email, rol, estado FROM empleados WHERE id = ?");
            $stmt->execute([$id]);
            $usuario = $stmt->fetch();

            if (!$usuario) {
                throw new Exception('Usuario no encontrado');
            }

            echo json_encode([
                'success' => true,
                'data' => $usuario
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;
        
    case 'crear':
        $datos = $_POST;
        $errores = validarUsuario($datos);
        if (!empty($errores)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => implode(', ', $errores)]);
            exit;
        }
        try {
            // Verificar si el email ya existe
            $stmt = $conn->prepare("SELECT id FROM empleados WHERE email = ?");
            $stmt->execute([$datos['email']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El email ya está registrado']);
                exit;
            }
            // Crear nuevo usuario
            $stmt = $conn->prepare("INSERT INTO empleados (nombre, apellido, email, password, rol) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $datos['nombre'],
                $datos['apellido'],
                $datos['email'],
                password_hash($datos['password'], PASSWORD_DEFAULT),
                $datos['rol']
            ]);
            echo json_encode(['success' => true, 'message' => 'Usuario creado exitosamente']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al crear usuario']);
        }
        break;
        
    case 'actualizar':
        try {
            $id = $_POST['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID no proporcionado']);
                exit;
            }
            $datos = [
                'nombre' => $_POST['nombre'],
                'apellido' => $_POST['apellido'],
                'email' => $_POST['email'],
                'rol' => $_POST['rol'],
                'estado' => $_POST['estado'],
                'id' => $id
            ];
            // Validar contraseña si se proporciona una nueva
            if (isset($_POST['password']) && strlen($_POST['password']) > 0) {
                $datos['password'] = $_POST['password'];
                $errores = validarUsuario($datos);
                if (!empty($errores)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => implode(', ', $errores)]);
                    exit;
                }
                $sql = "UPDATE empleados SET 
                        nombre = :nombre,
                        apellido = :apellido,
                        email = :email,
                        rol = :rol,
                        estado = :estado, password = :password WHERE id = :id";
                $datos['password'] = password_hash($_POST['password'], PASSWORD_DEFAULT);
            } else {
                // No se actualiza la contraseña, pero validamos los demás datos
                $errores = validarUsuario($datos);
                if (!empty($errores)) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => implode(', ', $errores)]);
                    exit;
                }
                $sql = "UPDATE empleados SET 
                        nombre = :nombre,
                        apellido = :apellido,
                        email = :email,
                        rol = :rol,
                        estado = :estado WHERE id = :id";
            }
            $stmt = $conn->prepare($sql);
            $stmt->execute($datos);
            echo json_encode(['success' => true, 'message' => 'Usuario actualizado exitosamente']);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        break;
        
    case 'eliminar':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID no proporcionado']);
            exit;
        }
        
        try {
            $stmt = $conn->prepare("DELETE FROM empleados WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(['success' => true, 'message' => 'Usuario eliminado exitosamente']);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            }
        } catch (PDOException $e) {
            // Si es error de clave foránea, desactivar usuario
            if ($e->getCode() == '23000') {
                $stmt = $conn->prepare("UPDATE empleados SET estado = 'inactivo' WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                echo json_encode(['success' => true, 'message' => 'El usuario tiene registros asociados y fue desactivado (estado inactivo) en vez de eliminado.']);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Error al eliminar usuario: ' . $e->getMessage()]);
            }
        }
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
        break;
}
?>