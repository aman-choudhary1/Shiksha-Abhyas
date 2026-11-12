const express = require('express');
const path    = require('path');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadExcel, uploadMaterial } = require('../middleware/upload.middleware');
const ApiResponse = require('../utils/apiResponse');
const db          = require('../config/db');

// Ported services from demo
const QuestionImportService = require('../services/questionImport.service');

const router = express.Router();

// ── Public Template Download (No Auth required for template download) ──
router.get('/question-imports/template', async (req, res, next) => {
  try {
    const fs = require('fs');
    const { generateTemplate } = require('../../scripts/generate_template');
    const templatePath = path.join(__dirname, '../../fixtures/CGTET2016_Minimal_Question_Upload.xlsx');
    if (!fs.existsSync(templatePath)) {
      await generateTemplate(templatePath);
    }
    res.setHeader('Content-Disposition', 'attachment; filename="CGTET2016_Minimal_Question_Upload.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.sendFile(templatePath);
  } catch (err) { next(err); }
});

// ── Authenticated Admin Routes ────────────────────────────────
router.use(authenticate, authorize('admin'));

// ── DASHBOARD STATS ──────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [questions, tests, users, materials] = await Promise.all([
      db.query('SELECT COUNT(*) FROM questions'),
      db.query('SELECT COUNT(*) FILTER (WHERE is_published) AS published, COUNT(*) AS total FROM practice_tests'),
      db.query(`SELECT
                  COUNT(*) FILTER (WHERE role='teacher') AS teachers,
                  COUNT(*) FILTER (WHERE role='student') AS students,
                  COUNT(*) FILTER (WHERE role='parent')  AS parents
                FROM users WHERE is_active = true`),
      db.query('SELECT COUNT(*) FROM study_materials WHERE is_active = true'),
    ]);

    return ApiResponse.success(res, {
      questions:  parseInt(questions.rows[0].count),
      tests:      { total: parseInt(tests.rows[0].total), published: parseInt(tests.rows[0].published) },
      users:      users.rows[0],
      materials:  parseInt(materials.rows[0].count),
    }, 'Stats fetched');
  } catch (err) { next(err); }
});

// ── EXCEL QUESTION IMPORT (ported from demo) ──────────────────

router.post('/question-imports/validate', (req, res, next) => {
  uploadExcel(req, res, async (err) => {
    if (err) return ApiResponse.error(res, err.message, 400);
    if (!req.file) return ApiResponse.error(res, 'No Excel file uploaded', 400);
    try {
      const result = await QuestionImportService.validateUpload(
        req.file.buffer, req.file.originalname, req.body
      );
      return ApiResponse.success(res, result, 'Validation complete');
    } catch (e) { next(e); }
  });
});

router.post('/question-imports', (req, res, next) => {
  uploadExcel(req, res, async (err) => {
    if (err) return ApiResponse.error(res, err.message, 400);
    if (!req.file) return ApiResponse.error(res, 'No Excel file uploaded', 400);
    try {
      const { mode, duplicate_policy, confirm_replace, exam_name, year, language } = req.body;
      const result = await QuestionImportService.importQuestions(
        req.file.buffer, req.file.originalname,
        { mode, duplicate_policy, confirm_replace: confirm_replace === 'true', exam_name, year, language }
      );
      return ApiResponse.created(res, result, 'Questions imported successfully');
    } catch (e) { next(e); }
  });
});

