const db = require('../config/db');

class ExamRepository {
  /**
   * Finds existing exam by name and year, or creates a new one
   */
  static async findOrCreateExam(client, { name, year, language, source_file }) {
    const runner = client || db;

    const findSql = `
      SELECT id, name, year, language, source_file, created_at
      FROM exams
      WHERE LOWER(name) = LOWER($1) AND (year = $2 OR (year IS NULL AND $2 IS NULL))
      LIMIT 1
    `;
    const findRes = await runner.query(findSql, [name, year || null]);

    if (findRes.rowCount > 0) {
      return { exam: findRes.rows[0], isNew: false };
    }

    const insertSql = `
      INSERT INTO exams (name, year, language, source_file)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, year, language, source_file, created_at
    `;
    const insertRes = await runner.query(insertSql, [name, year || null, language || null, source_file || null]);
    return { exam: insertRes.rows[0], isNew: true };
  }

  /**
   * Finds existing subject by unique name, or creates a new one
   */
  static async findOrCreateSubject(client, name) {
    const runner = client || db;
    const cleanName = name.trim();

    const findSql = `
      SELECT id, name, created_at
      FROM subjects
      WHERE LOWER(name) = LOWER($1)
      LIMIT 1
    `;
    const findRes = await runner.query(findSql, [cleanName]);
    if (findRes.rowCount > 0) {
      return findRes.rows[0];
    }

    const insertSql = `
      INSERT INTO subjects (name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, created_at
    `;
    const insertRes = await runner.query(insertSql, [cleanName]);
    return insertRes.rows[0];
  }

  /**
   * Retrieves all exams with question and subject counts
   */
  static async listExams() {
    const sql = `
      SELECT 
        e.id,
        e.name,
        e.year,
        e.language,
        e.source_file,
        e.created_at,
        COUNT(DISTINCT q.id)::int as total_questions,
        COUNT(DISTINCT q.subject_id)::int as total_subjects
      FROM exams e
      LEFT JOIN questions q ON e.id = q.exam_id
      GROUP BY e.id
      ORDER BY e.year DESC NULLS LAST, e.name ASC
    `;
    const res = await db.query(sql);
    return res.rows;
  }

  /**
   * Retrieves a single exam by ID
   */
  static async getExamById(id) {
    const sql = `
      SELECT 
        e.id,
        e.name,
        e.year,
        e.language,
        e.source_file,
        e.created_at,
        COUNT(DISTINCT q.id)::int as total_questions
      FROM exams e
      LEFT JOIN questions q ON e.id = q.exam_id
      WHERE e.id = $1
      GROUP BY e.id
    `;
    const res = await db.query(sql, [id]);
    return res.rows[0] || null;
  }

  /**
   * Retrieves subjects available for a particular exam
   */
  static async getSubjectsForExam(examId) {
    const sql = `
      SELECT 
        s.id,
        s.name,
        COUNT(q.id)::int as question_count
      FROM subjects s
      INNER JOIN questions q ON s.id = q.subject_id
      WHERE q.exam_id = $1
      GROUP BY s.id, s.name
      ORDER BY s.name ASC
    `;
    const res = await db.query(sql, [examId]);
    return res.rows;
  }

  /**
   * Deletes an exam and cascades related questions/options
   */
  static async deleteExam(id) {
    const sql = `DELETE FROM exams WHERE id = $1 RETURNING id, name, year`;
    const res = await db.query(sql, [id]);
    return res.rows[0] || null;
  }

  /**
   * Creates an import job record
   */
  static async createImportJob(client, { exam_id, file_name, total_rows }) {
    const runner = client || db;
    const sql = `
      INSERT INTO import_jobs (exam_id, file_name, status, total_rows)
      VALUES ($1, $2, 'processing', $3)
      RETURNING id, exam_id, file_name, status, total_rows, imported_rows, failed_rows, created_at
    `;
    const res = await runner.query(sql, [exam_id || null, file_name, total_rows || 0]);
    return res.rows[0];
  }

  /**
   * Updates an import job with progress or completion
   */
  static async updateImportJob(client, id, { status, imported_rows, failed_rows, error_details }) {
    const runner = client || db;
    const sql = `
      UPDATE import_jobs
      SET 
        status = COALESCE($2, status),
        imported_rows = COALESCE($3, imported_rows),
        failed_rows = COALESCE($4, failed_rows),
        error_details = COALESCE($5, error_details)
      WHERE id = $1
      RETURNING id, exam_id, file_name, status, total_rows, imported_rows, failed_rows, error_details, created_at
    `;
    const res = await runner.query(sql, [
      id,
      status || null,
      imported_rows !== undefined ? imported_rows : null,
      failed_rows !== undefined ? failed_rows : null,
      error_details ? JSON.stringify(error_details) : null,
    ]);
    return res.rows[0];
  }

  /**
   * Retrieves paginated list of import jobs
   */
  static async getImportJobs({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const countSql = `SELECT COUNT(*)::int as total FROM import_jobs`;
    const countRes = await db.query(countSql);
    const total = countRes.rows[0].total;

    const sql = `
      SELECT 
        j.id,
        j.exam_id,
        e.name as exam_name,
        e.year as exam_year,
        j.file_name,
        j.status,
        j.total_rows,
        j.imported_rows,
        j.failed_rows,
        j.created_at
      FROM import_jobs j
      LEFT JOIN exams e ON j.exam_id = e.id
      ORDER BY j.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const res = await db.query(sql, [limit, offset]);
    return {
      items: res.rows,
      pagination: { page, limit, total },
    };
  }

  /**
   * Retrieves single import job details with full error log
   */
  static async getImportJobById(id) {
    const sql = `
      SELECT 
        j.id,
        j.exam_id,
        e.name as exam_name,
        e.year as exam_year,
        j.file_name,
        j.status,
        j.total_rows,
        j.imported_rows,
        j.failed_rows,
        j.error_details,
        j.created_at
      FROM import_jobs j
      LEFT JOIN exams e ON j.exam_id = e.id
      WHERE j.id = $1
    `;
    const res = await db.query(sql, [id]);
    return res.rows[0] || null;
  }
}

module.exports = ExamRepository;
