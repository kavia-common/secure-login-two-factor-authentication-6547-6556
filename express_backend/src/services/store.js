const crypto = require('crypto');

/**
 * Simple in-memory store for demo purposes.
 * In production, replace with a persistent database.
 */
class Store {
  constructor() {
    this.users = new Map(); // key: username, value: { id, username, passwordHash, twoFA: { enabled, secret }, lastLoginAt }
    this.twoFACodes = new Map(); // key: userId, value: { code, expiresAt, attempts, requestedAt }
    this.refreshTokens = new Map(); // key: token, value: { userId, expiresAt }
  }

  // PUBLIC_INTERFACE
  createUser(username, passwordHash) {
    /** Create a new user with hashed password. */
    if (this.users.has(username)) throw new Error('User already exists');
    const id = crypto.randomUUID();
    const user = { id, username, passwordHash, twoFA: { enabled: true }, lastLoginAt: null };
    this.users.set(username, user);
    return user;
  }

  // PUBLIC_INTERFACE
  getUserByUsername(username) {
    /** Retrieve user by username. */
    return this.users.get(username) || null;
  }

  // PUBLIC_INTERFACE
  getUserById(userId) {
    /** Retrieve user by id. */
    for (const [, u] of this.users) {
      if (u.id === userId) return u;
    }
    return null;
  }

  // PUBLIC_INTERFACE
  upsertTwoFACode(userId, code, expiresAt) {
    /** Create/replace a 2FA code for a user. */
    this.twoFACodes.set(userId, { code, expiresAt, attempts: 0, requestedAt: Date.now() });
    return this.twoFACodes.get(userId);
  }

  // PUBLIC_INTERFACE
  getTwoFACode(userId) {
    /** Get 2FA code info for a user. */
    return this.twoFACodes.get(userId) || null;
  }

  // PUBLIC_INTERFACE
  deleteTwoFACode(userId) {
    /** Delete 2FA code for a user. */
    this.twoFACodes.delete(userId);
  }

  // PUBLIC_INTERFACE
  addRefreshToken(token, userId, expiresAt) {
    /** Store refresh token mapping. */
    this.refreshTokens.set(token, { userId, expiresAt });
  }

  // PUBLIC_INTERFACE
  getRefreshToken(token) {
    /** Get refresh token details. */
    return this.refreshTokens.get(token) || null;
  }

  // PUBLIC_INTERFACE
  revokeRefreshToken(token) {
    /** Remove a refresh token. */
    this.refreshTokens.delete(token);
  }
}

module.exports = new Store();
