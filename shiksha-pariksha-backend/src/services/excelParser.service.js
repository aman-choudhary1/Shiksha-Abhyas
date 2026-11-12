const ExcelJS = require('exceljs');

/**
 * Standard definition of Excel column headers for Question Bank.
 * Each column has a canonical key (used internally), a primary user-friendly label,
 * and recognized aliases (supporting snake_case, spaces, parentheses, etc.).
 */
const CANONICAL_HEADERS = [
  {
    key: 'question_no',
    label: 'Question No.',
    aliases: [
      'question_no', 'question no', 'question no.', 'q no', 'q.no', 'q.no.',
      'question number', 'q_no', 'qnum', 'sl no', 'sr no', 's.no', 'serial no'
    ],
  },
  {
    key: 'subject',
    label: 'Subject',
    aliases: ['subject', 'subject name', 'subject_name', 'topic', 'subject area'],
  },
  {
    key: 'question_en',
    label: 'Question (English)',
    aliases: [
      'question_en', 'question (english)', 'question english', 'question (en)',
      'question_english', 'question en', 'question text (english)', 'question text en'
    ],
  },
  {
    key: 'question_hi',
    label: 'Question (Hindi)',
    aliases: [
      'question_hi', 'question (hindi)', 'question hindi', 'question (hi)',
      'question_hindi', 'question hi', 'question text (hindi)', 'question text hi'
    ],
  },
  {
    key: 'option_a_en',
    label: 'Option A (English)',
    aliases: [
      'option_a_en', 'option a (english)', 'option a english', 'option a (en)',
      'option_a (english)', 'option a en', 'option_a_english'
    ],
  },
  {
    key: 'option_a_hi',
    label: 'Option A (Hindi)',
    aliases: [
      'option_a_hi', 'option a (hindi)', 'option a hindi', 'option a (hi)',
      'option_a (hindi)', 'option a hi', 'option_a_hindi'
    ],
  },
  {
    key: 'option_b_en',
    label: 'Option B (English)',
    aliases: [
      'option_b_en', 'option b (english)', 'option b english', 'option b (en)',
      'option_b (english)', 'option b en', 'option_b_english'
    ],
  },
  {
    key: 'option_b_hi',
    label: 'Option B (Hindi)',
    aliases: [
      'option_b_hi', 'option b (hindi)', 'option b hindi', 'option b (hi)',
      'option_b (hindi)', 'option b hi', 'option_b_hindi'
    ],
  },
  {
    key: 'option_c_en',
    label: 'Option C (English)',
    aliases: [
      'option_c_en', 'option c (english)', 'option c english', 'option c (en)',
      'option_c (english)', 'option c en', 'option_c_english'
    ],
  },
  {
    key: 'option_c_hi',
    label: 'Option C (Hindi)',
    aliases: [
      'option_c_hi', 'option c (hindi)', 'option c hindi', 'option c (hi)',
      'option_c (hindi)', 'option c hi', 'option_c_hindi'
    ],
  },
  {
    key: 'option_d_en',
    label: 'Option D (English)',
    aliases: [
      'option_d_en', 'option d (english)', 'option d english', 'option d (en)',
      'option_d (english)', 'option d en', 'option_d_english'
    ],
  },
  {
    key: 'option_d_hi',
    label: 'Option D (Hindi)',
    aliases: [
      'option_d_hi', 'option d (hindi)', 'option d hindi', 'option d (hi)',
      'option_d (hindi)', 'option d hi', 'option_d_hindi'
    ],
  },
  {
    key: 'correct_answer',
    label: 'Correct Answer (A/B/C/D)',
    aliases: [
      'correct_answer', 'correct answer (a/b/c/d)', 'correct answer (abcd)',
      'correct answer', 'correct option', 'correct_option', 'correct option (a/b/c/d)',
      'answer', 'answer key', 'correct'
    ],
  },
];

const REQUIRED_HEADERS = CANONICAL_HEADERS.map((h) => h.key);

/**
 * Resolves any raw header text from an Excel cell into a canonical key.
 * Case-insensitive, trims extra whitespace, and strips formatting.
 */
function resolveCanonicalHeader(rawText) {
  if (!rawText) return null;
  const raw = String(rawText).trim().toLowerCase();
  const rawSnake = raw.replace(/[\s-]+/g, '_');
  const simplified = raw.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  for (const def of CANONICAL_HEADERS) {
    if (def.key === raw || def.key === rawSnake) return def.key;
    if (def.label.toLowerCase() === raw) return def.key;
    for (const alias of def.aliases) {
      const aliasSnake = alias.replace(/[\s-]+/g, '_');
      const aliasSimplified = alias.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (raw === alias || rawSnake === aliasSnake || simplified === aliasSimplified) {
        return def.key;
      }
    }
  }
  return null;
}

/**
 * Extracts raw or formatted text from an ExcelJS cell
 */
function getCellText(cell) {
  if (!cell || cell.value === null || cell.value === undefined) {
    return '';
  }

  // Handle rich text
  if (cell.value && Array.isArray(cell.value.richText)) {
    return cell.value.richText.map((chunk) => chunk.text || '').join('').trim();
  }

  // Handle formula results
  if (typeof cell.value === 'object' && cell.value.result !== undefined) {
    return String(cell.value.result).trim();
  }

  // Handle standard string / number / boolean
  return String(cell.value).trim();
}

