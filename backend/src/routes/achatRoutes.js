const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllAchats,
  getAchatById,
  createAchat,
  updateAchatStatut,
  deleteAchat
} = require('../controllers/achatController');

// Appliquer le middleware d'authentification à toutes les routes
router.use(authenticateToken);

// Routes pour les achats
router.get('/', getAllAchats);
router.get('/:id', getAchatById);
router.post('/', createAchat);
router.put('/:id/statut', updateAchatStatut);
router.delete('/:id', deleteAchat);

module.exports = router;
