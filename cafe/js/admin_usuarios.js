// Cargar usuarios al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - inicializando filtros y eventos');
    
    // Inicializar elementos de filtro
    const searchInput = document.getElementById('searchInput');
    const filterRole = document.getElementById('filterRole');
    const filterStatus = document.getElementById('filterStatus');
    
    // Debug de elementos encontrados
    console.log('Elementos de filtro:', {
        searchInput: searchInput ? 'encontrado' : 'no encontrado',
        filterRole: filterRole ? 'encontrado' : 'no encontrado',
        filterStatus: filterStatus ? 'encontrado' : 'no encontrado'
    });
    
    // Cargar usuarios iniciales
    cargarUsuarios();
    
    // Agregar event listener para el formulario
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', function(event) {
            event.preventDefault();
            guardarUsuario();
        });
    }
    
    // Agregar event listener para el campo de contraseña
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.addEventListener('input', function(e) {
            updatePasswordStrength(e.target.value);
        });
    }
    
    // Aplicar filtros al presionar Enter en el campo de búsqueda
    if (searchInput) {
        console.log('Configurando evento keypress para searchInput');
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('Tecla Enter presionada en búsqueda');
                filtrarUsuarios();
            }
        });
    }
    
    // Aplicar filtros automáticamente al cambiar selects
    if (filterRole) {
        console.log('Configurando evento change para filterRole');
        filterRole.addEventListener('change', function() {
            console.log('Cambio en selector de rol:', filterRole.value);
            filtrarUsuarios();
        });
    }
    
    if (filterStatus) {
        console.log('Configurando evento change para filterStatus');
        filterStatus.addEventListener('change', function() {
            console.log('Cambio en selector de estado:', filterStatus.value);
            filtrarUsuarios();
        });
    }
    
    // Asegurar que el botón de búsqueda tenga el evento de click
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
        console.log('Configurando evento click para botón de búsqueda');
        searchButton.addEventListener('click', function() {
            console.log('Botón de búsqueda clickeado');
            filtrarUsuarios();
        });
    }
});

function mostrarFormulario() {
    document.getElementById('modalTitle').textContent = 'Agregar Usuario';
    document.getElementById('userForm').reset();
    document.getElementById('usuario_id').value = ''; // Limpiar ID para nuevo usuario
    
    const passwordField = document.getElementById('password');
    passwordField.setAttribute('required', 'required'); // Contraseña requerida al crear
    passwordField.placeholder = 'Mínimo 8 caracteres (requerido)';
    
    // Limpiar indicador de fortaleza de contraseña
    const strengthContainer = document.getElementById('password-strength');
    if (strengthContainer) {
        strengthContainer.style.display = 'none';
    }
    
    // Resetear los indicadores de requisitos
    const requirements = ['req-length', 'req-lowercase', 'req-uppercase', 'req-number', 'req-special', 'req-common'];
    requirements.forEach(id => {
        updateRequirement(id, false);
    });
    
    document.getElementById('userModal').style.display = 'block';
}

function cerrarModal() {
    document.getElementById('userModal').style.display = 'none';
}

