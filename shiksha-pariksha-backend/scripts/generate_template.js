const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function generateTemplate(outputPath) {
  const targetPath = outputPath || path.join(__dirname, '../fixtures/CGTET2016_Minimal_Question_Upload.xlsx');
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CG School Education / VSK Question Bank System';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ─── Sheet 1: Questions ──────────────────────────────────────────
  const wsQuestions = workbook.addWorksheet('Questions', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // User-friendly column headers with generous widths
  wsQuestions.columns = [
    { header: 'Question No.', key: 'question_no', width: 16 },
    { header: 'Subject', key: 'subject', width: 34 },
    { header: 'Question (English)', key: 'question_en', width: 52 },
    { header: 'Question (Hindi)', key: 'question_hi', width: 52 },
    { header: 'Option A (English)', key: 'option_a_en', width: 34 },
    { header: 'Option A (Hindi)', key: 'option_a_hi', width: 34 },
    { header: 'Option B (English)', key: 'option_b_en', width: 34 },
    { header: 'Option B (Hindi)', key: 'option_b_hi', width: 34 },
    { header: 'Option C (English)', key: 'option_c_en', width: 34 },
    { header: 'Option C (Hindi)', key: 'option_c_hi', width: 34 },
    { header: 'Option D (English)', key: 'option_d_en', width: 34 },
    { header: 'Option D (Hindi)', key: 'option_d_hi', width: 34 },
    { header: 'Correct Answer (A/B/C/D)', key: 'correct_answer', width: 28 }
  ];

  // Header style: dark navy slate with white bold text
  const headerRow = wsQuestions.getRow(1);
  headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 32;

  // Add the sample questions provided by the user
  const sampleRows = [
    {
      question_no: 1,
      subject: 'Child Development and Pedagogy',
      question_en: 'What will be your effort for quality based inclusive education for all?',
      question_hi: 'सभी बच्चों को गुणवत्तापूर्ण समावेशी शिक्षा प्रदान करने के लिये आपका प्रयास होगा :',
      option_a_en: 'Child-centered relevant and justified process of learning in social context.',
      option_a_hi: 'बाल-केन्द्रित सामाजिक रूप से प्रासंगिक और न्यायोचित सीखने की प्रक्रिया प्रदान करना।',
      option_b_en: 'Sensitivity towards all the needs of the children.',
      option_b_hi: 'बच्चों की सभी आवश्यकताओं की पूर्ति करना।',
      option_c_en: 'Improvement in self-qualification and teaching methodology.',
      option_c_hi: 'स्वयं की शैक्षणिक योग्यता व शिक्षण-पद्धति को बेहतर करना।',
      option_d_en: 'School should be complete with all the high technique instruments.',
      option_d_hi: 'शाला को उच्च तकनीकी संबंधी उपकरण युक्त बनाना।',
      correct_answer: 'A'
    },
    {
      question_no: 2,
      subject: 'Child Development and Pedagogy',
      question_en: 'Which schools of quality education for rural children were opened by Central Government?',
      question_hi: 'ग्रामीण बच्चों को अच्छी शिक्षा उपलब्ध कराने हेतु केन्द्रीय सरकार द्वारा किन विद्यालयों को खोला गया?',
      option_a_en: 'Model Schools',
      option_a_hi: 'मॉडल स्कूल',
      option_b_en: 'Sainik Schools',
      option_b_hi: 'सैनिक स्कूल',
      option_c_en: 'Navodaya Vidyalaya',
      option_c_hi: 'नवोदय विद्यालय',
      option_d_en: 'Kendriya Vidyalaya',
      option_d_hi: 'केन्द्रीय विद्यालय',
      correct_answer: 'C'
    },
    {
      question_no: 3,
      subject: 'Environmental Studies',
      question_en: 'Which gas is responsible for the Greenhouse Effect?',
      question_hi: 'ग्रीनहाउस प्रभाव के लिए कौन सी गैस उत्तरदायी है?',
      option_a_en: 'Oxygen',
      option_a_hi: 'ऑक्सीजन',
      option_b_en: 'Carbon Dioxide',
      option_b_hi: 'कार्बन डाइऑक्साइड',
      option_c_en: 'Nitrogen',
      option_c_hi: 'नाइट्रोजन',
      option_d_en: 'Argon',
      option_d_hi: 'आर्गन',
      correct_answer: 'B'
    }
  ];

  sampleRows.forEach((rowObj) => {
    const row = wsQuestions.addRow(rowObj);
    row.height = 38;
    row.alignment = { vertical: 'middle', wrapText: true };
    // Center align Question No and Correct Answer
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(13).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(13).font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F766E' } };

    // Clean subtle cell borders
    for (let c = 1; c <= 13; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    }
  });

  // ─── Sheet 2: Start_Here ─────────────────────────────────────────
  const wsStartHere = workbook.addWorksheet('Start_Here');
  wsStartHere.columns = [
    { header: 'Column Name', key: 'column_name', width: 28 },
    { header: 'Requirement & Description', key: 'desc', width: 65 },
    { header: 'Example / Format', key: 'example', width: 35 }
  ];

  const startHeader = wsStartHere.getRow(1);
  startHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  startHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F766E' }
  };
  startHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  startHeader.height = 28;

  const startInstructions = [
    { column_name: 'Question No.', desc: 'Serial question number. Must be a positive integer.', example: '1, 2, 3...' },
    { column_name: 'Subject', desc: 'Subject / Topic name for grouping questions.', example: 'Mathematics, Science, CDP' },
    { column_name: 'Question (English)', desc: 'Question text in English (required if Hindi is blank).', example: 'What is 5 + 7?' },
    { column_name: 'Question (Hindi)', desc: 'Question text in Hindi (required if English is blank).', example: '5 + 7 क्या है?' },
    { column_name: 'Option A (English)', desc: 'First multiple-choice answer option in English.', example: '12' },
    { column_name: 'Option A (Hindi)', desc: 'First multiple-choice answer option in Hindi.', example: '१२' },
    { column_name: 'Option B (English)', desc: 'Second multiple-choice answer option in English.', example: '10' },
    { column_name: 'Option B (Hindi)', desc: 'Second multiple-choice answer option in Hindi.', example: '१०' },
    { column_name: 'Option C (English)', desc: 'Third multiple-choice answer option in English.', example: '14' },
    { column_name: 'Option C (Hindi)', desc: 'Third multiple-choice answer option in Hindi.', example: '१४' },
    { column_name: 'Option D (English)', desc: 'Fourth multiple-choice answer option in English.', example: '15' },
    { column_name: 'Option D (Hindi)', desc: 'Fourth multiple-choice answer option in Hindi.', example: '१५' },
    { column_name: 'Correct Answer (A/B/C/D)', desc: 'Must be exactly A, B, C, or D (case-insensitive).', example: 'A (or B, C, D)' },
    { column_name: 'Bilingual Support', desc: 'Questions and options can be in English, Hindi, or both.', example: 'Both languages supported' },
    { column_name: 'Metadata Sheet', desc: 'Exam Name and Year can be specified in the "Upload_Metadata" sheet.', example: 'CGTET, 2016' }
  ];

  startInstructions.forEach((item) => {
    const row = wsStartHere.addRow(item);
    row.height = 24;
    row.alignment = { vertical: 'middle', wrapText: true };
    row.getCell(1).font = { name: 'Calibri', size: 10.5, bold: true };
  });

  // ─── Sheet 3: Upload_Metadata ────────────────────────────────────
  const wsMetadata = workbook.addWorksheet('Upload_Metadata');
  wsMetadata.columns = [
    { header: 'Property Name', key: 'property', width: 28 },
    { header: 'Property Value', key: 'value', width: 45 }
  ];

  const metaHeader = wsMetadata.getRow(1);
  metaHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  metaHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4338CA' }
  };
  metaHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  metaHeader.height = 28;

  wsMetadata.addRows([
    { property: 'Exam Name', value: 'CGTET' },
    { property: 'Exam Year', value: 2016 },
    { property: 'Language', value: 'English/Hindi' },
    { property: 'Source File', value: 'CGTET2016_Minimal_Question_Upload.xlsx' }
  ]);

  await workbook.xlsx.writeFile(targetPath);
  console.log(`Excel template generated successfully at: ${targetPath}`);
  return targetPath;
}

if (require.main === module) {
  generateTemplate()
    .then((p) => {
      console.log('Template generation completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to generate template:', err);
      process.exit(1);
    });
}

module.exports = { generateTemplate };
