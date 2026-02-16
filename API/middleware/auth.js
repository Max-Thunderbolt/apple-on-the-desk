const { getAuth } = require('../config/firebaseAdmin');

/**
 * Require a valid Firebase ID token in Authorization: Bearer <token>.
 * Sets req.userId to the Firebase UID.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization required' });
  }
  const idToken = authHeader.slice(7);

  const auth = getAuth();
  if (!auth) {
    return res.status(503).json({ success: false, message: 'Auth not configured' });
  }

  auth
    .verifyIdToken(idToken)
    .then((decoded) => {
      req.userId = decoded.uid;
      next();
    })
    .catch(() => {
      res.status(401).json({ success: false, message: 'Invalid or expired token' });
    });
}

module.exports = { requireAuth };
