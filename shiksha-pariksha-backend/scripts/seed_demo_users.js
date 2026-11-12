const { Pool }   = require('pg');
const bcrypt     = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'shiksha_pariksha',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const DEMO_USERS = [
  { full_name: 'Admin User',     email: 'admin@shiksha.local',   phone: '9000000001', password: 'Admin@123',   role: 'admin'   },
  { full_name: 'Priya Sharma',   email: 'teacher@shiksha.local', phone: '9000000002', password: 'Teacher@123', role: 'teacher' },
  { full_name: 'Rahul Kumar',    email: 'student@shiksha.local', phone: '9000000003', password: 'Student@123', role: 'student' },
  { full_name: 'Sunita Devi',    email: 'parent@shiksha.local',  phone: '9000000004', password: 'Parent@123',  role: 'parent'  },
  { full_name: 'Amit Singh',     email: 'student2@shiksha.local',phone: '9000000005', password: 'Student@123', role: 'student' },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('\n  🌱 Seeding demo users...\n');
    for (const u of DEMO_USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      const r = await client.query(
        `INSERT INTO users (full_name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, full_name, role`,
        [u.full_name, u.email, u.phone, hash, u.role]
      );
      if (r.rowCount) {
        console.log(`  ✅ Created: ${u.role.padEnd(10)} | ${u.full_name.padEnd(20)} | ${u.email}`);
        console.log(`             Password: ${u.password}`);

        // Add student profile for student users
        if (u.role === 'student') {
          await client.query(
            `INSERT INTO student_profiles (user_id, class_level, section, school_name, board)
             VALUES ($1, 10, 'A', 'Government Higher Secondary School', 'MPBSE')
             ON CONFLICT DO NOTHING`,
            [r.rows[0].id]
          );
        }
      } else {
        console.log(`  ⏭️  Skipped (already exists): ${u.email}`);
      }
    }

    // Link parent to student
    const parentRes  = await client.query(`SELECT id FROM users WHERE email = 'parent@shiksha.local'`);
    const studentRes = await client.query(`SELECT id FROM users WHERE email = 'student@shiksha.local'`);
    if (parentRes.rowCount && studentRes.rowCount) {
      await client.query(
        `INSERT INTO parent_student_links (parent_user_id, student_user_id, relation)
         VALUES ($1, $2, 'mother') ON CONFLICT DO NOTHING`,
        [parentRes.rows[0].id, studentRes.rows[0].id]
      );
      console.log('\n  🔗 Linked parent → student (Rahul Kumar)');
    }

    console.log('\n  ✨ Seed complete!\n');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('  ❌ Seed failed:', err.message);
  process.exit(1);
});
