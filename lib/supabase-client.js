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

    // Cache of signed agreement IDs from the last cloud load — prevents
    // CB_SyncToSupabase from overwriting "signed" back to "pending" when the
    // admin's local store is stale.
    window._CB_SignedIds = {};

    var syncTimer = null;
    window.CB_SyncToSupabase = function (stateObj) {
      clearTimeout(syncTimer);
      // Snapshot agreements now so the closure captures current signed IDs
      var signedIds = window._CB_SignedIds || {};
      syncTimer = setTimeout(function () {
        window._CB_LastSave = Date.now();
        // Merge: never downgrade a cloud-signed agreement back to pending
        var toSave = stateObj;
        if (Array.isArray(stateObj.agreements) && Object.keys(signedIds).length) {
          var merged = stateObj.agreements.map(function (a) {
            if (signedIds[a.id] && a.status !== 'signed') {
              return Object.assign({}, a, { status: 'signed', dateSigned: signedIds[a.id] });
            }
            return a;
          });
          // Build a new object only if something actually changed
          var changed = merged.some(function (a, i) { return a !== stateObj.agreements[i]; });
          if (changed) {
            toSave = Object.assign({}, stateObj, { agreements: merged });
            // Also update the local store so it stays consistent
            if (window.CBStore && window.CBStore._patchAgreements) {
              window.CBStore._patchAgreements(merged);
            }
          }
        }
        sb.from('portal_state')
          .upsert({ id: 'main', state: toSave, updated_at: new Date().toISOString() })
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
          // Cache signed agreement IDs so CB_SyncToSupabase can protect them
          var agrs = res.data.state.agreements || [];
          agrs.forEach(function (a) {
            if (a.status === 'signed') window._CB_SignedIds[a.id] = a.dateSigned || true;
          });
          if (onLoaded) onLoaded(res.data.state);
        });
    };

    // Always load from Supabase on init — agreement signed status must not
    // be lost when admin's localStorage has stale "pending" for a patient-signed agreement.
    window.CB_LoadFromSupabase(function (sbState) {
      if (!sbState || !window.CBStore) return;
      window.CBStore._loadFromCloud(sbState);
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
        // Cache signed IDs from the incoming cloud state
        var agrs = payload.new.state.agreements || [];
        agrs.forEach(function (a) {
          if (a.status === 'signed') window._CB_SignedIds[a.id] = a.dateSigned || true;
        });
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
