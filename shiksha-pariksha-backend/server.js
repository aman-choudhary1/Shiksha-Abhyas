require('dotenv').config();
const { testConnection } = require('./src/config/db');
const app  = require('./src/app');

const PORT         = parseInt(process.env.PORT || '4000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

async function start() {
  try {
    await testConnection();
    console.log('  ✅ Database connected');
  } catch (err) {
    console.error('  ❌ Database connection failed:', err.message);
    console.error('     Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in .env');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log('\n');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║      🎓 SHIKSHA ABHYAS — API SERVER      ║');
    console.log('  ╠══════════════════════════════════════════╣');
    console.log(`  ║  Backend  → http://localhost:${PORT}         ║`);
    console.log(`  ║  Frontend → ${FRONTEND_URL.padEnd(28)}║`);
    console.log(`  ║  Health   → http://localhost:${PORT}/api/health ║`);
    console.log('  ║  Env      → ' + (process.env.NODE_ENV || 'development').padEnd(29) + '║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('\n');
  });
}

start();
