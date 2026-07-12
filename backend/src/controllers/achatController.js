const { all, run, get, allWithJoin } = require('../config/db');

// Récupérer tous les achats
const getAllAchats = async (req, res) => {
  try {
    const achats = await allWithJoin(
      'achats',
      '*, utilisateurs(nom as utilisateur_nom)',
      null,
      { column: 'date_achat', ascending: false }
    );
    res.json(achats);
  } catch (error) {
    console.error('Erreur getAllAchats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer un achat par ID avec détails
const getAchatById = async (req, res) => {
  try {
    const { id } = req.params;
    const achat = await allWithJoin(
      'achats',
      '*, utilisateurs(nom as utilisateur_nom)',
      { id }
    ).then(data => data[0]);
    
    if (!achat) {
      return res.status(404).json({ message: 'Achat non trouvé' });
    }
    
    // Récupérer les détails de l'achat
    const details = await allWithJoin(
      'details_achat',
      '*, produits(nom as produit_nom)',
      { achat_id }
    );
    
    res.json({ ...achat, details });
  } catch (error) {
    console.error('Erreur getAchatById:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer un nouvel achat
const createAchat = async (req, res) => {
  try {
    const { fournisseur_nom, fournisseur_email, details } = req.body;
    
    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ message: 'Détails d\'achat requis' });
    }
    
    // Calculer le total
    let total = 0;
    for (const detail of details) {
      total += detail.quantite * detail.prix_unitaire;
    }
    
    // Créer l'achat
    const { data: achatData, error: achatError } = await run('achats', {
      total,
      statut: 'termine',
      fournisseur_nom: fournisseur_nom || null,
      fournisseur_email: fournisseur_email || null,
      utilisateur_id: req.user?.id || null
    });
    
    if (achatError) throw achatError;
    
    // Récupérer l'ID de l'achat créé
    const achatId = achatData?.[0]?.id;
    
    // Créer les détails et mettre à jour le stock
    for (const detail of details) {
      // Insérer le détail
      await run('details_achat', {
        achat_id: achatId,
        produit_id: detail.produit_id,
        quantite: detail.quantite,
        prix_unitaire: detail.prix_unitaire,
        sous_total: detail.quantite * detail.prix_unitaire
      });
      
      // Mettre à jour le stock
      const produit = await get('produits', { id: detail.produit_id });
      if (produit) {
        const nouvelleQuantite = produit.quantite_stock + detail.quantite;
        await run('produits', {
          quantite_stock: nouvelleQuantite,
          date_modification: new Date().toISOString()
        }, { id: detail.produit_id });
        
        // Enregistrer le mouvement de stock
        await run('mouvements_stock', {
          produit_id: detail.produit_id,
          type: 'entree',
          quantite: detail.quantite,
          commentaire: `Achat #${achatId}`,
          utilisateur_id: req.user?.id || null
        });
      }
    }
    
    res.status(201).json({ message: 'Achat créé avec succès', id: achatId });
  } catch (error) {
    console.error('Erreur createAchat:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le statut d'un achat
const updateAchatStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    const existing = await get('achats', { id });
    if (!existing) {
      return res.status(404).json({ message: 'Achat non trouvé' });
    }
    
    await run('achats', { statut }, { id });
    
    res.json({ message: 'Statut d\'achat mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur updateAchatStatut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un achat
const deleteAchat = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await get('achats', { id });
    if (!existing) {
      return res.status(404).json({ message: 'Achat non trouvé' });
    }
    
    await run('details_achat', null, { achat_id: id });
    await run('achats', null, { id });
    
    res.json({ message: 'Achat supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteAchat:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getAllAchats,
  getAchatById,
  createAchat,
  updateAchatStatut,
  deleteAchat
};
