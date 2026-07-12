const AUTH_API_URL = '/api/auth/login';

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');

// Vérifier si l'utilisateur est déjà connecté
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        window.location.href = 'dashboard.html';
    }
}

// Afficher un message d'erreur
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        setTimeout(() => {
            errorMessage.classList.remove('show');
        }, 5000);
    }
}

// Gérer la connexion
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nom_utilisateur = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Désactiver le bouton pendant la requête
        loginBtn.disabled = true;
        loginBtn.textContent = 'Connexion en cours...';
        
        try {
            const response = await fetch(AUTH_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nom_utilisateur, password })
        });
        
        const data = await response.json();
        
            if (response.ok) {
                // Stocker le token et les informations utilisateur
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Rediriger vers le dashboard
                window.location.href = 'dashboard.html';
            } else {
                showError(data.message || 'Erreur de connexion');
            }
        } catch (error) {
            showError('Erreur de connexion au serveur');
            console.error('Erreur:', error);
        } finally {
            // Réactiver le bouton
            loginBtn.disabled = false;
            loginBtn.textContent = 'Se connecter';
        }
    });
}

// Vérifier l'authentification au chargement de la page
if (loginForm) {
    checkAuth();
}
