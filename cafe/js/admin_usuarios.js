// Cargar usuarios al iniciar la página
<<<<<<< HEAD
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
=======
document.addEventListener('DOMContentLoaded', cargarUsuarios);
document.getElementById('userForm').addEventListener('submit', function(event) {
    event.preventDefault();
    guardarUsuario();
>>>>>>> b9729e4c713ec999d6c564eb1015acca499e346e
});

function mostrarFormulario() {
    document.getElementById('modalTitle').textContent = 'Agregar Usuario';
    document.getElementById('userForm').reset();
    document.getElementById('usuario_id').value = ''; // Limpiar ID para nuevo usuario
    document.getElementById('password').setAttribute('required', 'required'); // Contraseña requerida al crear
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

        const url = `../../php/usuarios.php?accion=${usuarioId ? 'actualizar' : 'crear'}`;
        
        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (!result.success && !result.exito) {
            throw new Error(result.message || result.mensaje || 'Error al guardar usuario');
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
        document.getElementById('password').removeAttribute('required'); // Contraseña opcional al editar
        document.getElementById('rol').value = usuario.rol === 'admin' ? 'administrador' : usuario.rol;
        document.getElementById('estado').value = usuario.estado;
        
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