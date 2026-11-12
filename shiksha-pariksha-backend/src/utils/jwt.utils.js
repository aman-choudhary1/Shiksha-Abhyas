const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET  = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const ACCESS_EXPIRY  = process.env.JWT_ACCESS_EXPIRY  || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

/**
 * Signs a short-lived access token
 */
function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

/**
 * Verifies an access token, throws on invalid/expired
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

/**
 * Generates a secure random refresh token (plain) + its SHA-256 hash for DB storage
 */
function generateRefreshToken() {
  const plain = crypto.randomBytes(48).toString('hex');
  const hash  = crypto.createHash('sha256').update(plain).digest('hex');
  return { plain, hash };
}

/**
 * Hashes a plain refresh token for DB lookup
 */
function hashRefreshToken(plain) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

/**
 * Parses the JWT_REFRESH_EXPIRY string to milliseconds for DB expiry
 */
function refreshExpiryMs() {
  const str = REFRESH_EXPIRY;
  const num = parseInt(str, 10);
  if (str.endsWith('d')) return num * 24 * 60 * 60 * 1000;
  if (str.endsWith('h')) return num * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000; // default 7 days
}

module.exports = { signAccessToken, verifyAccessToken, generateRefreshToken, hashRefreshToken, refreshExpiryMs };
