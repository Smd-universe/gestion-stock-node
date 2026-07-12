const bcrypt = require('bcrypt');
const { all, run, get } = require('../config/db');

// Récupérer tous les utilisateurs
async function getUsers(req, res) {
  try {
    const users = await all('utilisateurs', null, { column: 'date_creation', ascending: false });
    // Exclure le mot de passe de la réponse
    const usersWithoutPassword = users.map(u => ({
      id: u.id,
      nom: u.nom,
      email: u.email,
      role: u.role,
      date_creation: u.date_creation
    }));
    res.json(usersWithoutPassword);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
  }
}

// Créer un nouvel utilisateur
async function createUser(req, res) {
  try {
    const { nom, email, mot_de_passe, role } = req.body;

    // Validation
    if (!nom || !email || !mot_de_passe || !role) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await get('utilisateurs', { email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

    // Insérer l'utilisateur
    await run('utilisateurs', {
      nom,
      email,
      mot_de_passe: hashedPassword,
      role
    });

    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur' });
  }
}

// Supprimer un utilisateur
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    // Vérifier si l'utilisateur existe
    const user = await get('utilisateurs', { id });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher la suppression de soi-même
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Supprimer l'utilisateur
    await run('utilisateurs', null, { id });

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur' });
  }
}

module.exports = {
  getUsers,
  createUser,
  deleteUser
};
