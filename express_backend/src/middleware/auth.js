const { verifyAccessToken } = require('../services/auth');
const store = require('../services/store');

// PUBLIC_INTERFACE
function requireAuth(req, res, next) {
  /** Verify Authorization Bearer token and attach user to request. */
  try {
    const header = req.get('Authorization') || '';
    const [, token] = header.split(' ');
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const payload = verifyAccessToken(token);
    const user = store.getUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Invalid token user' });
    req.user = user;
    req.auth = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// PUBLIC_INTERFACE
function require2FA(req, res, next) {
  /** Ensure user has completed 2FA if enabled. Expect payload flag twoFA=true after verification. */
  if (!req.auth) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user?.twoFA?.enabled && !req.auth.twoFA) {
    return res.status(403).json({ error: '2FA required' });
  }
  return next();
}

module.exports = {
  requireAuth,
  require2FA,
};
