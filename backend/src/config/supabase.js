const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration du client Supabase avec la clé anon (pour les opérations côté client)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Les variables d\'environnement SUPABASE_URL et SUPABASE_KEY sont requises');
}

// Client Supabase principal (avec clé anon)
const supabase = createClient(supabaseUrl, supabaseKey);

// Client Supabase avec service role (pour les opérations administratives qui bypassent RLS)
const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

module.exports = {
    supabase,
    supabaseAdmin
};
