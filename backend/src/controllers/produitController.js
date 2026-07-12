const { all, run, get, allWithJoin } = require('../config/db');

// Récupérer tous les produits
const getAllProduits = async (req, res) => {
  try {
    const produits = await allWithJoin(
      'produits',
      '*, categories(nom as categorie_nom)',
      null,
      { column: 'date_creation', ascending: false }
    );
    res.json(produits);
  } catch (error) {
    console.error('Erreur getAllProduits:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer un produit par ID
const getProduitById = async (req, res) => {
  try {
    const { id } = req.params;
    const produit = await allWithJoin(
      'produits',
      '*, categories(nom as categorie_nom)',
      { id }
    ).then(data => data[0]);
    
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json(produit);
  } catch (error) {
    console.error('Erreur getProduitById:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un nouveau produit
const createProduit = async (req, res) => {
  try {
    const { nom, description, prix_unitaire, quantite_stock, quantite_min, categorie_id } = req.body;
    
    if (!nom || !prix_unitaire) {
      return res.status(400).json({ message: 'Nom et prix unitaire requis' });
    }
    
    await run('produits', {
      nom,
      description: description || null,
      prix_unitaire,
      quantite_stock: quantite_stock || 0,
      quantite_min: quantite_min || 0,
      categorie_id: categorie_id || null
    });
    
    res.status(201).json({ message: 'Produit créé avec succès' });
  } catch (error) {
    console.error('Erreur createProduit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour un produit
const updateProduit = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, description, prix_unitaire, quantite_stock, quantite_min, categorie_id } = req.body;
    
    const existing = await get('produits', { id });
    if (!existing) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    await run('produits', {
      nom,
      description: description || null,
      prix_unitaire,
      quantite_stock,
      quantite_min,
      categorie_id: categorie_id || null,
      date_modification: new Date().toISOString()
    }, { id });
    
    res.json({ message: 'Produit mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur updateProduit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un produit
const deleteProduit = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await get('produits', { id });
    if (!existing) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    await run('produits', null, { id });
    
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteProduit:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le stock d'un produit
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantite, type, commentaire } = req.body;
    
    const existing = await get('produits', { id });
    if (!existing) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    const nouvelleQuantite = type === 'ajout' 
      ? existing.quantite_stock + quantite 
      : existing.quantite_stock - quantite;
    
    if (nouvelleQuantite < 0) {
      return res.status(400).json({ message: 'Stock insuffisant' });
    }
    
    await run('produits', {
      quantite_stock: nouvelleQuantite,
      date_modification: new Date().toISOString()
    }, { id });
    
    // Enregistrer le mouvement de stock
    await run('mouvements_stock', {
      produit_id: id,
      type,
      quantite,
      commentaire: commentaire || '',
      utilisateur_id: req.user?.id || null
    });
    
    res.json({ message: 'Stock mis à jour avec succès', nouvelle_quantite: nouvelleQuantite });
  } catch (error) {
    console.error('Erreur updateStock:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getAllProduits,
  getProduitById,
  createProduit,
  updateProduit,
  deleteProduit,
  updateStock
};
