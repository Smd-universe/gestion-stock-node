const { supabase, supabaseAdmin } = require('./supabase');
const bcrypt = require('bcrypt');

// Initialiser la base de données (créer les tables si nécessaire)
async function initDatabase() {
  try {
    console.log('Connexion à Supabase établie');
    
    // Vérifier la connexion
    const { data, error } = await supabase.from('utilisateurs').select('count');
    if (error) {
      console.error('Erreur de connexion à Supabase:', error.message);
      throw error;
    }
    
    console.log('Tables Supabase prêtes');
    
    // Initialiser les utilisateurs par défaut
    await initDefaultUsers();
  } catch (err) {
    console.error('Erreur d\'initialisation de la base de données:', err.message);
  }
}

// Initialiser les utilisateurs par défaut
async function initDefaultUsers() {
  try {
    // Vérifier si l'admin existe déjà
    const { data: adminExists } = await supabase
      .from('utilisateurs')
      .select('id')
      .eq('email', 'admin@gestion-stock.com')
      .single();
    
    if (!adminExists) {
      const adminPassword = await bcrypt.hash('Admin123!', 10);
      const { error } = await supabaseAdmin
        .from('utilisateurs')
        .insert({
          nom: 'Administrateur',
          email: 'admin@gestion-stock.com',
          mot_de_passe: adminPassword,
          role: 'admin'
        });
      
      if (!error) {
        console.log('Compte administrateur créé: admin@gestion-stock.com / Admin123!');
      }
    }
    
    // Vérifier si le caissier existe déjà
    const { data: caissierExists } = await supabase
      .from('utilisateurs')
      .select('id')
      .eq('email', 'caissier@gestion-stock.com')
      .single();
    
    if (!caissierExists) {
      const caissierPassword = await bcrypt.hash('Caissier123!', 10);
      const { error } = await supabaseAdmin
        .from('utilisateurs')
        .insert({
          nom: 'Caissier Test',
          email: 'caissier@gestion-stock.com',
          mot_de_passe: caissierPassword,
          role: 'caissier'
        });
      
      if (!error) {
        console.log('Compte caissier créé: caissier@gestion-stock.com / Caissier123!');
      }
    }
  } catch (err) {
    console.error('Erreur lors de l\'initialisation des utilisateurs:', err.message);
  }
}

// Wrapper pour exécuter des requêtes INSERT/UPDATE/DELETE
async function run(tableName, data = null, filters = null) {
  try {
    let query;
    
    if (data && filters) {
      // UPDATE
      query = supabaseAdmin.from(tableName).update(data);
    } else if (data) {
      // INSERT
      query = supabaseAdmin.from(tableName).insert(data);
    } else if (filters) {
      // DELETE
      query = supabaseAdmin.from(tableName).delete();
    }
    
    // Appliquer les filtres
    if (filters) {
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });
    }
    
    const { error } = await query;
    if (error) throw error;
    
    return { success: true };
  } catch (err) {
    console.error('Erreur lors de l\'exécution de la requête:', err.message);
    throw err;
  }
}

// Wrapper pour les requêtes SELECT (multiple lignes)
async function all(tableName, filters = null, orderBy = null) {
  try {
    let query = supabase.from(tableName).select('*');
    
    // Appliquer les filtres
    if (filters) {
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });
    }
    
    // Appliquer l'ordre
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('Erreur lors de la requête SELECT:', err.message);
    throw err;
  }
}

// Wrapper pour les requêtes SELECT (une seule ligne)
async function get(tableName, filters) {
  try {
    let query = supabase.from(tableName).select('*');
    
    // Appliquer les filtres
    if (filters) {
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });
    }
    
    const { data, error } = await query.single();
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Aucun résultat trouvé
      }
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Erreur lors de la requête GET:', err.message);
    throw err;
  }
}

// Wrapper pour les requêtes avec JOIN
async function allWithJoin(tableName, select, filters = null, orderBy = null) {
  try {
    let query = supabase.from(tableName).select(select);
    
    // Appliquer les filtres
    if (filters) {
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });
    }
    
    // Appliquer l'ordre
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending !== false });
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  } catch (err) {
    console.error('Erreur lors de la requête SELECT avec JOIN:', err.message);
    throw err;
  }
}

// Initialiser la base de données
const initPromise = initDatabase();

module.exports = {
  run,
  all,
  get,
  allWithJoin,
  initPromise,
  supabase,
  supabaseAdmin
};
