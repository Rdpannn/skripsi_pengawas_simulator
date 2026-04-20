const express = require("express");
const { evaluasiZona } = require("./rules/zonaEvaluasi");
const { saveValidationResult } = require("./services/firestore");

const app = express();
app.use(express.json());

app.post("/validate", async (req, res) => {
  const events = req.body;

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: "Body harus berupa array events." });
  }

  const results = [];

  for (const event of events) {
    const { sessionId, scenario, eventType, payload, timestamp } = event;

    let validationResult = null;

    if (eventType === "ZONE_EVALUATED" && scenario === "k3") {
      validationResult = evaluasiZona(payload);
    }

    if (!validationResult) {
      results.push({
        eventType,
        status: "skipped",
        reason: "No rule matched.",
      });
      continue;
    }

    const docData = {
      sessionId,
      scenario,
      eventType,
      payload,
      timestamp,
      klasifikasi: validationResult.klasifikasi,
      keterangan: validationResult.keterangan,
    };

    try {
      const docId = await saveValidationResult(sessionId, docData);
      results.push({
        eventType,
        status: "saved",
        docId,
        klasifikasi: validationResult.klasifikasi,
        keterangan: validationResult.keterangan,
      });
    } catch (err) {
      console.error("Firestore error:", err);
      results.push({ eventType, status: "error", error: err.message });
    }
  }

  return res.json({ success: true, results });
});

app.get("/", (req, res) => res.json({ status: "Validator running." }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Validator listening on port ${PORT}`));
