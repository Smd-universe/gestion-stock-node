const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllCategories,
  getCategorieById,
  createCategorie,
  updateCategorie,
  deleteCategorie
} = require('../controllers/categorieController');

// Appliquer le middleware d'authentification à toutes les routes
router.use(authenticateToken);

// Routes CRUD catégories
router.get('/', getAllCategories);
router.get('/:id', getCategorieById);
router.post('/', createCategorie);
router.put('/:id', updateCategorie);
router.delete('/:id', deleteCategorie);

module.exports = router;
