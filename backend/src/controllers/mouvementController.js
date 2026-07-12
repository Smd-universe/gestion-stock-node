const { all, run, get, allWithJoin } = require('../config/db');

// Récupérer tous les mouvements
const getAllMouvements = async (req, res) => {
  try {
    const mouvements = await allWithJoin(
      'mouvements_stock',
      '*, produits(nom as produit_nom), utilisateurs(nom as utilisateur_nom)',
      null,
      { column: 'date_mouvement', ascending: false }
    );
    res.json(mouvements);
  } catch (error) {
    console.error('Erreur getAllMouvements:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer un mouvement par ID
const getMouvementById = async (req, res) => {
  try {
    const { id } = req.params;
    const mouvement = await allWithJoin(
      'mouvements_stock',
      '*, produits(nom as produit_nom), utilisateurs(nom as utilisateur_nom)',
      { id }
    ).then(data => data[0]);
    
    if (!mouvement) {
      return res.status(404).json({ message: 'Mouvement non trouvé' });
    }
    
    res.json(mouvement);
  } catch (error) {
    console.error('Erreur getMouvementById:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un nouveau mouvement
const createMouvement = async (req, res) => {
  try {
    const { produit_id, type_mouvement, quantite, motif } = req.body;
    
    if (!produit_id || !type_mouvement || !quantite) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }
    
    // Vérifier que le produit existe
    const produit = await get('produits', { id: produit_id });
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    // Calculer la nouvelle quantité selon le type de mouvement
    let nouvelleQuantite = produit.quantite_stock;
    if (type_mouvement === 'entree' || type_mouvement === 'ajustement') {
      nouvelleQuantite += quantite;
    } else if (type_mouvement === 'sortie') {
      nouvelleQuantite -= quantite;
      if (nouvelleQuantite < 0) {
        return res.status(400).json({ message: 'Stock insuffisant' });
      }
    }
    
    // Créer le mouvement
    await run('mouvements_stock', {
      produit_id,
      type: type_mouvement,
      quantite,
      commentaire: motif || '',
      utilisateur_id: req.user?.id || null
    });
    
    // Mettre à jour le stock du produit
    await run('produits', {
      quantite_stock: nouvelleQuantite,
      date_modification: new Date().toISOString()
    }, { id: produit_id });
    
    res.status(201).json({ message: 'Mouvement créé avec succès' });
  } catch (error) {
    console.error('Erreur createMouvement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un mouvement
const deleteMouvement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await get('mouvements_stock', { id });
    if (!existing) {
      return res.status(404).json({ message: 'Mouvement non trouvé' });
    }
    
    await run('mouvements_stock', null, { id });
    
    res.json({ message: 'Mouvement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteMouvement:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getAllMouvements,
  getMouvementById,
  createMouvement,
  deleteMouvement
};