router.get('/question-imports/history', async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT ij.id, ij.file_name, ij.status, ij.total_rows, ij.imported_rows,
              ij.failed_rows, ij.created_at, e.name AS exam_name, e.year
         FROM import_jobs ij
    LEFT JOIN exams e ON e.id = ij.exam_id
        ORDER BY ij.created_at DESC LIMIT 50`
    );
    return ApiResponse.success(res, r.rows, 'Import history fetched');
  } catch (err) { next(err); }
});

// ── PRACTICE TESTS ────────────────────────────────────────────
router.get('/tests', async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT pt.id, pt.title, pt.description, pt.total_marks, pt.duration_mins,
              pt.class_level, pt.is_published, pt.target_role, pt.created_at,
              s.name AS subject_name,
              COUNT(tq.question_id) AS question_count
         FROM practice_tests pt
    LEFT JOIN subjects s ON s.id = pt.subject_id
    LEFT JOIN test_questions tq ON tq.test_id = pt.id
        GROUP BY pt.id, s.name
        ORDER BY pt.created_at DESC`
    );
    return ApiResponse.success(res, r.rows, 'Tests fetched');
  } catch (err) { next(err); }
});

router.post('/tests', async (req, res, next) => {
  try {
    const { title, description, subject_id, class_level, duration_mins, target_role, question_ids } = req.body;
    if (!title) return ApiResponse.error(res, 'title is required', 400);

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Calculate total marks from question_ids
      let totalMarks = 0;
      if (question_ids?.length) {
        const marksRes = await client.query(
          `SELECT COUNT(*) AS cnt FROM questions WHERE id = ANY($1::bigint[])`,
          [question_ids]
        );
        totalMarks = parseInt(marksRes.rows[0].cnt, 10); // 1 mark per question default
      }

      const ins = await client.query(
        `INSERT INTO practice_tests
           (title, description, subject_id, class_level, duration_mins, target_role, total_marks, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [title, description || null, subject_id || null, class_level || null,
         duration_mins || 30, target_role || 'both', totalMarks, req.user.id]
      );
      const testId = ins.rows[0].id;

      // Insert test-question links
      if (question_ids?.length) {
        const values = question_ids.map((qid, i) =>
          `($1, $${i + 2}, 1, ${i + 1})`
        ).join(', ');
        await client.query(
          `INSERT INTO test_questions (test_id, question_id, marks, display_order) VALUES ${values}`,
          [testId, ...question_ids]
        );
      }

      await client.query('COMMIT');
      return ApiResponse.created(res, { id: testId }, 'Test created');
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally { client.release(); }
  } catch (err) { next(err); }
});

router.put('/tests/:id/publish', async (req, res, next) => {
  try {
    const { publish } = req.body;
    await db.query(
      `UPDATE practice_tests SET is_published = $1, updated_at = NOW() WHERE id = $2`,
      [publish !== false, req.params.id]
    );
    return ApiResponse.success(res, null, publish !== false ? 'Test published' : 'Test unpublished');
  } catch (err) { next(err); }
});

router.delete('/tests/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM practice_tests WHERE id = $1', [req.params.id]);
    return ApiResponse.success(res, null, 'Test deleted');
  } catch (err) { next(err); }
});

// ── QUESTIONS BROWSER (for test builder) ─────────────────────
router.get('/questions', async (req, res, next) => {
  try {
    const { subject_id, exam_id, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    if (subject_id) { params.push(subject_id); conditions.push(`q.subject_id = $${params.length}`); }
    if (exam_id)    { params.push(exam_id);    conditions.push(`q.exam_id = $${params.length}`); }
    if (search)     { params.push(`%${search}%`); conditions.push(`q.question_text_en ILIKE $${params.length}`); }

    params.push(parseInt(limit), offset);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const r = await db.query(
      `SELECT q.id, q.question_number, q.question_text_en, q.question_text_hi,
              s.name AS subject_name, e.name AS exam_name, e.year
         FROM questions q
    LEFT JOIN subjects s ON s.id = q.subject_id
    LEFT JOIN exams e    ON e.id = q.exam_id
        ${where}
        ORDER BY q.id DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countRes = await db.query(
      `SELECT COUNT(*) FROM questions q ${where}`,
      params.slice(0, -2)
    );

    return ApiResponse.success(res, {
      questions: r.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(countRes.rows[0].count) },
    }, 'Questions fetched');
  } catch (err) { next(err); }
});

