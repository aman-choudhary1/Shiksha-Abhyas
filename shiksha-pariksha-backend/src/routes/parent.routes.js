const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ApiResponse = require('../utils/apiResponse');
const db          = require('../config/db');

const router = express.Router();
router.use(authenticate, authorize('parent'));

// GET /api/parent/children — list linked children
router.get('/children', async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone,
              sp.class_level, sp.section, sp.school_name, sp.board,
              sp.roll_number
         FROM parent_student_links psl
         JOIN users u              ON u.id = psl.student_user_id
    LEFT JOIN student_profiles sp  ON sp.user_id = u.id
        WHERE psl.parent_user_id = $1`,
      [req.user.id]
    );
    return ApiResponse.success(res, r.rows, 'Children fetched');
  } catch (err) { next(err); }
});

// GET /api/parent/children/:studentId/report — performance report
router.get('/children/:studentId/report', async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Verify parent-child link
    const link = await db.query(
      `SELECT 1 FROM parent_student_links WHERE parent_user_id = $1 AND student_user_id = $2`,
      [req.user.id, studentId]
    );
    if (!link.rowCount) return ApiResponse.forbidden(res, 'Child not linked to this account');

    // Overall stats
    const stats = await db.query(
      `SELECT
         COUNT(*)                                            AS total_attempts,
         COUNT(*) FILTER (WHERE status = 'submitted')       AS completed,
         AVG(percentage) FILTER (WHERE status = 'submitted') AS avg_percentage,
         MAX(percentage) FILTER (WHERE status = 'submitted') AS best_percentage,
         SUM(score)      FILTER (WHERE status = 'submitted') AS total_score_earned
         FROM test_attempts WHERE user_id = $1`,
      [studentId]
    );

    // Subject-wise breakdown
    const subjectStats = await db.query(
      `SELECT s.name AS subject,
              COUNT(ta.id)   AS attempts,
              AVG(ta.percentage) AS avg_pct,
              MAX(ta.percentage) AS best_pct
         FROM test_attempts ta
         JOIN practice_tests pt ON pt.id = ta.test_id
    LEFT JOIN subjects s        ON s.id = pt.subject_id
        WHERE ta.user_id = $1 AND ta.status = 'submitted'
        GROUP BY s.name ORDER BY avg_pct DESC`,
      [studentId]
    );

    // Recent results
    const recent = await db.query(
      `SELECT ta.id, pt.title, ta.score, ta.total_marks, ta.percentage,
              ta.submitted_at, s.name AS subject
         FROM test_attempts ta
         JOIN practice_tests pt ON pt.id = ta.test_id
    LEFT JOIN subjects s        ON s.id = pt.subject_id
        WHERE ta.user_id = $1 AND ta.status = 'submitted'
        ORDER BY ta.submitted_at DESC LIMIT 10`,
      [studentId]
    );

    return ApiResponse.success(res, {
      studentId: parseInt(studentId),
      overall: stats.rows[0],
      subjectBreakdown: subjectStats.rows,
      recentTests: recent.rows,
    }, 'Report fetched');
  } catch (err) { next(err); }
});

// GET /api/parent/materials — browse study materials
router.get('/materials', async (req, res, next) => {
  try {
    const { subject_id, class_level, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const r = await db.query(
      `SELECT sm.id, sm.title, sm.description, sm.file_url, sm.file_name,
              sm.file_type, sm.file_size_bytes, sm.download_count, sm.created_at,
              s.name AS subject_name, sm.class_level
         FROM study_materials sm
    LEFT JOIN subjects s ON s.id = sm.subject_id
        WHERE sm.is_active = true
          ${subject_id  ? `AND sm.subject_id  = ${parseInt(subject_id)}`  : ''}
          ${class_level ? `AND sm.class_level = ${parseInt(class_level)}` : ''}
        ORDER BY sm.created_at DESC
        LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );
    return ApiResponse.success(res, { materials: r.rows }, 'Materials fetched');
  } catch (err) { next(err); }
});

// GET /api/parent/materials/:id/download — increment download count + return URL
router.get('/materials/:id/download', async (req, res, next) => {
  try {
    const r = await db.query(
      `UPDATE study_materials SET download_count = download_count + 1
        WHERE id = $1 AND is_active = true
       RETURNING id, title, file_url, file_name, file_type`,
      [req.params.id]
    );
    if (!r.rowCount) return ApiResponse.notFound(res, 'Material not found');
    return ApiResponse.success(res, r.rows[0], 'Download URL ready');
  } catch (err) { next(err); }
});

// GET /api/parent/notifications
router.get('/notifications', async (req, res, next) => {
  try {
    const r = await db.query(
      `SELECT n.id, n.title, n.body, n.is_important, n.created_at,
              nr.read_at
         FROM notifications n
    LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = $1
        WHERE n.target_role IN ('parent','all')
        ORDER BY n.is_important DESC, n.created_at DESC
        LIMIT 50`,
      [req.user.id]
    );
    return ApiResponse.success(res, r.rows, 'Notifications fetched');
  } catch (err) { next(err); }
});

// POST /api/parent/notifications/:id/read
router.post('/notifications/:id/read', async (req, res, next) => {
  try {
    await db.query(
      `INSERT INTO notification_reads (user_id, notification_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.id]
    );
    return ApiResponse.success(res, null, 'Marked as read');
  } catch (err) { next(err); }
});

module.exports = router;
