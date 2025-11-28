const store = require('./store');

const TWO_FA_CODE_TTL = parseInt(process.env.TWO_FA_CODE_TTL || '300', 10); // seconds
const TWO_FA_CODE_LENGTH = parseInt(process.env.TWO_FA_CODE_LENGTH || '6', 10);
const TWO_FA_DELIVERY_MODE = process.env.TWO_FA_DELIVERY_MODE || 'console';
const TWO_FA_MAX_REQUESTS_PER_HOUR = parseInt(process.env.TWO_FA_MAX_REQUESTS_PER_HOUR || '5', 10);
const TWO_FA_MAX_VERIFY_ATTEMPTS_PER_HOUR = parseInt(process.env.TWO_FA_MAX_VERIFY_ATTEMPTS_PER_HOUR || '10', 10);

// Naive per-user rate limits stored in memory for demo
const requestWindow = new Map(); // userId -> [timestamps]
const verifyWindow = new Map(); // userId -> [timestamps]

// PUBLIC_INTERFACE
function canRequestCode(userId) {
  /** Check if user is allowed to request another 2FA code within window. */
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const arr = requestWindow.get(userId) || [];
  const filtered = arr.filter(ts => ts > hourAgo);
  filtered.push(now);
  requestWindow.set(userId, filtered);
  return filtered.length <= TWO_FA_MAX_REQUESTS_PER_HOUR;
}

// PUBLIC_INTERFACE
function canAttemptVerify(userId) {
  /** Check if user can attempt verification within window. */
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const arr = verifyWindow.get(userId) || [];
  const filtered = arr.filter(ts => ts > hourAgo);
  filtered.push(now);
  verifyWindow.set(userId, filtered);
  return filtered.length <= TWO_FA_MAX_VERIFY_ATTEMPTS_PER_HOUR;
}

function generateNumericCode(length) {
  const min = 10 ** (length - 1);
  const max = (10 ** length) - 1;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return String(code);
}

function deliverCode(user, code) {
  // For demo: delivery via console or no-op for email/sms unless configured
  if (TWO_FA_DELIVERY_MODE === 'console') {
    // eslint-disable-next-line no-console
    console.log(`[2FA] Delivering code to ${user.username}: ${code}`);
  } else {
    // Stubbed hooks for integration
    // eslint-disable-next-line no-console
    console.log(`[2FA] (${TWO_FA_DELIVERY_MODE}) delivery selected. Integrate provider to send code "${code}" to user.`);
  }
}

// PUBLIC_INTERFACE
function initiateTwoFA(user) {
  /** Generate and store a 2FA code for the given user and deliver it. */
  if (!canRequestCode(user.id)) {
    const err = new Error('Too many 2FA code requests. Try again later.');
    err.status = 429;
    throw err;
  }
  const code = generateNumericCode(TWO_FA_CODE_LENGTH);
  const expiresAt = Date.now() + TWO_FA_CODE_TTL * 1000;
  store.upsertTwoFACode(user.id, code, expiresAt);
  deliverCode(user, code);
  return { expiresAt };
}

// PUBLIC_INTERFACE
function verifyTwoFA(user, submittedCode) {
  /** Verify a submitted 2FA code for the given user. */
  if (!canAttemptVerify(user.id)) {
    const err = new Error('Too many verification attempts. Try again later.');
    err.status = 429;
    throw err;
  }
  const entry = store.getTwoFACode(user.id);
  if (!entry) {
    const err = new Error('No 2FA code found. Initiate 2FA first.');
    err.status = 400;
    throw err;
  }
  if (Date.now() > entry.expiresAt) {
    store.deleteTwoFACode(user.id);
    const err = new Error('2FA code expired.');
    err.status = 400;
    throw err;
  }
  if (entry.code !== String(submittedCode)) {
    entry.attempts += 1;
    const err = new Error('Invalid 2FA code.');
    err.status = 400;
    throw err;
  }
  // success
  store.deleteTwoFACode(user.id);
  return true;
}

module.exports = {
  initiateTwoFA,
  verifyTwoFA,
};
