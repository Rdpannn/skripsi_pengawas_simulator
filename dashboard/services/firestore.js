// services/firestore.js
const admin = require("firebase-admin");

const db = admin.firestore();

async function getAllSessions() {
  const sessionsRef = db.collection("sessions");
  const sessions = await sessionsRef.listDocuments();

  const result = [];
  for (const sessionDoc of sessions) {
    result.push({
      sessionId: sessionDoc.id,
    });
  }

  return result;
}

async function getEventsBySession(sessionId) {
  const eventsRef = db
    .collection("sessions")
    .doc(sessionId)
    .collection("events");

  const snapshot = await eventsRef.orderBy("timestamp", "desc").get();

  const events = [];
  snapshot.forEach((doc) => {
    events.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return events;
}

async function getAllEvents() {
  const sessions = await getAllSessions();
  const allEvents = [];

  for (const session of sessions) {
    const events = await getEventsBySession(session.sessionId);
    allEvents.push({
      sessionId: session.sessionId,
      events: events,
    });
  }

  return allEvents;
}

module.exports = {
  getAllSessions,
  getEventsBySession,
  getAllEvents,
};
