const ACHATS_API_URL = '/api/achats';
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

// Charger les achats
async function loadAchats() {
    try {
        const response = await fetch(ACHATS_API_URL, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const achats = await response.json();
            renderAchats(achats);
        } else {
            console.error('Erreur chargement achats');
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
            const selects = document.querySelectorAll('.produit-select');
            selects.forEach(select => {
                select.innerHTML = '<option value="">Sélectionner un produit</option>';
                produits.forEach(p => {
                    select.innerHTML += `<option value="${p.id}" data-prix="${p.prix_unitaire}" data-stock="${p.quantite_stock}">${p.nom} (Stock: ${p.quantite_stock})</option>`;
                });
            });
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Afficher les achats
function renderAchats(achats) {
    const tbody = document.getElementById('achatsTableBody');
    
    if (achats.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">Aucun achat</td></tr>';
        return;
    }
    
    tbody.innerHTML = achats.map(a => `
        <tr>
            <td>${a.id}</td>
            <td>${new Date(a.date_achat).toLocaleDateString('fr-FR')}</td>
            <td>${a.fournisseur_nom || '-'}</td>
            <td>${parseFloat(a.total).toFixed(2)} FCFA</td>
            <td><span class="statut statut-${a.statut}">${a.statut}</span></td>
            <td>
                <button class="btn-action btn-view" onclick="viewAchat(${a.id})">
                    <i data-lucide="eye"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteAchat(${a.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

// Ouvrir le modal achat
function openAchatModal() {
    const modal = document.getElementById('achatModal');
    document.getElementById('achatForm').reset();
    document.getElementById('achatDetails').innerHTML = `
        <div class="vente-detail-row">
            <select class="produit-select" required>
                <option value="">Sélectionner un produit</option>
            </select>
            <input type="number" class="detail-quantite" placeholder="Qté" min="1" required>
            <input type="number" class="detail-prix" placeholder="Prix Achat" step="0.01" required>
            <button type="button" class="btn-remove-detail" disabled>
                <i data-lucide="x"></i>
            </button>
        </div>
    `;
    updateTotal();
    loadProduits();
    modal.classList.add('show');
    lucide.createIcons();
}

// Voir les détails d'un achat
window.viewAchat = async (id) => {
    try {
        const response = await fetch(`${ACHATS_API_URL}/${id}`, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const achat = await response.json();
            const modal = document.getElementById('detailAchatModal');
            
            document.getElementById('detailAchatId').textContent = achat.id;
            document.getElementById('detailAchatDate').textContent = new Date(achat.date_achat).toLocaleDateString('fr-FR');
            document.getElementById('detailAchatFournisseur').textContent = achat.fournisseur_nom || '-';
            document.getElementById('detailAchatTotal').textContent = parseFloat(achat.total).toFixed(2) + ' FCFA';
            
            const tbody = document.getElementById('detailAchatBody');
            tbody.innerHTML = achat.details.map(d => `
                <tr>
                    <td>${d.produit_nom}</td>
                    <td>${d.quantite}</td>
                    <td>${parseFloat(d.prix_unitaire).toFixed(2)} FCFA</td>
                    <td>${parseFloat(d.sous_total).toFixed(2)} FCFA</td>
                </tr>
            `).join('');
            
            modal.classList.add('show');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
};

// Supprimer un achat
window.deleteAchat = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet achat ?')) return;
    
    try {
        const response = await fetch(`${ACHATS_API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (response.ok) {
            loadAchats();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
};

// Mettre à jour le total
function updateTotal() {
    const rows = document.querySelectorAll('.vente-detail-row');
    let total = 0;
    
    rows.forEach(row => {
        const quantite = parseFloat(row.querySelector('.detail-quantite').value) || 0;
        const prix = parseFloat(row.querySelector('.detail-prix').value) || 0;
        total += quantite * prix;
    });
    
    document.getElementById('totalAchat').textContent = total.toFixed(2) + ' FCFA';
}

// Gestion du formulaire achat
document.getElementById('achatForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rows = document.querySelectorAll('.vente-detail-row');
    const details = [];
    
    rows.forEach(row => {
        const produitId = row.querySelector('.produit-select').value;
        const quantite = parseFloat(row.querySelector('.detail-quantite').value);
        const prixUnitaire = parseFloat(row.querySelector('.detail-prix').value);
        
        if (produitId && quantite && prixUnitaire) {
            details.push({
                produit_id: parseInt(produitId),
                quantite,
                prix_unitaire: prixUnitaire
            });
        }
    });
    
    if (details.length === 0) {
        alert('Veuillez ajouter au moins un produit');
        return;
    }
    
    const data = {
        fournisseur_nom: document.getElementById('fournisseur_nom').value,
        fournisseur_email: document.getElementById('fournisseur_email').value,
        details
    };
    
    try {
        const response = await fetch(ACHATS_API_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById('achatModal').classList.remove('show');
            loadAchats();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
});

// Gestion des événements
document.getElementById('addAchatBtn').addEventListener('click', openAchatModal);
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('achatModal').classList.remove('show');
});
document.getElementById('cancelModal').addEventListener('click', () => {
    document.getElementById('achatModal').classList.remove('show');
});
document.getElementById('closeDetailModal').addEventListener('click', () => {
    document.getElementById('detailAchatModal').classList.remove('show');
});

// Ajouter une ligne de détail
document.getElementById('addDetailBtn').addEventListener('click', () => {
    const detailsContainer = document.getElementById('achatDetails');
    const newRow = document.createElement('div');
    newRow.className = 'vente-detail-row';
    newRow.innerHTML = `
        <select class="produit-select" required>
            <option value="">Sélectionner un produit</option>
        </select>
        <input type="number" class="detail-quantite" placeholder="Qté" min="1" required>
        <input type="number" class="detail-prix" placeholder="Prix Achat" step="0.01" required>
        <button type="button" class="btn-remove-detail">
            <i data-lucide="x"></i>
        </button>
    `;
    detailsContainer.appendChild(newRow);
    
    // Charger les produits dans le nouveau select
    loadProduits();
    
    // Activer le bouton de suppression
    newRow.querySelector('.btn-remove-detail').disabled = false;
    newRow.querySelector('.btn-remove-detail').addEventListener('click', () => {
        newRow.remove();
        updateTotal();
    });
    
    lucide.createIcons();
});

// Délégation d'événements pour les selects et inputs
document.getElementById('achatDetails').addEventListener('change', (e) => {
    if (e.target.classList.contains('produit-select')) {
        const select = e.target;
        const prixInput = select.parentElement.querySelector('.detail-prix');
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption.dataset.prix) {
            prixInput.value = selectedOption.dataset.prix;
        }
        updateTotal();
    }
    if (e.target.classList.contains('detail-quantite') || e.target.classList.contains('detail-prix')) {
        updateTotal();
    }
});

// Charger les achats au chargement
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('userName').textContent = user.nom;
        // Afficher le menu Utilisateurs seulement pour les admins
        if (user.role === 'admin') {
            document.getElementById('usersMenuItem').style.display = 'block';
        }
    }
    loadAchats();
});
