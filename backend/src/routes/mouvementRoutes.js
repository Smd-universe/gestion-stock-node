const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllMouvements,
  getMouvementById,
  createMouvement,
  deleteMouvement
} = require('../controllers/mouvementController');

// Appliquer le middleware d'authentification à toutes les routes
router.use(authenticateToken);

// Routes pour les mouvements
router.get('/', getAllMouvements);
router.get('/:id', getMouvementById);
router.post('/', createMouvement);
router.delete('/:id', deleteMouvement);

module.exports = router;
