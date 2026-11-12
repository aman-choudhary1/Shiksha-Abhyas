const db = require('../config/db');
const { parseExcelBuffer } = require('./excelParser.service');
const { validateExamMetadata, validateQuestionRows } = require('./validation.service');
const ExamRepository = require('../repositories/exam.repository');
const QuestionRepository = require('../repositories/question.repository');

class QuestionImportService {
  /**
   * Dry-run validation of uploaded Excel file
   */
  static async validateUpload(fileBuffer, fileName, formMeta = {}) {
    const parseResult = await parseExcelBuffer(fileBuffer, fileName);
    const metaValidation = validateExamMetadata(parseResult.metadata, formMeta);
    const rowValidation = validateQuestionRows(parseResult.rows);

    // Check database for existing duplicates if exam already exists
    let existingDbQuestions = [];
    if (metaValidation.isValid && metaValidation.metadata.exam_name) {
      try {
        const examName = metaValidation.metadata.exam_name;
        const year = metaValidation.metadata.year;
        const examRes = await db.query(
          `SELECT id FROM exams WHERE LOWER(name) = LOWER($1) AND (year = $2 OR (year IS NULL AND $2 IS NULL)) LIMIT 1`,
          [examName, year || null]
        );
        if (examRes.rowCount > 0) {
          const examId = examRes.rows[0].id;
          const qRes = await db.query(
            `SELECT q.question_number, s.name as subject_name 
             FROM questions q 
             JOIN subjects s ON q.subject_id = s.id 
             WHERE q.exam_id = $1`,
            [examId]
          );
          existingDbQuestions = qRes.rows;
        }
      } catch (err) {
        console.warn('Could not check existing DB questions during preview:', err.message);
      }
    }

    // Flag rows that already exist in DB
    const dbDuplicateWarnings = [];
    if (existingDbQuestions.length > 0) {
      const existingSet = new Set(
        existingDbQuestions.map((q) => `${q.subject_name.toLowerCase()}#${q.question_number}`)
      );
      rowValidation.validRows.forEach((row) => {
        const key = `${row.subject.toLowerCase()}#${row.question_no}`;
        if (existingSet.has(key)) {
          dbDuplicateWarnings.push({
            excelRow: row.excelRowNumber,
            question_no: row.question_no,
            subject: row.subject,
            message: `Question ${row.question_no} in subject "${row.subject}" already exists in the database for this exam.`,
          });
        }
      });
    }

    return {
      metadata: metaValidation.metadata,
      metadataErrors: metaValidation.errors,
      isMetadataValid: metaValidation.isValid,
      summary: {
        totalRows: rowValidation.totalRows,
        validRows: rowValidation.validCount,
        invalidRows: rowValidation.invalidCount,
        warningRows: rowValidation.warningCount,
        inWorkbookDuplicates: rowValidation.duplicateWarnings.length,
        databaseDuplicates: dbDuplicateWarnings.length,
        isValidForStrictImport: metaValidation.isValid && rowValidation.invalidCount === 0 && rowValidation.duplicateWarnings.length === 0,
      },
      warnings: rowValidation.warnings,
      duplicateWarnings: [...rowValidation.duplicateWarnings, ...dbDuplicateWarnings],
      invalidRows: rowValidation.invalidRows,
      preview: rowValidation.validRows.slice(0, 5), // first 5 rows for UI preview
    };
  }

