const admin = require('firebase-admin');

let initialized = false;

function initializeFirebaseAdmin() {
  if (initialized) return;
  if (admin.apps.length > 0) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('Firebase Admin: missing env (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Auth middleware will reject requests.');
    initialized = true;
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
    initialized = true;
    console.log('Firebase Admin initialized');
  } catch (err) {
    console.error('Firebase Admin init error:', err);
  }
}

function getAuth() {
  return admin.auth ? admin.auth() : null;
}

module.exports = { initializeFirebaseAdmin, getAuth };
