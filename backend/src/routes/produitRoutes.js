const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllProduits,
  getProduitById,
  createProduit,
  updateProduit,
  deleteProduit,
  updateStock
} = require('../controllers/produitController');

// Appliquer le middleware d'authentification à toutes les routes
router.use(authenticateToken);

// Routes CRUD produits
router.get('/', getAllProduits);
router.get('/:id', getProduitById);
router.post('/', createProduit);
router.put('/:id', updateProduit);
router.delete('/:id', deleteProduit);

// Route spécifique pour mise à jour du stock
router.patch('/:id/stock', updateStock);

module.exports = router;
