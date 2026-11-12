const { Client } = require('pg');
require('dotenv').config();

async function init() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query("SELECT datname FROM pg_database WHERE datname='shiksha_pariksha'");
    if (res.rows.length === 0) {
      await client.query('CREATE DATABASE shiksha_pariksha');
      console.log('✅ Database shiksha_pariksha created successfully');
    } else {
      console.log('ℹ️  Database shiksha_pariksha already exists');
    }
  } catch (err) {
    console.error('❌ Database error:', err.message);
  } finally {
    await client.end();
  }
}

init();
