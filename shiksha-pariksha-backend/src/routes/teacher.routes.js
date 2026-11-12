const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const AttemptService = require('../services/attempt.service');
const ApiResponse    = require('../utils/apiResponse');
const db             = require('../config/db');

const router = express.Router();
router.use(authenticate, authorize('teacher'));

// GET /api/teacher/tests — browse available published tests
router.get('/tests', async (req, res, next) => {
  try {
    const { subject_id, class_level, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [`pt.is_published = true`, `pt.target_role IN ('teacher','both')`];
    const params     = [];

    if (subject_id) { params.push(subject_id);   conditions.push(`pt.subject_id = $${params.length}`); }
    if (class_level){ params.push(class_level);  conditions.push(`pt.class_level = $${params.length}`); }

    params.push(parseInt(limit), offset);

    const testsRes = await db.query(
      `SELECT pt.id, pt.title, pt.description, pt.total_marks, pt.duration_mins,
              pt.class_level, pt.publish_at, pt.expires_at,
              s.name AS subject_name,
              ta.id AS my_attempt_id, ta.status AS my_status,
              ta.score, ta.percentage
         FROM practice_tests pt
    LEFT JOIN subjects s ON s.id = pt.subject_id
    LEFT JOIN test_attempts ta ON ta.test_id = pt.id AND ta.user_id = $1
        WHERE pt.is_published = true AND pt.target_role IN ('teacher','both')
        ORDER BY pt.created_at DESC
        LIMIT $2 OFFSET $3`,
      [req.user.id, parseInt(limit), offset]
    );

    return ApiResponse.success(res, { tests: testsRes.rows }, 'Tests fetched');
  } catch (err) { next(err); }
});

// POST /api/teacher/attempts/start
router.post('/attempts/start', async (req, res, next) => {
  try {
    const { test_id } = req.body;
    if (!test_id) return ApiResponse.error(res, 'test_id is required', 400);

    const result = await AttemptService.startAttempt(parseInt(test_id), req.user.id);
    return ApiResponse.success(res, result, result.resumed ? 'Attempt resumed' : 'Attempt started');
  } catch (err) { next(err); }
});

// GET /api/teacher/attempts/:id/questions
router.get('/attempts/:id/questions', async (req, res, next) => {
  try {
    const data = await AttemptService.getAttemptQuestions(parseInt(req.params.id), req.user.id);
    return ApiResponse.success(res, data, 'Questions fetched');
  } catch (err) { next(err); }
});

// POST /api/teacher/attempts/:id/answer
router.post('/attempts/:id/answer', async (req, res, next) => {
  try {
    const { question_id, selected_key, time_spent_sec } = req.body;
    if (!question_id || !selected_key) return ApiResponse.error(res, 'question_id and selected_key are required', 400);

    const data = await AttemptService.saveAnswer(
      parseInt(req.params.id), req.user.id,
      parseInt(question_id), selected_key.toUpperCase(), time_spent_sec
    );
    return ApiResponse.success(res, data, 'Answer saved');
  } catch (err) { next(err); }
});

// POST /api/teacher/attempts/:id/submit
router.post('/attempts/:id/submit', async (req, res, next) => {
  try {
    const result = await AttemptService.submitAttempt(parseInt(req.params.id), req.user.id);
    return ApiResponse.success(res, result, 'Test submitted successfully');
  } catch (err) { next(err); }
});

// GET /api/teacher/results
router.get('/results', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const data = await AttemptService.getUserResults(req.user.id, parseInt(page), parseInt(limit));
    return ApiResponse.success(res, data, 'Results fetched');
  } catch (err) { next(err); }
});

module.exports = router;
