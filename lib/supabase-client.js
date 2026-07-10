/* ============================================================
   Carebridge Portal — Supabase client (lazy init)
   Loads after React so it never blocks the portal from rendering.
   ============================================================ */
(function () {
  var SUPABASE_URL = 'https://htvjjwfenvittdritjni.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dmpqd2ZlbnZpdHRkcml0am5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTQ3OTAsImV4cCI6MjA5OTIzMDc5MH0.AMKUctPj49ahqXAFZbzJ341ZFH5XTckBUQaDmF5ZLj8';

  function init() {
    if (!window.supabase) return;
    var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.CB_SB = sb;

    window.CB_Auth = {
      signIn: function (email, password) {
        return sb.auth.signInWithPassword({ email: email, password: password });
      },
      signOut: function () { return sb.auth.signOut(); },
      getSession: function () { return sb.auth.getSession(); },
      onAuthChange: function (cb) { return sb.auth.onAuthStateChange(cb); },
    };

    var syncTimer = null;
    window.CB_SyncToSupabase = function (stateObj) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(function () {
        sb.from('portal_state')
          .upsert({ id: 'main', state: stateObj, updated_at: new Date().toISOString() })
          .then(function (res) {
            if (res.error) console.warn('[CB] Supabase save error:', res.error.message);
          });
      }, 1500);
    };

    window.CB_LoadFromSupabase = function (onLoaded) {
      sb.from('portal_state')
        .select('state')
        .eq('id', 'main')
        .single()
        .then(function (res) {
          if (res.error || !res.data || !res.data.state || !res.data.state.patients) {
            if (onLoaded) onLoaded(null);
            return;
          }
          if (onLoaded) onLoaded(res.data.state);
        });
    };

    // Pull latest data from Supabase now that client is ready
    window.CB_LoadFromSupabase(function (sbState) {
      if (!sbState || !window.CBStore) return;
      window.CBStore._loadFromCloud(sbState);
    });

    console.log('[CB] Supabase ready');
  }

  // Called by onload on the CDN script tag
  window.CB_InitSupabase = init;

  // Also try immediately in case script already loaded
  if (window.supabase) init();
})();
