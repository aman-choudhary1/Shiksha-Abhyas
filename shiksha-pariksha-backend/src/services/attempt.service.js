const db = require('../config/db');

class AttemptService {
  /**
   * Start a new test attempt for a user (teacher or student)
   * Prevents duplicate active attempts
   */
  static async startAttempt(testId, userId) {
    // Check test exists and is published
    const testRes = await db.query(
      `SELECT id, title, duration_mins, total_marks, is_published, expires_at, target_role
         FROM practice_tests WHERE id = $1`,
      [testId]
    );

    const test = testRes.rows[0];
    if (!test) {
      const err = new Error('Test not found');
      err.statusCode = 404;
      throw err;
    }
    if (!test.is_published) {
      const err = new Error('This test is not yet published');
      err.statusCode = 403;
      throw err;
    }
    if (test.expires_at && new Date(test.expires_at) < new Date()) {
      const err = new Error('This test has expired');
      err.statusCode = 410;
      throw err;
    }

    // Check for existing in-progress attempt
    const existing = await db.query(
      `SELECT id FROM test_attempts WHERE test_id = $1 AND user_id = $2 AND status = 'in_progress'`,
      [testId, userId]
    );
    if (existing.rowCount > 0) {
      return { attemptId: existing.rows[0].id, resumed: true, test };
    }

    // Create new attempt
    const ins = await db.query(
      `INSERT INTO test_attempts (test_id, user_id, total_marks, status)
       VALUES ($1, $2, $3, 'in_progress')
       RETURNING id`,
      [testId, userId, test.total_marks]
    );

    return { attemptId: ins.rows[0].id, resumed: false, test };
  }

  /**
   * Fetch test questions for an active attempt (never expose is_correct)
   */
  static async getAttemptQuestions(attemptId, userId) {
    const attempt = await this._verifyAttemptOwnership(attemptId, userId);

    const questionsRes = await db.query(
      `SELECT
         q.id,
         q.question_text_en,
         q.question_text_hi,
         q.question_number,
         tq.marks,
         tq.display_order,
         COALESCE(
           json_agg(
             json_build_object(
               'key', qo.option_key,
               'text_en', qo.option_text_en,
               'text_hi', qo.option_text_hi
             ) ORDER BY qo.option_key
           ), '[]'::json
         ) AS options,
         aa.selected_key
       FROM test_questions tq
       JOIN questions q        ON q.id = tq.question_id
       JOIN question_options qo ON qo.question_id = q.id
  LEFT JOIN attempt_answers aa ON aa.attempt_id = $1 AND aa.question_id = q.id
      WHERE tq.test_id = $2
      GROUP BY q.id, q.question_text_en, q.question_text_hi, q.question_number,
               tq.marks, tq.display_order, aa.selected_key
      ORDER BY tq.display_order NULLS LAST, q.question_number`,
      [attemptId, attempt.test_id]
    );

    return { attempt, questions: questionsRes.rows };
  }

  /**
   * Save/update a single answer during the attempt
   */
  static async saveAnswer(attemptId, userId, questionId, selectedKey, timeSpentSec) {
    await this._verifyAttemptOwnership(attemptId, userId);

    // Verify the question belongs to this attempt's test and get correct answer
    const qRes = await db.query(
      `SELECT qo.is_correct
         FROM test_questions tq
         JOIN question_options qo ON qo.question_id = tq.question_id AND qo.option_key = $1
        WHERE tq.question_id = $2
          AND tq.test_id = (SELECT test_id FROM test_attempts WHERE id = $3)`,
      [selectedKey, questionId, attemptId]
    );

    const isCorrect = qRes.rows[0]?.is_correct ?? false;

    await db.query(
      `INSERT INTO attempt_answers (attempt_id, question_id, selected_key, is_correct, time_spent_sec)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (attempt_id, question_id)
       DO UPDATE SET selected_key = EXCLUDED.selected_key,
                     is_correct   = EXCLUDED.is_correct,
                     time_spent_sec = EXCLUDED.time_spent_sec,
                     answered_at  = NOW()`,
      [attemptId, questionId, selectedKey, isCorrect, timeSpentSec || null]
    );

    return { saved: true, isCorrect };
  }

  /**
   * Submit the attempt — calculate score, mark as submitted
   */
  static async submitAttempt(attemptId, userId) {
    const attempt = await this._verifyAttemptOwnership(attemptId, userId);
    if (attempt.status !== 'in_progress') {
      const err = new Error('Attempt already submitted');
      err.statusCode = 400;
      throw err;
    }

    // Calculate score
    const scoreRes = await db.query(
      `SELECT
         SUM(CASE WHEN aa.is_correct THEN tq.marks ELSE 0 END) AS score,
         COUNT(aa.id) AS answered_count
         FROM attempt_answers aa
         JOIN test_questions tq ON tq.question_id = aa.question_id
            AND tq.test_id = $1
        WHERE aa.attempt_id = $2`,
      [attempt.test_id, attemptId]
    );

    const score     = parseInt(scoreRes.rows[0]?.score || 0, 10);
    const timeTaken = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
    const percentage = attempt.total_marks > 0
      ? parseFloat(((score / attempt.total_marks) * 100).toFixed(2))
      : 0;

    await db.query(
      `UPDATE test_attempts
          SET status = 'submitted', submitted_at = NOW(),
              score = $1, percentage = $2, time_taken_sec = $3
        WHERE id = $4`,
      [score, percentage, timeTaken, attemptId]
    );

    // Return result with correct answers
    const reviewRes = await db.query(
      `SELECT
         q.id AS question_id,
         q.question_text_en,
         aa.selected_key,
         aa.is_correct,
         (SELECT option_key FROM question_options WHERE question_id = q.id AND is_correct = true LIMIT 1) AS correct_key
       FROM attempt_answers aa
       JOIN questions q ON q.id = aa.question_id
      WHERE aa.attempt_id = $1
      ORDER BY q.question_number`,
      [attemptId]
    );

    return {
      attemptId,
      score,
      totalMarks: attempt.total_marks,
      percentage,
      timeTakenSec: timeTaken,
      answeredCount: parseInt(scoreRes.rows[0]?.answered_count || 0, 10),
      review: reviewRes.rows,
    };
  }

  /**
   * Get result history for a user
   */
  static async getUserResults(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const res = await db.query(
      `SELECT
         ta.id, ta.test_id, ta.score, ta.total_marks, ta.percentage,
         ta.time_taken_sec, ta.submitted_at, ta.status,
         pt.title, pt.duration_mins,
         s.name AS subject_name
       FROM test_attempts ta
       JOIN practice_tests pt ON pt.id = ta.test_id
  LEFT JOIN subjects s         ON s.id = pt.subject_id
      WHERE ta.user_id = $1 AND ta.status IN ('submitted','timed_out')
      ORDER BY ta.submitted_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countRes = await db.query(
      `SELECT COUNT(*) FROM test_attempts WHERE user_id = $1 AND status IN ('submitted','timed_out')`,
      [userId]
    );

    return {
      results: res.rows,
      pagination: {
        page, limit,
        total: parseInt(countRes.rows[0].count, 10),
        pages: Math.ceil(parseInt(countRes.rows[0].count, 10) / limit),
      },
    };
  }

  static async _verifyAttemptOwnership(attemptId, userId) {
    const res = await db.query(
      `SELECT * FROM test_attempts WHERE id = $1 AND user_id = $2`,
      [attemptId, userId]
    );
    if (!res.rows[0]) {
      const err = new Error('Attempt not found or access denied');
      err.statusCode = 404;
      throw err;
    }
    return res.rows[0];
  }
}

module.exports = AttemptService;
