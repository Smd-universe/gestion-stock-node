const { all, run, get, allWithJoin } = require('../config/db');

// Récupérer toutes les ventes
const getAllVentes = async (req, res) => {
  try {
    const ventes = await allWithJoin(
      'ventes',
      '*, utilisateurs(nom as utilisateur_nom)',
      null,
      { column: 'date_vente', ascending: false }
    );
    res.json(ventes);
  } catch (error) {
    console.error('Erreur getAllVentes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer une vente par ID avec détails
const getVenteById = async (req, res) => {
  try {
    const { id } = req.params;
    const vente = await allWithJoin(
      'ventes',
      '*, utilisateurs(nom as utilisateur_nom)',
      { id }
    ).then(data => data[0]);
    
    if (!vente) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    
    // Récupérer les détails de la vente
    const details = await allWithJoin(
      'details_vente',
      '*, produits(nom as produit_nom)',
      { vente_id }
    );
    
    res.json({ ...vente, details });
  } catch (error) {
    console.error('Erreur getVenteById:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Créer une nouvelle vente
const createVente = async (req, res) => {
  try {
    const { client_nom, client_email, details } = req.body;
    
    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ message: 'Détails de vente requis' });
    }
    
    // Calculer le total
    let total = 0;
    for (const detail of details) {
      total += detail.quantite * detail.prix_unitaire;
    }
    
    // Créer la vente
    const { data: venteData, error: venteError } = await run('ventes', {
      total,
      statut: 'terminee',
      client_nom: client_nom || null,
      client_email: client_email || null,
      utilisateur_id: req.user?.id || null
    });
    
    if (venteError) throw venteError;
    
    // Récupérer l'ID de la vente créée (Supabase renvoie les données insérées)
    const venteId = venteData?.[0]?.id;
    
    // Créer les détails et mettre à jour le stock
    for (const detail of details) {
      // Insérer le détail
      await run('details_vente', {
        vente_id: venteId,
        produit_id: detail.produit_id,
        quantite: detail.quantite,
        prix_unitaire: detail.prix_unitaire,
        sous_total: detail.quantite * detail.prix_unitaire
      });
      
      // Mettre à jour le stock
      const produit = await get('produits', { id: detail.produit_id });
      if (produit) {
        const nouvelleQuantite = produit.quantite_stock - detail.quantite;
        if (nouvelleQuantite >= 0) {
          await run('produits', {
            quantite_stock: nouvelleQuantite,
            date_modification: new Date().toISOString()
          }, { id: detail.produit_id });
          
          // Enregistrer le mouvement de stock
          await run('mouvements_stock', {
            produit_id: detail.produit_id,
            type: 'sortie',
            quantite: detail.quantite,
            commentaire: `Vente #${venteId}`,
            utilisateur_id: req.user?.id || null
          });
        }
      }
    }
    
    res.status(201).json({ message: 'Vente créée avec succès', id: venteId });
  } catch (error) {
    console.error('Erreur createVente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Mettre à jour le statut d'une vente
const updateVenteStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    const existing = await get('ventes', { id });
    if (!existing) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    
    await run('ventes', { statut }, { id });
    
    res.json({ message: 'Statut de vente mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur updateVenteStatut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer une vente
const deleteVente = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await get('ventes', { id });
    if (!existing) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    
    await run('details_vente', null, { vente_id: id });
    await run('ventes', null, { id });
    
    res.json({ message: 'Vente supprimée avec succès' });
  } catch (error) {
    console.error('Erreur deleteVente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  getAllVentes,
  getVenteById,
  createVente,
  updateVenteStatut,
  deleteVente
};
