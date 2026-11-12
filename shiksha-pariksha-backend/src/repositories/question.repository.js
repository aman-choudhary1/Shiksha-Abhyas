const db = require('../config/db');

class QuestionRepository {
  /**
   * Inserts a single question record
   */
  static async insertQuestion(client, { exam_id, subject_id, question_number, question_text_en, question_text_hi }) {
    const runner = client || db;
    const sql = `
      INSERT INTO questions (exam_id, subject_id, question_number, question_text_en, question_text_hi)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, exam_id, subject_id, question_number, question_text_en, question_text_hi, created_at
    `;
    const res = await runner.query(sql, [
      exam_id,
      subject_id,
      question_number || null,
      question_text_en || null,
      question_text_hi || null,
    ]);
    return res.rows[0];
  }

  /**
   * Inserts the 4 options for a question
   */
  static async insertQuestionOptions(client, questionId, options) {
    const runner = client || db;
    const inserted = [];

    for (const opt of options) {
      const sql = `
        INSERT INTO question_options (question_id, option_key, option_text_en, option_text_hi, is_correct)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, question_id, option_key, option_text_en, option_text_hi, is_correct
      `;
      const res = await runner.query(sql, [
        questionId,
        opt.key,
        opt.text_en || null,
        opt.text_hi || null,
        Boolean(opt.is_correct),
      ]);
      inserted.push(res.rows[0]);
    }

    return inserted;
  }

  /**
   * Deletes all questions for an exam (used by 'replace_exam' duplicate policy)
   */
  static async deleteExamQuestions(client, examId) {
    const runner = client || db;
    const sql = `DELETE FROM questions WHERE exam_id = $1 RETURNING id`;
    const res = await runner.query(sql, [examId]);
    return res.rowCount;
  }

  /**
   * Finds existing questions in DB matching exam, subject, and question numbers
   */
  static async findExistingQuestions(client, examId, subjectId, questionNumbers = []) {
    if (!questionNumbers || questionNumbers.length === 0) return [];
    const runner = client || db;

    const sql = `
      SELECT q.id, q.question_number, q.question_text_en, q.question_text_hi, s.name as subject_name
      FROM questions q
      JOIN subjects s ON q.subject_id = s.id
      WHERE q.exam_id = $1 AND q.subject_id = $2 AND q.question_number = ANY($3::int[])
    `;
    const res = await runner.query(sql, [examId, subjectId, questionNumbers]);
    return res.rows;
  }

  /**
   * Lists questions with pagination and filters
   * NOTE: is_correct is strictly suppressed unless includeAnswerKey = true
   */
  static async listQuestions({ examId, subjectId, search, page = 1, limit = 20 }, includeAnswerKey = false) {
    const offset = (page - 1) * limit;
    const whereClauses = [];
    const params = [];
    let paramIndex = 1;

    if (examId) {
      whereClauses.push(`q.exam_id = $${paramIndex++}`);
      params.push(examId);
    }

    if (subjectId) {
      whereClauses.push(`q.subject_id = $${paramIndex++}`);
      params.push(subjectId);
    }

    if (search) {
      whereClauses.push(`(q.question_text_en ILIKE $${paramIndex} OR q.question_text_hi ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count query
    const countSql = `
      SELECT COUNT(*)::int as total
      FROM questions q
      ${whereStr}
    `;
    const countRes = await db.query(countSql, params);
    const total = countRes.rows[0].total;

    // Fetch questions
    const questionSql = `
      SELECT 
        q.id,
        q.exam_id,
        e.name as exam_name,
        e.year as exam_year,
        q.subject_id,
        s.name as subject_name,
        q.question_number,
        q.question_text_en,
        q.question_text_hi,
        q.created_at
      FROM questions q
      JOIN exams e ON q.exam_id = e.id
      JOIN subjects s ON q.subject_id = s.id
      ${whereStr}
      ORDER BY q.exam_id ASC, q.subject_id ASC, q.question_number ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const questionRes = await db.query(questionSql, params);
    const questions = questionRes.rows;

    if (questions.length === 0) {
      return { items: [], pagination: { page, limit, total } };
    }

    // Fetch options for all returned questions
    const questionIds = questions.map((q) => q.id);
    const optSql = `
      SELECT 
        id,
        question_id,
        option_key,
        option_text_en,
        option_text_hi
        ${includeAnswerKey ? ', is_correct' : ''}
      FROM question_options
      WHERE question_id = ANY($1::bigint[])
      ORDER BY question_id ASC, option_key ASC
    `;
    const optRes = await db.query(optSql, [questionIds]);

    const optionsByQId = new Map();
    optRes.rows.forEach((opt) => {
      if (!optionsByQId.has(opt.question_id)) {
        optionsByQId.set(opt.question_id, []);
      }
      optionsByQId.get(opt.question_id).push(opt);
    });

    const items = questions.map((q) => ({
      ...q,
      options: optionsByQId.get(q.id) || [],
    }));

    return {
      items,
      pagination: { page, limit, total },
    };
  }

  /**
   * Retrieves single question with options
   */
  static async getQuestionById(id, includeAnswerKey = false) {
    const qSql = `
      SELECT 
        q.id,
        q.exam_id,
        e.name as exam_name,
        e.year as exam_year,
        q.subject_id,
        s.name as subject_name,
        q.question_number,
        q.question_text_en,
        q.question_text_hi,
        q.created_at,
        q.updated_at
      FROM questions q
      JOIN exams e ON q.exam_id = e.id
      JOIN subjects s ON q.subject_id = s.id
      WHERE q.id = $1
    `;
    const qRes = await db.query(qSql, [id]);
    if (qRes.rowCount === 0) return null;

    const question = qRes.rows[0];

    const optSql = `
      SELECT 
        id,
        question_id,
        option_key,
        option_text_en,
        option_text_hi
        ${includeAnswerKey ? ', is_correct' : ''}
      FROM question_options
      WHERE question_id = $1
      ORDER BY option_key ASC
    `;
    const optRes = await db.query(optSql, [id]);
    question.options = optRes.rows;

    return question;
  }
}

module.exports = QuestionRepository;
