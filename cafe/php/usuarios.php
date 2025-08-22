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
    
    if (empty($datos['password']) && $accion === 'crear') {
        $errores[] = 'La contraseña es requerida';
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
            echo json_encode(['exito' => false, 'mensaje' => implode(', ', $errores)]);
            exit;
        }
        
        try {
            // Verificar si el email ya existe
            $stmt = $conn->prepare("SELECT id FROM empleados WHERE email = ?");
            $stmt->execute([$datos['email']]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['exito' => false, 'mensaje' => 'El email ya está registrado']);
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
            
            echo json_encode(['exito' => true, 'mensaje' => 'Usuario creado exitosamente']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['exito' => false, 'mensaje' => 'Error al crear usuario']);
        }
        break;
        
    case 'actualizar':
        try {
            $id = $_POST['id'] ?? null;
            if (!$id) {
                throw new Exception('ID no proporcionado');
            }

            $datos = [
                'nombre' => $_POST['nombre'],
                'apellido' => $_POST['apellido'],
                'email' => $_POST['email'],
                'rol' => $_POST['rol'],
                'estado' => $_POST['estado'],
                'id' => $id
            ];

            $errores = validarUsuario($datos);
            if (!empty($errores)) {
                throw new Exception(implode(', ', $errores));
            }

            $sql = "UPDATE empleados SET 
                    nombre = :nombre,
                    apellido = :apellido,
                    email = :email,
                    rol = :rol,
                    estado = :estado";

            // Agregar actualización de contraseña solo si se proporciona una nueva
            if (!empty($_POST['password'])) {
                $sql .= ", password = :password";
                $datos['password'] = password_hash($_POST['password'], PASSWORD_DEFAULT);
            }

            $sql .= " WHERE id = :id";

            $stmt = $conn->prepare($sql);
            $stmt->execute($datos);

            echo json_encode([
                'success' => true,
                'message' => 'Usuario actualizado exitosamente'
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;
        
    case 'eliminar':
        if (!isset($_GET['id'])) {
            http_response_code(400);
            echo json_encode(['exito' => false, 'mensaje' => 'ID no proporcionado']);
            exit;
        }
        
        try {
            $stmt = $conn->prepare("DELETE FROM empleados WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode(['exito' => true, 'mensaje' => 'Usuario eliminado exitosamente']);
            } else {
                http_response_code(404);
                echo json_encode(['exito' => false, 'mensaje' => 'Usuario no encontrado']);
            }
        } catch (PDOException $e) {
            // Si es error de clave foránea, desactivar usuario
            if ($e->getCode() == '23000') {
                $stmt = $conn->prepare("UPDATE empleados SET estado = 'inactivo' WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                echo json_encode(['exito' => true, 'mensaje' => 'El usuario tiene registros asociados y fue desactivado (estado inactivo) en vez de eliminado.']);
            } else {
                http_response_code(500);
                echo json_encode(['exito' => false, 'mensaje' => 'Error al eliminar usuario: ' . $e->getMessage()]);
            }
        }
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['exito' => false, 'mensaje' => 'Acción no válida']);
        break;
}
?>