// Función para cargar la lista de usuarios
async function cargarUsuarios(params = {}) {
    try {
        // Construir URL con parámetros de filtro
        let url = '../../php/usuarios.php?accion=listar';
        
        if (params.busqueda) url += `&busqueda=${encodeURIComponent(params.busqueda)}`;
        if (params.rol) url += `&rol=${encodeURIComponent(params.rol)}`;
        if (params.estado) url += `&estado=${encodeURIComponent(params.estado)}`;
        
        // Añadir un parámetro aleatorio para evitar caché
        url += `&nocache=${Date.now()}`;
        
        console.log('Cargando usuarios con URL:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        // Debug the raw response
        const rawText = await response.text();
        console.log('Raw response:', rawText);
        
        // Try parsing the response
        let result;
        try {
            result = JSON.parse(rawText);
        } catch (e) {
            console.error('JSON parse error:', e);
            console.log('Response that failed to parse:', rawText);
            throw new Error('Invalid JSON response from server');
        }

        if (!result.success) {
            throw new Error(result.message || 'Error desconocido');
        }

        const empleadosTableBody = document.getElementById('empleadosTableBody');
        empleadosTableBody.innerHTML = '';
        
        // Mostrar mensaje si no hay resultados
        if (result.data.length === 0) {
            empleadosTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-results">No se encontraron usuarios con los filtros seleccionados</td>
                </tr>
            `;
            return;
        }

        result.data.forEach(usuario => {
            const estadoClass = usuario.estado === 'activo' ? 'activo' : 'inactivo';
            const rowClass = usuario.estado === 'inactivo' ? 'usuario-inactivo' : '';
            empleadosTableBody.innerHTML += `
                <tr class="${rowClass}">
                    <td>${usuario.id}</td>
                    <td>${usuario.nombre}</td>
                    <td>${usuario.apellido}</td>
                    <td>${usuario.email}</td>
                    <td>${usuario.rol}</td>
                    <td><span class="status ${estadoClass}">${usuario.estado}</span></td>
                    <td>
                        <button class="action-button edit" onclick="editarUsuario(${usuario.id})">Editar</button>
                        <button class="action-button delete" onclick="eliminarUsuario(${usuario.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        alert('Error al cargar la lista de usuarios: ' + error.message);
    }
}

// Función para filtrar usuarios según los criterios seleccionados
function filtrarUsuarios() {
    // Obtener valores de los filtros
    const busqueda = document.getElementById('searchInput').value.trim();
    
    // Asegurarnos de obtener los elementos correctamente
    const rolElement = document.getElementById('filterRole');
    const estadoElement = document.getElementById('filterStatus');
    
    // Obtener valores o valores predeterminados si los elementos no existen
    const rol = rolElement ? rolElement.value : '';
    const estado = estadoElement ? estadoElement.value : '';
    
    console.log('Filtrando con parámetros:', { busqueda, rol, estado });
    
    // Llamar a cargarUsuarios con los parámetros de filtro
    cargarUsuarios({ 
        busqueda: busqueda, 
        rol: rol, 
        estado: estado 
    });
}

// Función para guardar o actualizar un usuario
async function guardarUsuario() {
    try {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        const usuarioId = document.getElementById('usuario_id').value;
        const password = document.getElementById('password').value;
        
        // Validar contraseña fuerte solo si se está creando usuario o si se está editando y se ingresó una nueva contraseña
        function esContrasenaFuerte(pwd) {
            const errores = [];
            
            if (pwd.length < 8) errores.push('La contraseña debe tener al menos 8 caracteres');
            if (!/[a-z]/.test(pwd)) errores.push('Debe incluir al menos una letra minúscula');
            if (!/[A-Z]/.test(pwd)) errores.push('Debe incluir al menos una letra mayúscula');
            if (!/\d/.test(pwd)) errores.push('Debe incluir al menos un número');
            if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) errores.push('Debe incluir al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)');
            
            if (typeof commonPasswords !== 'undefined' && commonPasswords && commonPasswords.includes(pwd.toLowerCase())) {
                errores.push('La contraseña es muy común. Por favor, elige una contraseña más segura');
            }
            
            if (/(.)\1{2,}/.test(pwd)) errores.push('No debe contener caracteres repetidos consecutivos (ej: aaa, 111)');
            if (/123|abc|qwe|asd|zxc|987|654|321/i.test(pwd)) errores.push('No debe contener secuencias comunes como "123", "abc", etc.');
            
            // Si la contraseña tiene entre 8 y 12 caracteres, es una advertencia, no un error
            if (pwd.length >= 8 && pwd.length < 12) console.warn('Contraseña aceptable, pero se recomienda usar al menos 12 caracteres');
            
            return errores.length > 0 ? errores.join('. ') : '';
        }
        
        // Para nueva creación, la contraseña siempre debe validarse
        // Para edición, solo validar si se proporciona una contraseña
        if (usuarioId === '' || password.length > 0) {
            const mensaje = esContrasenaFuerte(password);
            if (mensaje) {
                alert(mensaje);
                return false;
            }
        }
        
        const url = `../../php/usuarios.php?accion=${usuarioId ? 'actualizar' : 'crear'}`;
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        // Manejo seguro del JSON de respuesta
        let result;
        try {
            const rawText = await response.text();
            console.log('Respuesta del servidor:', rawText); // Debug
            result = JSON.parse(rawText);
        } catch (e) {
            console.error('Error al procesar respuesta del servidor:', e);
            throw new Error('Error en la respuesta del servidor');
        }
        
        if (!result.success) {
            throw new Error(result.message || 'Error al guardar usuario');
        }
        
        alert(usuarioId ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        cerrarModal();
        form.reset();
        await cargarUsuarios();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar usuario: ' + error.message);
    }
}

// Función para cargar datos de usuario en el modal de edición
async function editarUsuario(id) {
    try {
        const response = await fetch(`../../php/usuarios.php?accion=obtener&id=${id}`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Error al obtener usuario');
        }

        const usuario = result.data;
        
        document.getElementById('modalTitle').textContent = 'Editar Usuario';
        document.getElementById('usuario_id').value = usuario.id;
        document.getElementById('nombre').value = usuario.nombre;
        document.getElementById('apellido').value = usuario.apellido;
        document.getElementById('email').value = usuario.email;
        
        const passwordField = document.getElementById('password');
        passwordField.value = ''; // Limpiar campo de contraseña
        passwordField.removeAttribute('required'); // Contraseña opcional al editar
        passwordField.placeholder = 'Dejar vacío para mantener contraseña actual';
        
        document.getElementById('rol').value = usuario.rol === 'admin' ? 'administrador' : usuario.rol;
        document.getElementById('estado').value = usuario.estado;
        
        // Limpiar indicador de fortaleza de contraseña
        const strengthContainer = document.getElementById('password-strength');
        if (strengthContainer) {
            strengthContainer.style.display = 'none';
        }
        
        // Resetear los indicadores de requisitos
        const requirements = ['req-length', 'req-lowercase', 'req-uppercase', 'req-number', 'req-special', 'req-common'];
        requirements.forEach(id => {
            updateRequirement(id, false);
        });
        
        document.getElementById('userModal').style.display = 'block';
    } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
        alert('Error al cargar los datos del usuario: ' + error.message);
    }
}

// Función para eliminar un usuario
async function eliminarUsuario(id) {
    if (!confirm('¿Está seguro de que desea eliminar este usuario?')) {
        return;
    }
    
    try {
        // Usar GET para eliminar, ya que el backend espera GET
        const response = await fetch(`../../php/usuarios.php?accion=eliminar&id=${id}`);
        const resultado = await response.json();
        
        if (resultado.success || resultado.exito) {
            alert('Usuario eliminado exitosamente');
            cargarUsuarios();
        } else {
            // Mostrar mensaje exacto del backend
            alert('Error al eliminar usuario: ' + (resultado.message || resultado.mensaje || JSON.stringify(resultado)));
        }
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert('Error al eliminar el usuario');
    }
}

// ===============================
// FUNCIONES DE VALIDACIÓN DE CONTRASEÑA
// ===============================

// Lista de contraseñas comunes a evitar
const commonPasswords = [
    '123456', 'password', '123456789', '12345678', '12345', '1234567', 
    'qwerty', 'abc123', 'password123', 'admin', '123123', 'welcome',
    'letmein', 'monkey', '1234567890', 'dragon', 'trustno1', 'hello',
    'freedom', 'whatever', 'michael', 'jesus', 'superman', 'princess',
    '123abc', 'password1', 'admin123', 'guest', 'user', 'test'
];

// Función para validar la fortaleza de la contraseña
function validatePasswordStrength(password) {
    const requirements = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
        common: !commonPasswords.includes(password.toLowerCase())
    };

    // Calcular puntuación de fortaleza
    let score = 0;
    if (requirements.length) score += 20;
    if (requirements.lowercase) score += 15;
    if (requirements.uppercase) score += 15;
    if (requirements.number) score += 15;
    if (requirements.special) score += 20;
    if (requirements.common) score += 15;

    // Bonificaciones por longitud extra
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    return { requirements, score };
}

