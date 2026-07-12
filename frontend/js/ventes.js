const VENTES_API_URL = '/api/ventes';
const PRODUITS_API_URL = '/api/produits';

let allVentes = []; // Stocker toutes les ventes pour le filtrage

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

// Charger les ventes
async function loadVentes() {
    try {
        const response = await fetch(VENTES_API_URL, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            allVentes = await response.json();
            filterAndRenderVentes();
        } else {
            console.error('Erreur chargement ventes');
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Filtrer et afficher les ventes
function filterAndRenderVentes() {
    const dateDebut = document.getElementById('dateDebut').value;
    const dateFin = document.getElementById('dateFin').value;
    
    let filteredVentes = [...allVentes];
    
    if (dateDebut) {
        filteredVentes = filteredVentes.filter(v => new Date(v.date_vente) >= new Date(dateDebut));
    }
    
    if (dateFin) {
        filteredVentes = filteredVentes.filter(v => new Date(v.date_vente) <= new Date(dateFin + 'T23:59:59'));
    }
    
    renderVentes(filteredVentes);
}

// Exporter les ventes en Excel
function exportVentesToExcel() {
    const dateDebut = document.getElementById('dateDebut').value;
    const dateFin = document.getElementById('dateFin').value;
    
    let filteredVentes = [...allVentes];
    
    if (dateDebut) {
        filteredVentes = filteredVentes.filter(v => new Date(v.date_vente) >= new Date(dateDebut));
    }
    
    if (dateFin) {
        filteredVentes = filteredVentes.filter(v => new Date(v.date_vente) <= new Date(dateFin + 'T23:59:59'));
    }
    
    // Préparer les données pour Excel
    const excelData = filteredVentes.map(v => ({
        'ID': v.id,
        'Date': new Date(v.date_vente).toLocaleDateString('fr-FR'),
        'Client': v.client_nom || '-',
        'Email Client': v.client_email || '-',
        'Total (FCFA)': parseFloat(v.total).toFixed(2),
        'Statut': v.statut
    }));
    
    // Créer le workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventes');
    
    // Générer le nom du fichier avec la date
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `ventes_${dateStr}.xlsx`);
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

// Afficher les ventes dans le tableau
function renderVentes(ventes) {
    const tbody = document.getElementById('ventesTableBody');
    
    if (ventes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">Aucune vente</td></tr>';
        return;
    }
    
    tbody.innerHTML = ventes.map(v => `
        <tr>
            <td>${v.id}</td>
            <td>${new Date(v.date_vente).toLocaleDateString('fr-FR')}</td>
            <td>${v.client_nom || '-'}</td>
            <td>${parseFloat(v.total).toFixed(2)} FCFA</td>
            <td><span class="statut statut-${v.statut}">${v.statut}</span></td>
            <td>
                <button class="btn-action btn-view" onclick="viewVente(${v.id})">
                    <i data-lucide="eye"></i>
                </button>
                <button class="btn-action btn-delete" onclick="deleteVente(${v.id})">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    lucide.createIcons();
}

// Ouvrir le modal nouvelle vente
function openVenteModal() {
    const modal = document.getElementById('venteModal');
    const form = document.getElementById('venteForm');
    
    form.reset();
    document.getElementById('venteDetails').innerHTML = `
        <div class="vente-detail-row">
            <select class="produit-select" required>
                <option value="">Sélectionner un produit</option>
            </select>
            <input type="number" class="detail-quantite" placeholder="Qté" min="1" required>
            <input type="number" class="detail-prix" placeholder="Prix" step="0.01" required>
            <button type="button" class="btn-remove-detail" disabled>×</button>
        </div>
    `;
    updateTotal();
    loadProduits();
    modal.classList.add('show');
}

// Voir les détails d'une vente
window.viewVente = async (id) => {
    try {
        const response = await fetch(`${VENTES_API_URL}/${id}`, {
            headers: getHeaders()
        });
        
        if (response.ok) {
            const vente = await response.json();
            const modal = document.getElementById('detailVenteModal');
            
            document.getElementById('detailVenteId').textContent = vente.id;
            document.getElementById('detailVenteDate').textContent = new Date(vente.date_vente).toLocaleDateString('fr-FR');
            document.getElementById('detailVenteClient').textContent = vente.client_nom || '-';
            document.getElementById('detailVenteTotal').textContent = parseFloat(vente.total).toFixed(2) + ' FCFA';
            
            const tbody = document.getElementById('detailVenteBody');
            tbody.innerHTML = vente.details.map(d => `
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

// Supprimer une vente
window.deleteVente = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) return;
    
    try {
        const response = await fetch(`${VENTES_API_URL}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (response.ok) {
            loadVentes();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
};

// Ajouter une ligne de détail
document.getElementById('addDetailBtn').addEventListener('click', () => {
    const container = document.getElementById('venteDetails');
    const newRow = document.createElement('div');
    newRow.className = 'vente-detail-row';
    newRow.innerHTML = `
        <select class="produit-select" required>
            <option value="">Sélectionner un produit</option>
        </select>
        <input type="number" class="detail-quantite" placeholder="Qté" min="1" required>
        <input type="number" class="detail-prix" placeholder="Prix" step="0.01" required>
        <button type="button" class="btn-remove-detail">×</button>
    `;
    container.appendChild(newRow);
    
    // Copier les options des produits
    const firstSelect = container.querySelector('.produit-select');
    const newSelect = newRow.querySelector('.produit-select');
    newSelect.innerHTML = firstSelect.innerHTML;
    
    // Attacher les événements
    attachDetailEvents(newRow);
});

// Attacher les événements à une ligne de détail
function attachDetailEvents(row) {
    const select = row.querySelector('.produit-select');
    const quantite = row.querySelector('.detail-quantite');
    const prix = row.querySelector('.detail-prix');
    const removeBtn = row.querySelector('.btn-remove-detail');
    
    select.addEventListener('change', () => {
        const selectedOption = select.options[select.selectedIndex];
        if (selectedOption.dataset.prix) {
            prix.value = selectedOption.dataset.prix;
        }
        updateTotal();
    });
    
    quantite.addEventListener('input', updateTotal);
    prix.addEventListener('input', updateTotal);
    
    removeBtn.addEventListener('click', () => {
        const container = document.getElementById('venteDetails');
        if (container.children.length > 1) {
            row.remove();
            updateTotal();
        }
    });
}

// Calculer le total
function updateTotal() {
    const rows = document.querySelectorAll('.vente-detail-row');
    let total = 0;
    
    rows.forEach(row => {
        const quantite = parseFloat(row.querySelector('.detail-quantite').value) || 0;
        const prix = parseFloat(row.querySelector('.detail-prix').value) || 0;
        total += quantite * prix;
    });
    
    document.getElementById('totalVente').textContent = total.toFixed(2) + ' FCFA';
}

// Gestion du formulaire vente
document.getElementById('venteForm').addEventListener('submit', async (e) => {
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
        client_nom: document.getElementById('client_nom').value,
        client_email: document.getElementById('client_email').value,
        details
    };
    
    try {
        const response = await fetch(VENTES_API_URL, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            document.getElementById('venteModal').classList.remove('show');
            loadVentes();
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
});

// Gestion des modals
document.getElementById('addVenteBtn').addEventListener('click', openVenteModal);
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('venteModal').classList.remove('show');
});
document.getElementById('cancelModal').addEventListener('click', () => {
    document.getElementById('venteModal').classList.remove('show');
});
document.getElementById('closeDetailModal').addEventListener('click', () => {
    document.getElementById('detailVenteModal').classList.remove('show');
});

// Gestion des filtres de date
document.getElementById('dateDebut').addEventListener('change', filterAndRenderVentes);
document.getElementById('dateFin').addEventListener('change', filterAndRenderVentes);
document.getElementById('resetFiltersBtn').addEventListener('click', () => {
    document.getElementById('dateDebut').value = '';
    document.getElementById('dateFin').value = '';
    filterAndRenderVentes();
});

// Gestion de l'exportation Excel
document.getElementById('exportVentesBtn').addEventListener('click', exportVentesToExcel);

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
    
    // Attacher les événements à la première ligne
    const firstRow = document.querySelector('.vente-detail-row');
    if (firstRow) {
        attachDetailEvents(firstRow);
    }
    
    loadVentes();
});