  /**
   * Executes atomic database import of validated question rows
   */
  static async importQuestions(fileBuffer, fileName, options = {}) {
    const {
      mode = 'strict',
      duplicate_policy = 'reject_duplicates',
      confirm_replace = false,
      exam_name,
      year,
      language,
    } = options;

    // 1. Parse Excel buffer
    const parseResult = await parseExcelBuffer(fileBuffer, fileName);

    // 2. Validate metadata
    const metaValidation = validateExamMetadata(parseResult.metadata, { exam_name, year, language });
    if (!metaValidation.isValid) {
      const err = new Error(`Metadata validation failed: ${metaValidation.errors.join('; ')}`);
      err.statusCode = 400;
      err.errors = metaValidation.errors;
      throw err;
    }
    const finalMetadata = metaValidation.metadata;

    // 3. Validate rows
    const rowValidation = validateQuestionRows(parseResult.rows);

    // In Strict Mode, reject completely if any row is invalid
    if (mode === 'strict' && rowValidation.invalidCount > 0) {
      const err = new Error(
        `Import rejected in Strict Mode: ${rowValidation.invalidCount} invalid row(s) found out of ${rowValidation.totalRows}. Use mode=partial to import only valid rows.`
      );
      err.statusCode = 422;
      err.errors = {
        invalidRows: rowValidation.invalidRows,
        duplicateWarnings: rowValidation.duplicateWarnings,
      };
      throw err;
    }

    const rowsToProcess = rowValidation.validRows;
    if (rowsToProcess.length === 0) {
      const err = new Error('No valid question rows found in Excel sheet to import.');
      err.statusCode = 400;
      err.errors = rowValidation.invalidRows;
      throw err;
    }

    // 4. Begin Database Transaction
    const client = await db.getClient();
    let importJob = null;

    try {
      await client.query('BEGIN');

      // Create or find exam
      const { exam, isNew } = await ExamRepository.findOrCreateExam(client, {
        name: finalMetadata.exam_name,
        year: finalMetadata.year,
        language: finalMetadata.language,
        source_file: fileName,
      });

      // Create import job tracker
      importJob = await ExamRepository.createImportJob(client, {
        exam_id: exam.id,
        file_name: fileName,
        total_rows: rowValidation.totalRows,
      });

      // Handle duplicate policy for existing exam questions
      if (duplicate_policy === 'replace_exam') {
        if (!confirm_replace) {
          const err = new Error(
            'Destructive operation requires explicit confirmation: Set confirm_replace=true to overwrite all questions in this exam.'
          );
          err.statusCode = 400;
          throw err;
        }
        await QuestionRepository.deleteExamQuestions(client, exam.id);
      }

      // Check existing questions in DB if policy is reject_duplicates
      if (duplicate_policy === 'reject_duplicates') {
        const existingRes = await client.query(
          `SELECT q.question_number, s.name as subject_name 
           FROM questions q 
           JOIN subjects s ON q.subject_id = s.id 
           WHERE q.exam_id = $1`,
          [exam.id]
        );

        if (existingRes.rowCount > 0) {
          const existingMap = new Set(
            existingRes.rows.map((r) => `${r.subject_name.toLowerCase()}#${r.question_number}`)
          );

          const conflicts = [];
          for (const row of rowsToProcess) {
            const key = `${row.subject.toLowerCase()}#${row.question_no}`;
            if (existingMap.has(key)) {
              conflicts.push(`Question ${row.question_no} in subject "${row.subject}"`);
            }
          }

          if (conflicts.length > 0) {
            const err = new Error(
              `Duplicate questions detected in database for this exam (${conflicts.slice(0, 3).join(', ')}${conflicts.length > 3 ? ` and ${conflicts.length - 3} more` : ''}). Select duplicate_policy=skip_existing or replace_exam.`
            );
            err.statusCode = 409;
            err.errors = { conflicts };
            throw err;
          }
        }
      }

      // Cache subjects to avoid redundant DB roundtrips
      const subjectCache = new Map();
      const getSubjectId = async (subjName) => {
        const key = subjName.toLowerCase().trim();
        if (subjectCache.has(key)) return subjectCache.get(key);
        const subj = await ExamRepository.findOrCreateSubject(client, subjName);
        subjectCache.set(key, subj.id);
        return subj.id;
      };

      // Import each question
      let importedCount = 0;
      let skippedCount = 0;
      const skippedRows = [];

      for (const row of rowsToProcess) {
        const subjectId = await getSubjectId(row.subject);

        // If duplicate_policy === 'skip_existing', check if already present
        if (duplicate_policy === 'skip_existing') {
          const checkRes = await client.query(
            `SELECT id FROM questions WHERE exam_id = $1 AND subject_id = $2 AND question_number = $3 LIMIT 1`,
            [exam.id, subjectId, row.question_no]
          );
          if (checkRes.rowCount > 0) {
            skippedCount++;
            skippedRows.push({
              excelRow: row.excelRowNumber,
              question_no: row.question_no,
              subject: row.subject,
              reason: 'Already exists in database for this exam (skipped).',
            });
            continue;
          }
        }

        // Insert question record
        const question = await QuestionRepository.insertQuestion(client, {
          exam_id: exam.id,
          subject_id: subjectId,
          question_number: row.question_no,
          question_text_en: row.question_en,
          question_text_hi: row.question_hi,
        });

        // Insert options
        await QuestionRepository.insertQuestionOptions(client, question.id, row.options);
        importedCount++;
      }

      const totalFailed = rowValidation.invalidCount + skippedCount;
      const finalStatus =
        totalFailed > 0 ? 'completed_with_errors' : 'completed';

      const errorDetails = {
        invalidRows: rowValidation.invalidRows,
        skippedRows,
        duplicateWarnings: rowValidation.duplicateWarnings,
      };

      // Update import job record
      await ExamRepository.updateImportJob(client, importJob.id, {
        status: finalStatus,
        imported_rows: importedCount,
        failed_rows: totalFailed,
        error_details: errorDetails,
      });

      await client.query('COMMIT');

      return {
        importJobId: importJob.id,
        examId: exam.id,
        examName: exam.name,
        examYear: exam.year,
        status: finalStatus,
        mode,
        duplicate_policy,
        totalRows: rowValidation.totalRows,
        importedQuestions: importedCount,
        rejectedRows: rowValidation.invalidCount,
        skippedRows: skippedCount,
        errors: totalFailed > 0 ? errorDetails : null,
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});

      // Record failure in import_jobs using a clean connection if job was created
      if (importJob && importJob.id) {
        try {
          await ExamRepository.updateImportJob(null, importJob.id, {
            status: 'failed',
            error_details: { fatalError: err.message, stack: err.stack },
          });
        } catch {}
      }

      throw err;
    } finally {
      client.release();
    }
  }
}

module.exports = QuestionImportService;
