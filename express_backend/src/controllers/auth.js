const store = require('../services/store');
const {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../services/auth');
const { initiateTwoFA, verifyTwoFA } = require('../services/twofa');

// PUBLIC_INTERFACE
async function register(req, res) {
  /** Register a new user with username and password. */
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  try {
    const passwordHash = hashPassword(password);
    const user = store.createUser(username, passwordHash);
    return res.status(201).json({ id: user.id, username: user.username });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
}

// PUBLIC_INTERFACE
async function login(req, res) {
  /** Login endpoint that validates credentials and issues a partial token (2FA pending). */
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  const user = store.getUserByUsername(username);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  // Issue access token with twoFA=false until verification completes
  const accessToken = signAccessToken({ sub: user.id, username: user.username, twoFA: !user.twoFA?.enabled });
  const refreshToken = signRefreshToken({ sub: user.id });

  // Store refresh token mapping (optional for demo)
  const payload = verifyRefreshToken(refreshToken);
  const expiresAt = payload.exp * 1000;
  const storeService = require('../services/store');
  storeService.addRefreshToken(refreshToken, user.id, expiresAt);

  return res.status(200).json({
    accessToken,
    refreshToken,
    twoFARequired: !!user.twoFA?.enabled,
    message: user.twoFA?.enabled ? '2FA required. Call /auth/2fa/initiate' : 'Login successful',
  });
}

// PUBLIC_INTERFACE
async function initiate2FA(req, res) {
  /** Generate and deliver a 2FA code for the authenticated user. */
  const user = req.user;
  try {
    const { expiresAt } = initiateTwoFA(user);
    return res.status(200).json({ message: '2FA code sent', expiresAt });
  } catch (e) {
    return res.status(e.status || 400).json({ error: e.message });
  }
}

// PUBLIC_INTERFACE
async function verify2FAController(req, res) {
  /** Verify submitted 2FA code, issue a 2FA-validated access token. */
  const user = req.user;
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'code is required' });
  try {
    verifyTwoFA(user, String(code));
    const accessToken = signAccessToken({ sub: user.id, username: user.username, twoFA: true });
    return res.status(200).json({ accessToken, message: '2FA verified' });
  } catch (e) {
    return res.status(e.status || 400).json({ error: e.message });
  }
}

// PUBLIC_INTERFACE
async function refresh(req, res) {
  /** Exchange a valid refresh token for a new access token. */
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
  try {
    const payload = verifyRefreshToken(refreshToken);
    const storeService = require('../services/store');
    const entry = storeService.getRefreshToken(refreshToken);
    if (!entry || entry.userId !== payload.sub || Date.now() > entry.expiresAt) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const user = store.getUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'User not found' });
    const newAccess = require('../services/auth').signAccessToken({
      sub: user.id,
      username: user.username,
      twoFA: !user.twoFA?.enabled ? true : false, // if 2FA disabled, mark true
    });
    return res.status(200).json({ accessToken: newAccess });
  } catch (e) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}

// PUBLIC_INTERFACE
async function me(req, res) {
  /** Example protected endpoint that requires 2FA if enabled. */
  const user = req.user;
  return res.status(200).json({ id: user.id, username: user.username, twoFAEnabled: !!user.twoFA?.enabled });
}

module.exports = {
  register,
  login,
  initiate2FA,
  verify2FAController,
  refresh,
  me,
};
