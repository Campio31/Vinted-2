/* Configuration de la synchronisation. Remplis ces deux valeurs en suivant SYNCHRONISATION.md.
   La clé « anon » (ou « publishable ») est faite pour être publique : tes données sont protégées par ton compte et par les règles du fichier supabase-setup.sql.
   N'écris JAMAIS ici la clé « service_role ». */
window.STOCK_CONFIG = {
  supabaseUrl: 'https://akbwyxbllrfeibmtwdbh.supabase.co',
  supabaseKey: 'sb_publishable_3WGlhOZqehwV0Kds1ao1yQ_MhzmnoJE',   // clé publishable (publique)
  vapidPublicKey: ''   // clé PUBLIQUE des notifications push (générée avec generer-cles-vapid.html, voir PUSH-ET-CLASSEMENT.md). Jamais la clé privée.
};
