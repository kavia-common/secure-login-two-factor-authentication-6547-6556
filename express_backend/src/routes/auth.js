const express = require('express');
const {
  register,
  login,
  initiate2FA,
  verify2FAController,
  refresh,
  me,
} = require('../controllers/auth');
const { requireAuth, require2FA } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and Two-Factor Authentication APIs
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Bad request
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with username and password
 *     tags: [Auth]
 *     description: Returns access and refresh tokens. If 2FA is enabled, the access token has twoFA=false and you must call /auth/2fa/initiate then /auth/2fa/verify to get a token with twoFA=true.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login response
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/2fa/initiate:
 *   post:
 *     summary: Initiate 2FA (generate and deliver a code)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA code generated and delivered
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many requests
 */
router.post('/2fa/initiate', requireAuth, initiate2FA);

/**
 * @swagger
 * /auth/2fa/verify:
 *   post:
 *     summary: Verify the 2FA code
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA verified, returns a new access token with twoFA=true
 *       400:
 *         description: Invalid or expired code
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Too many attempts
 */
router.post('/2fa/verify', requireAuth, verify2FAController);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token returned
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile (requires 2FA if enabled)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: 2FA required
 */
router.get('/me', requireAuth, require2FA, me);

module.exports = router;
