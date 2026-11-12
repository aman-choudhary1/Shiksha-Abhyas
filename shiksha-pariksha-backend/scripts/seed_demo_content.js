const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shiksha_pariksha',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
});

async function seedContent() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🌱 Seeding sample content...');

    // 1. Subjects
    const subjects = ['Mathematics', 'Science', 'Social Science', 'Hindi', 'Pedagogy & CDP'];
    const subjectMap = {};
    for (const name of subjects) {
      const res = await client.query(
        `INSERT INTO subjects (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name`,
        [name]
      );
      subjectMap[name] = res.rows[0].id;
    }

    // 2. Exam
    const examRes = await client.query(
      `INSERT INTO exams (name, year, language)
       VALUES ('State Board Mock Series', 2026, 'Bilingual')
       RETURNING id`
    );
    const examId = examRes.rows[0].id;

    // 3. Sample Questions Data
    const questionsData = [
      {
        subject: 'Science',
        num: 1,
        en: 'What is the powerhouse of the cell?',
        hi: 'कोशिका का पावरहाउस (ऊर्जा घर) किसे कहा जाता है?',
        options: [
          { key: 'A', en: 'Nucleus', hi: 'नाभिक', correct: false },
          { key: 'B', en: 'Mitochondria', hi: 'माइटोकॉन्ड्रिया', correct: true },
          { key: 'C', en: 'Ribosome', hi: 'राइबोसोम', correct: false },
          { key: 'D', en: 'Golgi apparatus', hi: 'गॉल्जी काय', correct: false },
        ],
      },
      {
        subject: 'Science',
        num: 2,
        en: 'Which gas is released during photosynthesis?',
        hi: 'प्रकाश संश्लेषण के दौरान कौन सी गैस निकलती है?',
        options: [
          { key: 'A', en: 'Carbon dioxide', hi: 'कार्बन डाइऑक्साइड', correct: false },
          { key: 'B', en: 'Oxygen', hi: 'ऑक्सीजन', correct: true },
          { key: 'C', en: 'Nitrogen', hi: 'नाइट्रोजन', correct: false },
          { key: 'D', en: 'Hydrogen', hi: 'हाइड्रोजन', correct: false },
        ],
      },
      {
        subject: 'Science',
        num: 3,
        en: 'What is the chemical formula of common salt?',
        hi: 'साधारण नमक का रासायनिक सूत्र क्या है?',
        options: [
          { key: 'A', en: 'NaCl', hi: 'NaCl (सोडियम क्लोराइड)', correct: true },
          { key: 'B', en: 'KCl', hi: 'KCl (पोटैशियम क्लोराइड)', correct: false },
          { key: 'C', en: 'CaCO3', hi: 'CaCO3 (कैल्शियम कार्बोनेट)', correct: false },
          { key: 'D', en: 'NaHCO3', hi: 'NaHCO3 (बेकिंग सोडा)', correct: false },
        ],
      },
      {
        subject: 'Mathematics',
        num: 4,
        en: 'What is the approximate value of Pi (π)?',
        hi: 'पाई (π) का अनुमानित मान क्या है?',
        options: [
          { key: 'A', en: '3.12', hi: '3.12', correct: false },
          { key: 'B', en: '3.14', hi: '3.14', correct: true },
          { key: 'C', en: '3.16', hi: '3.16', correct: false },
          { key: 'D', en: '3.18', hi: '3.18', correct: false },
        ],
      },
      {
        subject: 'Mathematics',
        num: 5,
        en: 'The roots of quadratic equation x² - 5x + 6 = 0 are:',
        hi: 'द्विघात समीकरण x² - 5x + 6 = 0 के मूल क्या हैं?',
        options: [
          { key: 'A', en: '1 and 6', hi: '1 और 6', correct: false },
          { key: 'B', en: '2 and 3', hi: '2 और 3', correct: true },
          { key: 'C', en: '-2 and -3', hi: '-2 और -3', correct: false },
          { key: 'D', en: '1 and 5', hi: '1 और 5', correct: false },
        ],
      },
      {
        subject: 'Mathematics',
        num: 6,
        en: 'In a right-angled triangle, if base = 3 and height = 4, hypotenuse is:',
        hi: 'एक समकोण त्रिभुज में, यदि आधार = 3 और लंब = 4 है, तो कर्ण कितना होगा?',
        options: [
          { key: 'A', en: '5', hi: '5', correct: true },
          { key: 'B', en: '6', hi: '6', correct: false },
          { key: 'C', en: '7', hi: '7', correct: false },
          { key: 'D', en: '8', hi: '8', correct: false },
        ],
      },
      {
        subject: 'Social Science',
        num: 7,
        en: 'Who was the first President of independent India?',
        hi: 'स्वतंत्र भारत के प्रथम राष्ट्रपति कौन थे?',
        options: [
          { key: 'A', en: 'Dr. B.R. Ambedkar', hi: 'डॉ. बी.आर. अम्बेडकर', correct: false },
          { key: 'B', en: 'Dr. Rajendra Prasad', hi: 'डॉ. राजेन्द्र प्रसाद', correct: true },
          { key: 'C', en: 'Jawaharlal Nehru', hi: 'जवाहरलाल नेहरू', correct: false },
          { key: 'D', en: 'Sardar Patel', hi: 'सरदार पटेल', correct: false },
        ],
      },
      {
        subject: 'Social Science',
        num: 8,
        en: 'Which is the longest river in India?',
        hi: 'भारत की सबसे लंबी नदी कौन सी है?',
        options: [
          { key: 'A', en: 'Yamuna', hi: 'यमुना', correct: false },
          { key: 'B', en: 'Brahmaputra', hi: 'ब्रह्मपुत्र', correct: false },
          { key: 'C', en: 'Ganga', hi: 'गंगा', correct: true },
          { key: 'D', en: 'Godavari', hi: 'गोदावरी', correct: false },
        ],
      },
      {
        subject: 'Pedagogy & CDP',
        num: 9,
        en: 'Which teaching approach is most effective for inclusive classrooms?',
        hi: 'समावेशी कक्षा के लिए कौन सा शिक्षण दृष्टिकोण सबसे प्रभावी है?',
        options: [
          { key: 'A', en: 'Rote memorization', hi: 'रटने की पद्धति', correct: false },
          { key: 'B', en: 'Differentiated instruction', hi: 'विभेदित निर्देश (Differentiated Instruction)', correct: true },
          { key: 'C', en: 'Uniform lecturing', hi: 'एकसमान व्याख्यान', correct: false },
          { key: 'D', en: 'Strict penalties', hi: 'कठोर दंड', correct: false },
        ],
      },
      {
        subject: 'Pedagogy & CDP',
        num: 10,
        en: 'Constructivism in education emphasizes:',
        hi: 'शिक्षा में रचनावाद (Constructivism) किस पर बल देता है?',
        options: [
          { key: 'A', en: 'Passive reception of facts', hi: 'तथ्यों का निष्क्रिय ग्रहण', correct: false },
          { key: 'B', en: 'Learner actively constructing knowledge', hi: 'शिक्षार्थी द्वारा सक्रिय रूप से ज्ञान का निर्माण', correct: true },
          { key: 'C', en: 'Standardized penalties', hi: 'मानकीकृत दंड', correct: false },
          { key: 'D', en: 'Strict textbook compliance', hi: 'पाठ्यपुस्तक का कठोर अनुपालन', correct: false },
        ],
      },
    ];

    const questionIds = [];
    for (const q of questionsData) {
      const qRes = await client.query(
        `INSERT INTO questions
           (exam_id, subject_id, question_number, question_text_en, question_text_hi)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [examId, subjectMap[q.subject], q.num, q.en, q.hi]
      );
      const qId = qRes.rows[0].id;
      questionIds.push({ id: qId, subject: q.subject, options: q.options });

      for (const opt of q.options) {
        await client.query(
          `INSERT INTO question_options
             (question_id, option_key, option_text_en, option_text_hi, is_correct)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (question_id, option_key) DO NOTHING`,
          [qId, opt.key, opt.en, opt.hi, opt.correct]
        );
      }
    }

    // 4. Admin User ID
    const adminUser = await client.query(`SELECT id FROM users WHERE role='admin' LIMIT 1`);
    const adminId = adminUser.rows[0]?.id;

    // 5. Create Practice Tests
    // Test 1: Class 10 Science & Math (target_role: 'both')
    const test1Res = await client.query(
      `INSERT INTO practice_tests
         (title, description, subject_id, class_level, duration_mins, total_marks, is_published, target_role, created_by)
       VALUES
         ('Class 10 Science & Math Practice Exam',
          'Comprehensive mock test covering Cell Biology, Photosynthesis, Quadratic Equations & Geometry.',
          $1, 10, 20, 6, true, 'both', $2)
       RETURNING id`,
      [subjectMap['Science'], adminId]
    );
    const test1Id = test1Res.rows[0].id;
    for (let i = 0; i < 6; i++) {
      await client.query(
        `INSERT INTO test_questions (test_id, question_id, marks, display_order)
         VALUES ($1, $2, 1, $3) ON CONFLICT DO NOTHING`,
        [test1Id, questionIds[i].id, i + 1]
      );
    }

    // Test 2: Teacher Skill & Pedagogy Assessment (target_role: 'teacher')
    const test2Res = await client.query(
      `INSERT INTO practice_tests
         (title, description, subject_id, class_level, duration_mins, total_marks, is_published, target_role, created_by)
       VALUES
         ('Teacher Skill & Pedagogy Assessment',
          'Professional development test on inclusive teaching, cognitive styles, and constructivist classrooms.',
          $1, 10, 15, 2, true, 'teacher', $2)
       RETURNING id`,
      [subjectMap['Pedagogy & CDP'], adminId]
    );
    const test2Id = test2Res.rows[0].id;
    await client.query(
      `INSERT INTO test_questions (test_id, question_id, marks, display_order)
       VALUES ($1, $2, 1, 1), ($1, $3, 1, 2) ON CONFLICT DO NOTHING`,
      [test2Id, questionIds[8].id, questionIds[9].id]
    );

    // Test 3: Class 10 Social Science Quick Practice (target_role: 'student')
    const test3Res = await client.query(
      `INSERT INTO practice_tests
         (title, description, subject_id, class_level, duration_mins, total_marks, is_published, target_role, created_by)
       VALUES
         ('Class 10 Social Science Quick Practice',
          'Key questions on Indian history, constitution, and geography.',
          $1, 10, 15, 2, true, 'student', $2)
       RETURNING id`,
      [subjectMap['Social Science'], adminId]
    );
    const test3Id = test3Res.rows[0].id;
    await client.query(
      `INSERT INTO test_questions (test_id, question_id, marks, display_order)
       VALUES ($1, $2, 1, 1), ($1, $3, 1, 2) ON CONFLICT DO NOTHING`,
      [test3Id, questionIds[6].id, questionIds[7].id]
    );

    // 6. Create Sample Study Materials
    const materials = [
      {
        title: 'Class 10 Science Formulae & Concept Guide (PDF)',
        desc: 'Quick revision sheets for Physics, Chemistry and Biology topics.',
        url: '/uploads/materials/Class10_Science_Revision_Guide.pdf',
        name: 'Class10_Science_Revision_Guide.pdf',
        type: 'pdf',
        size: 1048576,
        sub: 'Science',
        class: 10,
      },
      {
        title: 'Mathematics Theorem & Solved Problems Handbook',
        desc: 'Step-by-step solutions for Quadratic equations, Trigonometry, and Circles.',
        url: '/uploads/materials/Class10_Math_Handbook.pdf',
        name: 'Class10_Math_Handbook.pdf',
        type: 'pdf',
        size: 2097152,
        sub: 'Mathematics',
        class: 10,
      },
      {
        title: 'Social Science Map Work & History Timeline',
        desc: 'Visual timelines and map locations for board exams.',
        url: '/uploads/materials/SST_Visual_Timeline.pdf',
        name: 'SST_Visual_Timeline.pdf',
        type: 'pdf',
        size: 1572864,
        sub: 'Social Science',
        class: 10,
      },
    ];

    for (const m of materials) {
      await client.query(
        `INSERT INTO study_materials
           (title, description, file_url, file_name, file_type, file_size_bytes, subject_id, class_level, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [m.title, m.desc, m.url, m.name, m.type, m.size, subjectMap[m.sub], m.class, adminId]
      );
    }

    // 7. Create Sample Notifications
    const notices = [
      {
        title: '📢 Board Exam Practice Series Live!',
        body: 'Weekly mock tests for Class 10 students and teachers are now accessible. Results with detailed solutions are provided instantly.',
        important: true,
        role: 'all',
      },
      {
        title: '🎯 Special Doubt Clearing & Revision Sessions',
        body: 'Parents are requested to review their child\'s subject accuracy report in the Parent Portal and download revision materials.',
        important: false,
        role: 'parent',
      },
      {
        title: '👨‍🏫 Teacher Skill Progress Modules Active',
        body: 'Teachers can now self-evaluate pedagogical readiness through timed tests and view score history anytime.',
        important: false,
        role: 'teacher',
      },
    ];

    for (const n of notices) {
      await client.query(
        `INSERT INTO notifications (title, body, is_important, target_role, created_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [n.title, n.body, n.important, n.role, adminId]
      );
    }

    // 8. Seed Rahul Kumar's Completed Attempt
    const studentUser = await client.query(`SELECT id FROM users WHERE email='student@shiksha.local'`);
    const studentId = studentUser.rows[0]?.id;

    if (studentId) {
      const attemptRes = await client.query(
        `INSERT INTO test_attempts
           (test_id, user_id, started_at, submitted_at, score, total_marks, percentage, time_taken_sec, status)
         VALUES
           ($1, $2, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 45 minutes', 5, 6, 83.33, 900, 'submitted')
         RETURNING id`,
        [test1Id, studentId]
      );

      if (attemptRes.rows[0]) {
        const attId = attemptRes.rows[0].id;
        for (let i = 0; i < 6; i++) {
          const q = questionsData[i];
          const isCorrect = i !== 3; // Answered 5 correctly
          await client.query(
            `INSERT INTO attempt_answers
               (attempt_id, question_id, selected_key, is_correct, time_spent_sec)
             VALUES ($1, $2, $3, $4, $5)`,
            [attId, questionIds[i].id, isCorrect ? 'B' : 'C', isCorrect, 150]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Demo content seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding error:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seedContent();
