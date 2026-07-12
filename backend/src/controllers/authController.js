const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { get } = require('../config/db');

// Connexion utilisateur
const login = async (req, res) => {
  try {
    console.log('=== DEBUG LOGIN ===');
    console.log('Body reçu:', req.body);
    console.log('nom_utilisateur:', req.body.nom_utilisateur);
    console.log('password:', req.body.password ? '***' : 'undefined');
    console.log('==================');
    
    const { nom_utilisateur, password } = req.body;

    // Validation
    if (!nom_utilisateur || !password) {
      return res.status(400).json({ message: 'Identifiant et mot de passe requis' });
    }

    // Rechercher l'utilisateur par nom_utilisateur
    const user = await get('utilisateurs', { nom_utilisateur });

    if (!user) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe (comparaison texte brut pour le moment)
    const isMatch = password === user.mot_de_passe;

    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    // Créer le token JWT
    const token = jwt.sign(
      { id: user.id, nom_utilisateur: user.nom_utilisateur, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        nom_utilisateur: user.nom_utilisateur,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = { login };
