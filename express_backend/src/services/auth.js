const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev_refresh_secret';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// PUBLIC_INTERFACE
function hashPassword(password) {
  /** Return a salted hash for the password. */
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

// PUBLIC_INTERFACE
function verifyPassword(password, stored) {
  /** Verify a password against stored salt:hash. */
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

// PUBLIC_INTERFACE
function signAccessToken(payload) {
  /** Create a signed access token JWT. */
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// PUBLIC_INTERFACE
function verifyAccessToken(token) {
  /** Verify a signed access token JWT. */
  return jwt.verify(token, JWT_SECRET);
}

// PUBLIC_INTERFACE
function signRefreshToken(payload) {
  /** Create a signed refresh token JWT. */
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

// PUBLIC_INTERFACE
function verifyRefreshToken(token) {
  /** Verify a signed refresh token JWT. */
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
}

module.exports = {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
