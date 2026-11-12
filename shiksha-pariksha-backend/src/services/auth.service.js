const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { signAccessToken, generateRefreshToken, hashRefreshToken, refreshExpiryMs } = require('../utils/jwt.utils');

class AuthService {
  /**
   * Login: verify credentials, issue tokens
   */
  static async login(identifier, password) {
    // Find user by email or phone
    const result = await db.query(
      `SELECT id, full_name, email, phone, password_hash, role, is_active
         FROM users
        WHERE (LOWER(email) = LOWER($1) OR phone = $1)
        LIMIT 1`,
      [identifier]
    );

    const user = result.rows[0];
    if (!user) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    if (!user.is_active) {
      const err = new Error('Account is inactive. Contact administrator.');
      err.statusCode = 403;
      throw err;
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const tokenPayload = { id: user.id, role: user.role, name: user.full_name };
    const accessToken = signAccessToken(tokenPayload);
    const { plain: refreshPlain, hash: refreshHash } = generateRefreshToken();

    const expiresAt = new Date(Date.now() + refreshExpiryMs());
    await db.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [user.id, refreshHash, expiresAt]
    );

    // Cleanup old expired tokens for this user
    await db.query(
      `DELETE FROM refresh_tokens WHERE user_id = $1 AND expires_at < NOW()`,
      [user.id]
    );

    return {
      accessToken,
      refreshToken: refreshPlain,
      user: { id: user.id, name: user.full_name, email: user.email, phone: user.phone, role: user.role },
    };
  }

  /**
   * Refresh: exchange valid refresh token for new access token
   */
  static async refresh(plainToken) {
    const tokenHash = hashRefreshToken(plainToken);
    const result = await db.query(
      `SELECT rt.user_id, rt.expires_at, u.full_name, u.role, u.is_active
         FROM refresh_tokens rt
         JOIN users u ON u.id = rt.user_id
        WHERE rt.token_hash = $1`,
      [tokenHash]
    );

    const row = result.rows[0];
    if (!row) {
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      throw err;
    }

    if (new Date(row.expires_at) < new Date()) {
      await db.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
      const err = new Error('Refresh token expired — please log in again');
      err.statusCode = 401;
      throw err;
    }

    if (!row.is_active) {
      const err = new Error('Account inactive');
      err.statusCode = 403;
      throw err;
    }

    const accessToken = signAccessToken({ id: row.user_id, role: row.role, name: row.full_name });
    return { accessToken };
  }

  /**
   * Logout: revoke refresh token
   */
  static async logout(plainToken) {
    if (!plainToken) return;
    const tokenHash = hashRefreshToken(plainToken);
    await db.query(`DELETE FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
  }

  /**
   * Register a new user (admin creates teachers; students/parents self-register)
   */
  static async register({ full_name, email, phone, password, role }) {
    const allowedRoles = ['teacher', 'student', 'parent'];
    if (!allowedRoles.includes(role)) {
      const err = new Error(`Invalid role. Must be one of: ${allowedRoles.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    // Check duplicate
    const existing = await db.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR phone = $2 LIMIT 1`,
      [email || '', phone || '']
    );
    if (existing.rowCount > 0) {
      const err = new Error('Account with this email or phone already exists');
      err.statusCode = 409;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const ins = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, role`,
      [full_name, email || null, phone || null, passwordHash, role]
    );

    return ins.rows[0];
  }

  /**
   * Admin-only: create admin or teacher account
   */
  static async adminCreateUser({ full_name, email, phone, password, role }, createdBy) {
    const allowedRoles = ['teacher', 'student', 'parent', 'admin'];
    if (!allowedRoles.includes(role)) {
      const err = new Error(`Invalid role`);
      err.statusCode = 400;
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const ins = await db.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, role, created_at`,
      [full_name, email || null, phone || null, passwordHash, role]
    );
    return ins.rows[0];
  }
}

module.exports = AuthService;
