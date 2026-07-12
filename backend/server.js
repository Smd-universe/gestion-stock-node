const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const { initPromise } = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const produitRoutes = require('./src/routes/produitRoutes');
const categorieRoutes = require('./src/routes/categorieRoutes');
const venteRoutes = require('./src/routes/venteRoutes');
const achatRoutes = require('./src/routes/achatRoutes');
const mouvementRoutes = require('./src/routes/mouvementRoutes');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Routes d'authentification
app.use('/api/auth', authRoutes);

// Routes produits
app.use('/api/produits', produitRoutes);

// Routes catégories
app.use('/api/categories', categorieRoutes);

// Routes ventes
app.use('/api/ventes', venteRoutes);

// Routes achats
app.use('/api/achats', achatRoutes);

// Routes mouvements
app.use('/api/mouvements', mouvementRoutes);

// Démarrage du serveur après initialisation de la base de données
initPromise.then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT} (accessible via réseau local)`);
  });
}).catch((err) => {
  console.error('Erreur critique lors de l\'initialisation:', err);
  process.exit(1);
});

module.exports = app;
