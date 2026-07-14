/* ============================================================
   Carebridge Portal — Supabase client (lazy init)
   Loads after React so it never blocks the portal from rendering.
   ============================================================ */
(function () {
  var SUPABASE_URL = 'https://htvjjwfenvittdritjni.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dmpqd2ZlbnZpdHRkcml0am5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTQ3OTAsImV4cCI6MjA5OTIzMDc5MH0.AMKUctPj49ahqXAFZbzJ341ZFH5XTckBUQaDmF5ZLj8';

  function init() {
    if (!window.supabase) return;
    var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: { params: { eventsPerSecond: 10 } }
    });
    window.CB_SB = sb;

    window.CB_Auth = {
      signIn: function (email, password) {
        return sb.auth.signInWithPassword({ email: email, password: password });
      },
      signOut: function () { return sb.auth.signOut(); },
      getSession: function () { return sb.auth.getSession(); },
      onAuthChange: function (cb) { return sb.auth.onAuthStateChange(cb); },
    };

    // Timestamp of our last save — used to skip echoing our own updates back
    window._CB_LastSave = 0;

    var syncTimer = null;
    window.CB_SyncToSupabase = function (stateObj) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(function () {
        window._CB_LastSave = Date.now();
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

    // Only load from Supabase if the user has a real authenticated session
    sb.auth.getSession().then(function (res) {
      if (res.data && res.data.session) {
        window.CB_LoadFromSupabase(function (sbState) {
          if (!sbState || !window.CBStore) return;
          window.CBStore._loadFromCloud(sbState);
        });
      }
    });

    // Real-time subscription: any update to portal_state broadcasts to all users instantly
    sb.channel('portal-state-sync')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'portal_state',
        filter: 'id=eq.main'
      }, function (payload) {
        if (!payload.new || !payload.new.state) return;
        // Skip if this looks like our own echo (arrived within 4s of our last save)
        if (Date.now() - window._CB_LastSave < 4000) return;
        if (window.CBStore) {
          console.log('[CB] Real-time update received — refreshing portal data');
          window.CBStore._loadFromCloud(payload.new.state);
        }
      })
      .subscribe(function (status) {
        console.log('[CB] Realtime status:', status);
      });

    // Auto-logout when Supabase session expires (for Supabase Auth logins)
    sb.auth.onAuthStateChange(function (event, session) {
      if (event === 'SIGNED_OUT') {
        var token = localStorage.getItem('cb_token');
        if (token && token.startsWith('sb-')) {
          localStorage.removeItem('cb_token');
          localStorage.removeItem('cb_role');
          localStorage.removeItem('cb_user_name');
          localStorage.removeItem('cb_user_role');
          window.location.href = 'Carebridge Login.html';
        }
      }
    });

    console.log('[CB] Supabase ready');
  }

  // Called by onload on the CDN script tag
  window.CB_InitSupabase = init;

  // Also try immediately in case script already loaded
  if (window.supabase) init();
})();