// Función para actualizar el indicador visual
function updatePasswordStrength(password) {
    const strengthContainer = document.getElementById('password-strength');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');

    if (!strengthContainer || !strengthFill || !strengthText) {
        return; // Los elementos no existen
    }

    if (password.length === 0) {
        strengthContainer.style.display = 'none';
        return;
    }

    strengthContainer.style.display = 'block';
    const { requirements, score } = validatePasswordStrength(password);

    // Actualizar barra de fortaleza
    let strengthLevel = '';
    let color = '';
    
    if (score < 40) {
        strengthLevel = 'Muy débil';
        color = '#ff4444';
    } else if (score < 60) {
        strengthLevel = 'Débil';
        color = '#ff8800';
    } else if (score < 80) {
        strengthLevel = 'Media';
        color = '#ffaa00';
    } else if (score < 95) {
        strengthLevel = 'Fuerte';
        color = '#88cc00';
    } else {
        strengthLevel = 'Muy fuerte';
        color = '#00cc44';
    }

    strengthFill.style.width = score + '%';
    strengthFill.style.backgroundColor = color;
    strengthText.textContent = strengthLevel;
    strengthText.style.color = color;

    // Actualizar requisitos
    updateRequirement('req-length', requirements.length);
    updateRequirement('req-lowercase', requirements.lowercase);
    updateRequirement('req-uppercase', requirements.uppercase);
    updateRequirement('req-number', requirements.number);
    updateRequirement('req-special', requirements.special);
    updateRequirement('req-common', requirements.common);
}

function updateRequirement(id, met) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const icon = element.querySelector('.req-icon');
    
    if (met) {
        element.classList.add('met');
        if (icon) {
            icon.textContent = '✓';
            icon.style.color = '#00cc44';
        }
    } else {
        element.classList.remove('met');
        if (icon) {
            icon.textContent = '✗';
            icon.style.color = '#ff4444';
        }
    }
}