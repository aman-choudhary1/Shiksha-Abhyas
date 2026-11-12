/**
 * Validation service for Question Bank Excel Uploads
 */

/**
 * Normalizes question text for duplicate comparison
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/gi, '') // preserve alphanumeric and Hindi Devanagari
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates metadata harmony between form inputs and workbook sheet
 */
function validateExamMetadata(sheetMeta = {}, formMeta = {}) {
  const errors = [];
  const merged = { ...sheetMeta };

  if (formMeta.exam_name) {
    if (sheetMeta.exam_name && sheetMeta.exam_name.toLowerCase() !== formMeta.exam_name.toLowerCase()) {
      errors.push(`Conflicting exam name: Form provided "${formMeta.exam_name}" but Excel sheet contains "${sheetMeta.exam_name}".`);
    } else {
      merged.exam_name = formMeta.exam_name;
    }
  }

  if (formMeta.year) {
    const formYear = parseInt(formMeta.year, 10);
    if (sheetMeta.year && parseInt(sheetMeta.year, 10) !== formYear) {
      errors.push(`Conflicting exam year: Form provided ${formYear} but Excel sheet contains ${sheetMeta.year}.`);
    } else {
      merged.year = formYear;
    }
  }

  if (formMeta.language) {
    merged.language = formMeta.language;
  }

  if (!merged.exam_name || merged.exam_name.trim() === '') {
    errors.push('Exam name is required. Specify it in the "Upload_Metadata" sheet or in the upload form.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    metadata: merged,
  };
}

/**
 * Validates individual question rows according to requirements
 */
function validateQuestionRows(rows) {
  const validRows = [];
  const invalidRows = [];
  const warnings = [];
  const duplicateWarnings = [];

  // Sets for duplicate detection within the uploaded file
  const seenQNumPerSubject = new Map(); // subject -> Set of question_no
  const seenTextPerSubject = new Map(); // subject -> Set of normalized text

  rows.forEach((row) => {
    const rowErrors = [];
    const rowWarnings = [];
    const excelRow = row.excelRowNumber;
    const qNumRaw = row.question_no;
    const qNum = parseInt(qNumRaw, 10);

    // Rule 1: question_no must be a valid positive integer
    if (!qNumRaw || isNaN(qNum) || qNum <= 0) {
      rowErrors.push('question_no must be a valid positive integer (e.g. 1, 2, 3).');
    }

    // Rule 2: subject must be present
    const subject = (row.subject || '').trim();
    if (!subject) {
      rowErrors.push('subject is required.');
    }

    // Rule 3: At least one of question_en or question_hi must be non-empty
    const qEn = (row.question_en || '').trim();
    const qHi = (row.question_hi || '').trim();
    if (!qEn && !qHi) {
      rowErrors.push('Question text missing. At least one of question_en or question_hi must be provided.');
    }

    // Rule 4: All 4 options A, B, C, and D must exist in at least one language
    const optA = (row.option_a_en || '').trim() || (row.option_a_hi || '').trim();
    const optB = (row.option_b_en || '').trim() || (row.option_b_hi || '').trim();
    const optC = (row.option_c_en || '').trim() || (row.option_c_hi || '').trim();
    const optD = (row.option_d_en || '').trim() || (row.option_d_hi || '').trim();

    if (!optA) rowErrors.push('Option A is missing (neither English nor Hindi provided).');
    if (!optB) rowErrors.push('Option B is missing (neither English nor Hindi provided).');
    if (!optC) rowErrors.push('Option C is missing (neither English nor Hindi provided).');
    if (!optD) rowErrors.push('Option D is missing (neither English nor Hindi provided).');

    // Rule 5: correct_answer must be A, B, C, or D
    const ans = (row.correct_answer || '').trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(ans)) {
      rowErrors.push(`Invalid correct_answer: "${row.correct_answer}". Must be exactly A, B, C, or D.`);
    }

    // Rule 6: Duplicate question within the file
    if (subject && qNum > 0) {
      if (!seenQNumPerSubject.has(subject)) {
        seenQNumPerSubject.set(subject, new Set());
      }
      const qNumSet = seenQNumPerSubject.get(subject);
      if (qNumSet.has(qNum)) {
        rowErrors.push(`Duplicate question_no (${qNum}) detected within the same subject "${subject}".`);
        duplicateWarnings.push({
          excelRow,
          question_no: qNum,
          subject,
          type: 'duplicate_question_no',
          message: `Question number ${qNum} appears multiple times in subject "${subject}".`,
        });
      } else {
        qNumSet.add(qNum);
      }

      // Check text duplicate
      const textKey = normalizeText(qEn) || normalizeText(qHi);
      if (textKey) {
        if (!seenTextPerSubject.has(subject)) {
          seenTextPerSubject.set(subject, new Set());
        }
        const textSet = seenTextPerSubject.get(subject);
        if (textSet.has(textKey)) {
          rowErrors.push(`Duplicate question text detected within subject "${subject}".`);
          duplicateWarnings.push({
            excelRow,
            question_no: qNum,
            subject,
            type: 'duplicate_question_text',
            message: `Question with identical text detected in subject "${subject}".`,
          });
        } else {
          textSet.add(textKey);
        }
      }
    }

    // Language completeness warnings (non-fatal)
    if (qEn && !qHi) {
      rowWarnings.push('Question provided in English only (Hindi translation missing).');
    } else if (qHi && !qEn) {
      rowWarnings.push('Question provided in Hindi only (English translation missing).');
    }

    if (rowWarnings.length > 0) {
      warnings.push({
        excelRow,
        question_no: qNum || qNumRaw,
        subject,
        warnings: rowWarnings,
      });
    }

    if (rowErrors.length > 0) {
      invalidRows.push({
        excelRow,
        question_no: qNum || qNumRaw,
        subject,
        errors: rowErrors,
        raw: row,
      });
    } else {
      validRows.push({
        excelRow,
        question_no: qNum,
        subject,
        question_en: qEn || null,
        question_hi: qHi || null,
        correct_answer: ans,
        options: [
          {
            key: 'A',
            text_en: (row.option_a_en || '').trim() || null,
            text_hi: (row.option_a_hi || '').trim() || null,
            is_correct: ans === 'A',
          },
          {
            key: 'B',
            text_en: (row.option_b_en || '').trim() || null,
            text_hi: (row.option_b_hi || '').trim() || null,
            is_correct: ans === 'B',
          },
          {
            key: 'C',
            text_en: (row.option_c_en || '').trim() || null,
            text_hi: (row.option_c_hi || '').trim() || null,
            is_correct: ans === 'C',
          },
          {
            key: 'D',
            text_en: (row.option_d_en || '').trim() || null,
            text_hi: (row.option_d_hi || '').trim() || null,
            is_correct: ans === 'D',
          },
        ],
      });
    }
  });

  return {
    totalRows: rows.length,
    validRows,
    validCount: validRows.length,
    invalidRows,
    invalidCount: invalidRows.length,
    warnings,
    warningCount: warnings.length,
    duplicateWarnings,
  };
}

module.exports = {
  validateExamMetadata,
  validateQuestionRows,
  normalizeText,
};
