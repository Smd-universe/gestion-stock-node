const CATEGORIES_API_URL = '/api/categories';

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

// Charger les catégories
async function loadCategories() {
    try {
        const response = await fetch(CATEGORIES_API_URL, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const categories = await response.json();
            renderCategories(categories);
        } else {
            console.error('Erreur chargement catégories');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Afficher les catégories dans le tableau
function renderCategories(categories) {
    const tbody = document.getElementById('categoriesTableBody');
    
    if (categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">Aucune catégorie</td></tr>';
        return;
    }
    
    tbody.innerHTML = categories.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.nom}</td>
            <td>${c.description || '-'}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editCategorie(${c.id})">
                    <i data-lucide="pencil"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteCategorie(${c.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

// Ouvrir le modal pour ajouter/modifier
function openCategorieModal(categorie = null) {
    const modal = document.getElementById('categorieModal');
    const form = document.getElementById('categorieForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('categorieId').value = '';
    
    if (categorie) {
        title.textContent = 'Modifier la Catégorie';
        document.getElementById('categorieId').value = categorie.id;
        document.getElementById('nom').value = categorie.nom;
        document.getElementById('description').value = categorie.description || '';
    } else {
        title.textContent = 'Nouvelle Catégorie';
    }
    
    modal.classList.add('show');
}

// Modifier une catégorie
window.editCategorie = async (id) => {
    try {
        const response = await fetch(`${CATEGORIES_API_URL}/${id}`, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const categorie = await response.json();
            openCategorieModal(categorie);
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
};

// Supprimer une catégorie
window.deleteCategorie = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) return;
    
    try {
        const response = await fetch(`${CATEGORIES_API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (response.ok) {
            loadCategories();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
};

// Gestion du formulaire catégorie
document.getElementById('categorieForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('categorieId').value;
    const data = {
        nom: document.getElementById('nom').value,
        description: document.getElementById('description').value
    };
    
    try {
        const url = id ? `${CATEGORIES_API_URL}/${id}` : CATEGORIES_API_URL;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById('categorieModal').classList.remove('show');
            loadCategories();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
});

// Gestion des modals
document.getElementById('addCategorieBtn').addEventListener('click', () => openCategorieModal());
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('categorieModal').classList.remove('show');
});
document.getElementById('cancelModal').addEventListener('click', () => {
    document.getElementById('categorieModal').classList.remove('show');
});

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
});

// Charger au démarrage
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.nom;
        // Afficher le menu Utilisateurs seulement pour les admins
        if (user.role === 'admin') {
            document.getElementById('usersMenuItem').style.display = 'block';
        }
    }
    loadCategories();
});
