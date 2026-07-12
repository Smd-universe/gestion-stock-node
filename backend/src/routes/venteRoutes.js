const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllVentes,
  getVenteById,
  createVente,
  updateVenteStatut,
  deleteVente
} = require('../controllers/venteController');

// Appliquer le middleware d'authentification à toutes les routes
router.use(authenticateToken);

// Routes CRUD ventes
router.get('/', getAllVentes);
router.get('/:id', getVenteById);
router.post('/', createVente);
router.patch('/:id/statut', updateVenteStatut);
router.delete('/:id', deleteVente);

module.exports = router;
