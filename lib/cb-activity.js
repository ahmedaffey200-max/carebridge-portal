/* ============================================================
   Carebridge — Patient Activity Tracker
   Writes activity events to Supabase so patients can see all
   updates made to their case in the Patient Portal.
   ============================================================ */
(function () {
  var SUPABASE_URL = "https://htvjjwfenvittdritjni.supabase.co";
  var ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dmpqd2ZlbnZpdHRkcml0am5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTQ3OTAsImV4cCI6MjA5OTIzMDc5MH0.AMKUctPj49ahqXAFZbzJ341ZFH5XTckBUQaDmF5ZLj8";

  window.cbTrackActivity = function (patientId, type, title, description, oldValue, newValue) {
    if (!patientId) return;
    try {
      fetch(SUPABASE_URL + "/rest/v1/patient_activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": ANON_KEY,
          "Authorization": "Bearer " + ANON_KEY,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          patient_id: patientId,
          activity_type: type,
          title: title,
          description: description || null,
          old_value: oldValue || null,
          new_value: newValue || null,
          created_by: "Carebridge Coordinator"
        })
      }).catch(function (e) { console.warn("Activity log:", e); });
    } catch (e) {
      console.warn("Activity log error:", e);
    }
  };
})();
