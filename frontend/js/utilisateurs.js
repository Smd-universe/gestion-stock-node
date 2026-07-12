const USERS_API_URL = '/api/auth/users';

// Récupérer le token JWT
function getToken() {
    return localStorage.getItem('token');
}

// Headers avec token
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

// Vérifier l'authentification
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'login.html';
        return false;
    }
    
    return JSON.parse(user);
}

// Charger les utilisateurs
async function loadUsers() {
    try {
        const response = await fetch(USERS_API_URL, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const users = await response.json();
            renderUsers(users);
        } else {
            console.error('Erreur chargement utilisateurs');
            document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="6" class="no-data">Erreur de chargement</td></tr>';
        }
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="6" class="no-data">Erreur de connexion</td></tr>';
    }
}

// Afficher les utilisateurs dans le tableau
function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">Aucun utilisateur</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.nom}</td>
            <td>${u.email}</td>
            <td><span class="statut statut-${u.role}">${u.role}</span></td>
            <td>${new Date(u.date_creation).toLocaleDateString('fr-FR')}</td>
            <td>
                <button class="btn-action btn-delete" onclick="deleteUser(${u.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

// Ouvrir le modal pour ajouter/modifier
function openUserModal() {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('userId').value = '';
    title.textContent = 'Nouvel Utilisateur';
    
    modal.classList.add('show');
}

// Supprimer un utilisateur
window.deleteUser = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
    
    try {
        const response = await fetch(`${USERS_API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (response.ok) {
            loadUsers();
        } else {
            const error = await response.json();
            alert(error.message || 'Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
};

// Gestion du formulaire utilisateur
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        nom: document.getElementById('nom').value,
        email: document.getElementById('email').value,
        mot_de_passe: document.getElementById('mot_de_passe').value,
        role: document.getElementById('role').value
    };
    
    try {
        const response = await fetch(USERS_API_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById('userModal').classList.remove('show');
            document.getElementById('userForm').reset();
            loadUsers();
        } else {
            const error = await response.json();
            alert(error.message || 'Erreur lors de la création');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur de connexion au serveur');
    }
});

// Gestion des modals
document.getElementById('addUserBtn').addEventListener('click', openUserModal);
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('userModal').classList.remove('show');
});
document.getElementById('cancelModal').addEventListener('click', () => {
    document.getElementById('userModal').classList.remove('show');
});

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

// Charger au démarrage
document.addEventListener('DOMContentLoaded', () => {
    const user = checkAuth();
    if (user) {
        document.getElementById('userName').textContent = user.nom;
    }
    loadUsers();
});
