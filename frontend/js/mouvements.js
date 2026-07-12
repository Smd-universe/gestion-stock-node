const MOUVEMENTS_API_URL = '/api/mouvements';
const PRODUITS_API_URL = '/api/produits';

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

// Charger les mouvements
async function loadMouvements() {
    try {
        const response = await fetch(MOUVEMENTS_API_URL, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const mouvements = await response.json();
            renderMouvements(mouvements);
        } else {
            console.error('Erreur chargement mouvements');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Charger les produits pour le select
async function loadProduits() {
    try {
        const response = await fetch(PRODUITS_API_URL, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const produits = await response.json();
            const select = document.getElementById('produit_id');
            select.innerHTML = '<option value="">Sélectionner un produit</option>';
            produits.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${p.nom} (Stock: ${p.quantite_stock})</option>`;
            });
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Afficher les mouvements
function renderMouvements(mouvements) {
    const tbody = document.getElementById('mouvementsTableBody');
    
    if (mouvements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">Aucun mouvement</td></tr>';
        return;
    }
    
    tbody.innerHTML = mouvements.map(m => `
        <tr>
            <td>${m.id}</td>
            <td>${new Date(m.date_mouvement).toLocaleDateString('fr-FR')}</td>
            <td>${m.produit_nom || '-'}</td>
            <td><span class="statut statut-${m.type_mouvement}">${m.type_mouvement}</span></td>
            <td>${m.quantite}</td>
            <td>
                <button class="btn-action btn-delete" onclick="deleteMouvement(${m.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

// Ouvrir le modal mouvement
function openMouvementModal() {
    const modal = document.getElementById('mouvementModal');
    document.getElementById('mouvementForm').reset();
    loadProduits();
    modal.classList.add('show');
}

// Supprimer un mouvement
window.deleteMouvement = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce mouvement ?')) return;
    
    try {
        const response = await fetch(`${MOUVEMENTS_API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (response.ok) {
            loadMouvements();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
};

// Gestion du formulaire mouvement
document.getElementById('mouvementForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        produit_id: parseInt(document.getElementById('produit_id').value),
        type_mouvement: document.getElementById('type_mouvement').value,
        quantite: parseInt(document.getElementById('quantite').value),
        motif: document.getElementById('motif').value
    };
    
    try {
        const response = await fetch(MOUVEMENTS_API_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById('mouvementModal').classList.remove('show');
            loadMouvements();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
});

// Gestion des événements
document.getElementById('addMouvementBtn').addEventListener('click', openMouvementModal);
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('mouvementModal').classList.remove('show');
});
document.getElementById('cancelModal').addEventListener('click', () => {
    document.getElementById('mouvementModal').classList.remove('show');
});

// Charger les mouvements au chargement
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.nom;
        // Afficher le menu Utilisateurs seulement pour les admins
        if (user.role === 'admin') {
            document.getElementById('usersMenuItem').style.display = 'block';
        }
    }
    loadMouvements();
});
