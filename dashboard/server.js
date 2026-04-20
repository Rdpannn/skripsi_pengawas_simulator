const express = require("express");
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const { getAllSessions, getEventsBySession } = require("./services/firestore");

const app = express();
const PORT = 3001;

// Tambahin ini — serve folder public sebagai static files
app.use(express.static("public"));

// API: semua sessions
app.get("/api/sessions", async (req, res) => {
  try {
    const sessions = await getAllSessions();
    res.json({ totalSessions: sessions.length, sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: events dari session tertentu
app.get("/api/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const events = await getEventsBySession(sessionId);
    res.json({ sessionId, totalEvents: events.length, events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard running on http://localhost:${PORT}`);
});

// API: rekap per aspek dari satu session (untuk Sophie)
app.get("/api/session/:sessionId/rekap", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const events = await getEventsBySession(sessionId);

    // Hanya proses ZONE_EVALUATED (nanti bisa ditambah APD, dll)
    const zoneEvents = events.filter((e) => e.eventType === "ZONE_EVALUATED");

    // Hitung frekuensi klasifikasi
    const rekap = {
      total: zoneEvents.length,
      CA: zoneEvents.filter((e) => e.klasifikasi === "CA").length,
      OR: zoneEvents.filter((e) => e.klasifikasi === "OR").length,
      UR: zoneEvents.filter((e) => e.klasifikasi === "UR").length,
      MD: zoneEvents.filter((e) => e.klasifikasi === "MD").length,
    };

    res.json({ sessionId, rekap });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
