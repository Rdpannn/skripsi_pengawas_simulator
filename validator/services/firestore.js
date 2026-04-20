const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

// Init sekali, guard supaya tidak double-init
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Simpan hasil validasi ke Firestore.
 * Path: sessions/{sessionId}/events/{auto-id}
 */
async function saveValidationResult(sessionId, data) {
  const ref = db
    .collection("sessions")
    .doc(sessionId)
    .collection("events")
    .doc(); // auto-id

  await ref.set({
    ...data,
    savedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return ref.id;
}

module.exports = { saveValidationResult };