// ── STUDY MATERIALS ───────────────────────────────────────────
router.get('/materials', async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT sm.id, sm.title, sm.description, sm.file_url, sm.file_name, sm.file_type,
              sm.file_size_bytes, sm.download_count, sm.is_active, sm.created_at,
              s.name AS subject_name, sm.class_level
         FROM study_materials sm
    LEFT JOIN subjects s ON s.id = sm.subject_id
        ORDER BY sm.created_at DESC`
    );
    return ApiResponse.success(res, r.rows, 'Materials fetched');
  } catch (err) { next(err); }
});

router.post('/materials', (req, res, next) => {
  uploadMaterial(req, res, async (err) => {
    if (err) return ApiResponse.error(res, err.message, 400);
    if (!req.file) return ApiResponse.error(res, 'No file uploaded', 400);
    try {
      const { title, description, subject_id, class_level } = req.body;
      if (!title) return ApiResponse.error(res, 'title is required', 400);

      const fileUrl  = `/uploads/materials/${req.file.filename}`;
      const fileType = path.extname(req.file.originalname).replace('.', '').toLowerCase();

      const ins = await db.query(
        `INSERT INTO study_materials (title, description, file_url, file_name, file_type,
                                      file_size_bytes, subject_id, class_level, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, title, file_url`,
        [title, description || null, fileUrl, req.file.originalname, fileType,
         req.file.size, subject_id || null, class_level || null, req.user.id]
      );
      return ApiResponse.created(res, ins.rows[0], 'Material uploaded');
    } catch (e) { next(e); }
  });
});

router.delete('/materials/:id', async (req, res, next) => {
  try {
    await db.query('UPDATE study_materials SET is_active = false WHERE id = $1', [req.params.id]);
    return ApiResponse.success(res, null, 'Material removed');
  } catch (err) { next(err); }
});

// ── NOTIFICATIONS ─────────────────────────────────────────────
router.get('/notifications', async (req, res, next) => {
  try {
    const r = await db.query('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100');
    return ApiResponse.success(res, r.rows, 'Notifications fetched');
  } catch (err) { next(err); }
});

router.post('/notifications', async (req, res, next) => {
  try {
    const { title, body, is_important, target_role } = req.body;
    if (!title) return ApiResponse.error(res, 'title is required', 400);

    const ins = await db.query(
      `INSERT INTO notifications (title, body, is_important, target_role, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, body || null, is_important || false, target_role || 'all', req.user.id]
    );
    return ApiResponse.created(res, ins.rows[0], 'Notification posted');
  } catch (err) { next(err); }
});

router.delete('/notifications/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
    return ApiResponse.success(res, null, 'Notification deleted');
  } catch (err) { next(err); }
});

// ── USER MANAGEMENT ───────────────────────────────────────────
router.get('/users', async (req, res, next) => {
  try {
    const { role } = req.query;
    const r = await db.query(
      `SELECT id, full_name, email, phone, role, is_active, created_at
         FROM users
        WHERE ($1::text IS NULL OR role = $1)
        ORDER BY created_at DESC`,
      [role || null]
    );
    return ApiResponse.success(res, r.rows, 'Users fetched');
  } catch (err) { next(err); }
});

router.patch('/users/:id/toggle', async (req, res, next) => {
  try {
    const r = await db.query(
      `UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active, full_name`,
      [req.params.id]
    );
    if (!r.rowCount) return ApiResponse.notFound(res, 'User not found');
    return ApiResponse.success(res, r.rows[0], `User ${r.rows[0].is_active ? 'activated' : 'deactivated'}`);
  } catch (err) { next(err); }
});

// ── SUBJECTS ──────────────────────────────────────────────────
router.get('/subjects', async (req, res, next) => {
  try {
    const r = await db.query('SELECT id, name FROM subjects ORDER BY name');
    return ApiResponse.success(res, r.rows, 'Subjects fetched');
  } catch (err) { next(err); }
});

module.exports = router;
