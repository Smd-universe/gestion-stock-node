const PRODUITS_API_URL = '/api/produits';
const VENTES_API_URL = '/api/ventes';
const ACHATS_API_URL = '/api/achats';

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

// Déconnexion
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Charger les statistiques
async function loadStats() {
    try {
        // Charger les produits
        const produitsResponse = await fetch(PRODUITS_API_URL, {
            headers: getHeaders()
        });
        
        let produits = [];
        if (produitsResponse.ok) {
            produits = await produitsResponse.json();
            
            // Total produits
            document.getElementById('totalProduits').textContent = produits.length;
            
            // Stock bas (quantité <= quantité min)
            const stockBas = produits.filter(p => p.quantite_stock <= p.quantite_min).length;
            document.getElementById('stockBas').textContent = stockBas;
        }
        
        // Charger les ventes
        const ventesResponse = await fetch(VENTES_API_URL, {
            headers: getHeaders()
        });
        
        // Charger les achats
        const achatsResponse = await fetch(ACHATS_API_URL, {
            headers: getHeaders()
        });
        
        if (ventesResponse.ok) {
            const ventes = await ventesResponse.json();
            
            // Total ventes
            document.getElementById('totalVentes').textContent = ventes.length;
            
            // Chiffre d'affaires total (Total Prix de Vente)
            const chiffreAffaires = ventes.reduce((total, v) => total + parseFloat(v.total), 0);
            document.getElementById('chiffreAffaires').textContent = chiffreAffaires.toFixed(2) + ' FCFA';
            
            // Calculer le total prix d'achat à partir des achats réels
            let totalPrixAchat = 0;
            if (achatsResponse.ok) {
                const achats = await achatsResponse.json();
                totalPrixAchat = achats.reduce((total, a) => total + parseFloat(a.total), 0);
            }
            document.getElementById('totalPrixAchat').textContent = totalPrixAchat.toFixed(2) + ' FCFA';
            
            // Marge brute (Ventes - Achat)
            const margeBrute = chiffreAffaires - totalPrixAchat;
            document.getElementById('margeBrute').textContent = margeBrute.toFixed(2) + ' FCFA';
            
            // Bénéfice net (Marge brute - Taxes)
            const tauxTaxe = 0.18; // 18% TVA par exemple
            const taxes = chiffreAffaires * tauxTaxe;
            const beneficeNet = margeBrute - taxes;
            document.getElementById('beneficeNet').textContent = beneficeNet.toFixed(2) + ' FCFA';
        }
    } catch (error) {
        console.error('Erreur chargement statistiques:', error);
    }
}

// Initialiser le dashboard
function initDashboard() {
    const user = checkAuth();
    
    if (user) {
        document.getElementById('userName').textContent = user.nom;
        document.getElementById('userRole').textContent = user.role;
        
        // Afficher le menu Utilisateurs seulement pour les admins
        if (user.role === 'admin') {
            document.getElementById('usersMenuItem').style.display = 'block';
        }
    }
    
    // Charger les statistiques
    loadStats();
    
    // Gérer la déconnexion
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

// Charger au démarrage
document.addEventListener('DOMContentLoaded', initDashboard);
