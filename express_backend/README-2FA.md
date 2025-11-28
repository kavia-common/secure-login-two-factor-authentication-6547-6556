# Express 2FA Backend

This service provides a demo-ready 2FA flow using in-memory storage.

Base URL: http://localhost:3001

Docs: /docs

## Quick Start

1. Copy `.env.example` to `.env` and adjust values (at minimum set JWT_SECRET).
2. Install dependencies and run:
   - npm install
   - npm run dev (or npm start)

Server runs on port 3001 by default.

## Auth & 2FA Flow

1) Register
POST /auth/register
Body: { "username": "alice", "password": "P@ssw0rd" }

2) Login
POST /auth/login
Body: { "username": "alice", "password": "P@ssw0rd" }
- Returns accessToken (twoFA=false if 2FA enabled) and refreshToken.
- If twoFARequired=true, proceed to initiate 2FA.

3) Initiate 2FA
POST /auth/2fa/initiate
Headers: Authorization: Bearer <accessToken>
- Generates a 2FA code and "delivers" it (console by default).

4) Verify 2FA
POST /auth/2fa/verify
Headers: Authorization: Bearer <accessToken>
Body: { "code": "123456" }
- Returns a new accessToken with twoFA=true.

5) Access Protected Resource
GET /auth/me
Headers: Authorization: Bearer <2FA-verified accessToken>

6) Refresh Access Token
POST /auth/refresh
Body: { "refreshToken": "<token>" }

## Rate Limiting

- 2FA code requests limited by TWO_FA_MAX_REQUESTS_PER_HOUR (default 5).
- 2FA verification attempts limited by TWO_FA_MAX_VERIFY_ATTEMPTS_PER_HOUR (default 10).

## Environment

- PORT: server port (default 3001)
- JWT_SECRET, JWT_EXPIRES_IN
- REFRESH_TOKEN_SECRET, REFRESH_TOKEN_EXPIRES_IN
- TWO_FA_CODE_TTL, TWO_FA_CODE_LENGTH
- TWO_FA_DELIVERY_MODE: console | email | sms

## Notes

- In-memory storage is for demo only; replace with a database for production.
- Email/SMS delivery is stubbed; integrate providers if needed.
