const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { getUsers, createUser, deleteUser } = require('../controllers/userController');

// Route de connexion
router.post('/login', login);

// Routes de gestion des utilisateurs (réservées aux admins)
router.get('/users', authenticateToken, requireAdmin, getUsers);
router.post('/users', authenticateToken, requireAdmin, createUser);
router.delete('/users/:id', authenticateToken, requireAdmin, deleteUser);

module.exports = router;