/**
 * Parses examination metadata from 'Upload_Metadata' sheet
 */
function parseMetadataSheet(workbook) {
  const metaSheet = workbook.getWorksheet('Upload_Metadata');
  if (!metaSheet) {
    return null;
  }

  const metadata = {};
  metaSheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header row
    const rawProp = getCellText(row.getCell(1)).toLowerCase().replace(/[\s-]+/g, '_');
    const propVal = getCellText(row.getCell(2));
    if (rawProp && propVal) {
      let propKey = rawProp;
      // Normalize friendly property names
      if (['exam_name', 'exam', 'name_of_exam', 'examination_name', 'exam_title'].includes(rawProp)) {
        propKey = 'exam_name';
      } else if (['year', 'exam_year', 'examination_year'].includes(rawProp)) {
        propKey = 'year';
      } else if (['language', 'medium', 'medium_of_exam', 'exam_language'].includes(rawProp)) {
        propKey = 'language';
      } else if (['source_file', 'file_name', 'filename', 'source_document'].includes(rawProp)) {
        propKey = 'source_file';
      }

      if (propKey === 'year') {
        const parsedYear = parseInt(propVal, 10);
        metadata[propKey] = isNaN(parsedYear) ? propVal : parsedYear;
      } else {
        metadata[propKey] = propVal;
      }
    }
  });

  return metadata;
}

/**
 * Parses and extracts questions from the 'Questions' sheet
 */
async function parseExcelBuffer(buffer, originalFileName = 'upload.xlsx') {
  const workbook = new ExcelJS.Workbook();
  
  try {
    await workbook.xlsx.load(buffer);
  } catch (err) {
    const error = new Error(`Malformed or unreadable Excel file: ${err.message}`);
    error.statusCode = 400;
    throw error;
  }

  // 1. Verify existence of Questions worksheet
  const questionsSheet = workbook.getWorksheet('Questions');
  if (!questionsSheet) {
    const error = new Error('Missing required worksheet "Questions". Ensure your Excel file contains a "Questions" sheet.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate header row
  const headerRow = questionsSheet.getRow(1);
  const headerMap = {};
  const foundHeaders = [];

  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const rawText = getCellText(cell);
    const canonicalKey = resolveCanonicalHeader(rawText);
    if (canonicalKey) {
      headerMap[canonicalKey] = colNumber;
      foundHeaders.push(canonicalKey);
    }
  });

  const missingHeaders = CANONICAL_HEADERS.filter((h) => !headerMap[h.key]);
  if (missingHeaders.length > 0) {
    const missingFormatted = missingHeaders.map((h) => `"${h.label}" (${h.key})`).join(', ');
    const error = new Error(`Missing required column headers: ${missingFormatted}`);
    error.statusCode = 400;
    error.errors = {
      missingHeaders: missingHeaders.map((h) => h.key),
      missingDisplayNames: missingHeaders.map((h) => h.label),
      foundHeaders,
    };
    throw error;
  }

  // 3. Parse Metadata sheet
  const sheetMetadata = parseMetadataSheet(workbook) || {};
  if (!sheetMetadata.source_file) {
    sheetMetadata.source_file = originalFileName;
  }

  // 4. Parse question rows
  const parsedRows = [];
  const maxRows = parseInt(process.env.MAX_QUESTION_ROWS || '5000', 10);

  questionsSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip header row

    if (parsedRows.length >= maxRows) {
      return;
    }

    const rowData = {
      excelRowNumber: rowNumber,
      question_no: getCellText(row.getCell(headerMap['question_no'])),
      subject: getCellText(row.getCell(headerMap['subject'])),
      question_en: getCellText(row.getCell(headerMap['question_en'])),
      question_hi: getCellText(row.getCell(headerMap['question_hi'])),
      option_a_en: getCellText(row.getCell(headerMap['option_a_en'])),
      option_a_hi: getCellText(row.getCell(headerMap['option_a_hi'])),
      option_b_en: getCellText(row.getCell(headerMap['option_b_en'])),
      option_b_hi: getCellText(row.getCell(headerMap['option_b_hi'])),
      option_c_en: getCellText(row.getCell(headerMap['option_c_en'])),
      option_c_hi: getCellText(row.getCell(headerMap['option_c_hi'])),
      option_d_en: getCellText(row.getCell(headerMap['option_d_en'])),
      option_d_hi: getCellText(row.getCell(headerMap['option_d_hi'])),
      correct_answer: getCellText(row.getCell(headerMap['correct_answer'])).toUpperCase(),
    };

    // Check if the row is completely empty across all columns
    const hasAnyContent = Object.keys(rowData).some((k) => k !== 'excelRowNumber' && rowData[k] !== '');
    if (hasAnyContent) {
      parsedRows.push(rowData);
    }
  });

  return {
    metadata: sheetMetadata,
    rows: parsedRows,
    totalRowsFound: parsedRows.length,
    worksheetsFound: workbook.worksheets.map((w) => w.name),
  };
}

module.exports = {
  parseExcelBuffer,
  REQUIRED_HEADERS,
  CANONICAL_HEADERS,
  resolveCanonicalHeader,
};
