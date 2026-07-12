const bcrypt = require('bcryptjs');
const { db, run, get } = require('./src/config/db');

// Configuration de l'utilisateur admin par défaut
const adminUser = {
  nom: 'Administrateur',
  email: 'admin@gestion-stock.com',
  mot_de_passe: 'Admin123!',
  role: 'admin'
};

async function seedAdmin() {
  try {
    console.log('Vérification si l\'utilisateur admin existe déjà...');
    
    // Vérifier si l'utilisateur admin existe déjà
    const existingUser = get('SELECT * FROM utilisateurs WHERE email = ?', [adminUser.email]);
    
    if (existingUser) {
      console.log('L\'utilisateur admin existe déjà avec l\'email:', adminUser.email);
      console.log('ID:', existingUser.id, 'Nom:', existingUser.nom, 'Rôle:', existingUser.role);
      process.exit(0);
    }
    
    // Hacher le mot de passe
    console.log('Hachage du mot de passe...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminUser.mot_de_passe, saltRounds);
    
    // Insérer l'utilisateur admin
    console.log('Insertion de l\'utilisateur admin...');
    run(
      'INSERT INTO utilisateurs (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)',
      [adminUser.nom, adminUser.email, hashedPassword, adminUser.role]
    );
    
    console.log('✓ Utilisateur admin créé avec succès !');
    console.log('Email:', adminUser.email);
    console.log('Mot de passe:', adminUser.mot_de_passe);
    console.log('Rôle:', adminUser.role);
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors du seed:', error.message);
    process.exit(1);
  }
}

// Attendre que la base de données soit initialisée
setTimeout(() => {
  seedAdmin();
}, 1000);
