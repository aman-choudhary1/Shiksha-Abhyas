const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'shiksha_pariksha',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max:      20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV !== 'production' && duration > 500) {
    console.warn(`[DB] Slow query (${duration}ms):`, text.slice(0, 80));
  }
  return res;
}

async function getClient() {
  return pool.connect();
}

async function testConnection() {
  const res = await pool.query('SELECT current_database() AS db, NOW() AS now');
  return res.rows[0];
}

module.exports = { query, getClient, testConnection, pool };
