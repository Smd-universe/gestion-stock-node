const { all, run, get } = require('../config/db');

// Récupérer toutes les catégories
const getAllCategories = async (req, res) => {
  try {
    const categories = await all('categories', null, { column: 'nom', ascending: true });
    res.json(categories);
  } catch (error) {
    console.error('Erreur getAllCategories:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer une catégorie par ID
const getCategorieById = async (req, res) => {
  try {
    const { id } = req.params;
    const categorie = await get('categories', { id });
    
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    res.json(categorie);
  } catch (error) {
    console.error('Erreur getCategorieById:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer une nouvelle catégorie
const createCategorie = async (req, res) => {
  try {
    const { nom, description } = req.body;
    
    if (!nom) {
      return res.status(400).json({ message: 'Nom requis' });
    }
    
    await run('categories', {
      nom,
      description: description || null
    });
    
    res.status(201).json({ message: 'Catégorie créée avec succès' });
  } catch (error) {
    console.error('Erreur createCategorie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour une catégorie
const updateCategorie = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description } = req.body;
    
    const existing = await get('categories', { id });
    if (!existing) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    await run('categories', {
      nom,
      description: description || null
    }, { id });
    
    res.json({ message: 'Catégorie mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur updateCategorie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer une catégorie
const deleteCategorie = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await get('categories', { id });
    if (!existing) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    await run('categories', null, { id });
    
    res.json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    console.error('Erreur deleteCategorie:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getAllCategories,
  getCategorieById,
  createCategorie,
  updateCategorie,
  deleteCategorie
};
