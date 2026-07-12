const PRODUITS_API_URL = '/api/produits';
const CATEGORIES_API_URL = '/api/categories';

let allProduits = []; // Stocker tous les produits pour l'exportation

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

// Charger les produits
async function loadProduits() {
    try {
        const response = await fetch(PRODUITS_API_URL, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            allProduits = await response.json();
            renderProduits(allProduits);
        } else {
            console.error('Erreur chargement produits');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Exporter les produits en Excel
function exportProduitsToExcel() {
    // Préparer les données pour Excel
    const excelData = allProduits.map(p => ({
        'ID': p.id,
        'Nom': p.nom,
        'Description': p.description || '-',
        'Catégorie': p.categorie_nom || '-',
        'Prix Unitaire (FCFA)': parseFloat(p.prix_unitaire).toFixed(2),
        'Quantité en Stock': p.quantite_stock,
        'Stock Minimum': p.quantite_min,
        'Statut Stock': p.quantite_stock <= p.quantite_min ? 'Bas' : 'Normal'
    }));
    
    // Créer le workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stock');
    
    // Générer le nom du fichier avec la date
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `stock_${dateStr}.xlsx`);
}

// Charger les catégories pour le select
async function loadCategories() {
    try {
        const response = await fetch(CATEGORIES_API_URL, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const categories = await response.json();
            const select = document.getElementById('categorie_id');
            select.innerHTML = '<option value="">Aucune</option>';
            categories.forEach(cat => {
                select.innerHTML += `<option value="${cat.id}">${cat.nom}</option>`;
            });
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Afficher les produits dans le tableau
function renderProduits(produits) {
    const tbody = document.getElementById('produitsTableBody');
    
    if (produits.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">Aucun produit</td></tr>';
        return;
    }
    
    tbody.innerHTML = produits.map(p => `
        <tr>
            <td>${p.id}</td>
            <td>${p.nom}</td>
            <td>${p.categorie_nom || '-'}</td>
            <td>${parseFloat(p.prix_unitaire).toFixed(2)} FCFA</td>
            <td class="${p.quantite_stock <= p.quantite_min ? 'stock-low' : ''}">${p.quantite_stock}</td>
            <td>${p.quantite_min}</td>
            <td>
                <button class="btn-action btn-edit" onclick="editProduit(${p.id})">
                    <i data-lucide="pencil"></i>
                </button>
                <button class="btn-action btn-stock" onclick="editStock(${p.id})">
                    <i data-lucide="package-plus"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteProduit(${p.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

// Ouvrir le modal pour ajouter/modifier
function openProduitModal(produit = null) {
    const modal = document.getElementById('produitModal');
    const form = document.getElementById('produitForm');
    const title = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('produitId').value = '';
    
    if (produit) {
        title.textContent = 'Modifier le Produit';
        document.getElementById('produitId').value = produit.id;
        document.getElementById('nom').value = produit.nom;
        document.getElementById('description').value = produit.description || '';
        document.getElementById('prix_unitaire').value = produit.prix_unitaire;
        document.getElementById('quantite_stock').value = produit.quantite_stock;
        document.getElementById('quantite_min').value = produit.quantite_min;
        document.getElementById('categorie_id').value = produit.categorie_id || '';
    } else {
        title.textContent = 'Nouveau Produit';
    }
    
    modal.classList.add('show');
    loadCategories();
}

// Modifier un produit
window.editProduit = async (id) => {
    try {
        const response = await fetch(`${PRODUITS_API_URL}/${id}`, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const produit = await response.json();
            openProduitModal(produit);
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
};

// Supprimer un produit
window.deleteProduit = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    try {
        const response = await fetch(`${PRODUITS_API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (response.ok) {
            loadProduits();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
};

// Modifier le stock
window.editStock = async (id) => {
    try {
        const response = await fetch(`${PRODUITS_API_URL}/${id}`, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const produit = await response.json();
            const modal = document.getElementById('stockModal');
            
            document.getElementById('stockProduitId').value = produit.id;
            document.getElementById('stockProduitNom').value = produit.nom;
            document.getElementById('stockActuel').value = produit.quantite_stock;
            document.getElementById('stockQuantite').value = '';
            document.getElementById('stockCommentaire').value = '';
            
            modal.classList.add('show');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
};

// Gestion du formulaire produit
document.getElementById('produitForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('produitId').value;
    const data = {
        nom: document.getElementById('nom').value,
        description: document.getElementById('description').value,
        prix_unitaire: parseFloat(document.getElementById('prix_unitaire').value),
        quantite_stock: parseInt(document.getElementById('quantite_stock').value) || 0,
        quantite_min: parseInt(document.getElementById('quantite_min').value) || 0,
        categorie_id: document.getElementById('categorie_id').value || null
    };
    
    try {
        const url = id ? `${PRODUITS_API_URL}/${id}` : PRODUITS_API_URL;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById('produitModal').classList.remove('show');
            loadProduits();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
});

// Gestion du formulaire stock
document.getElementById('stockForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('stockProduitId').value;
    const data = {
        quantite: parseInt(document.getElementById('stockQuantite').value),
        type: document.getElementById('stockType').value,
        commentaire: document.getElementById('stockCommentaire').value
    };
    
    try {
        const response = await fetch(`${PRODUITS_API_URL}/${id}/stock`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById('stockModal').classList.remove('show');
            loadProduits();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
});

// Gestion des modals
document.getElementById('addProduitBtn').addEventListener('click', () => openProduitModal());
document.getElementById('exportProduitsBtn').addEventListener('click', exportProduitsToExcel);
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('produitModal').classList.remove('show');
});
document.getElementById('cancelModal').addEventListener('click', () => {
    document.getElementById('produitModal').classList.remove('show');
});
document.getElementById('closeStockModal').addEventListener('click', () => {
    document.getElementById('stockModal').classList.remove('show');
});
document.getElementById('cancelStockModal').addEventListener('click', () => {
    document.getElementById('stockModal').classList.remove('show');
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
    loadProduits();
});
