const multer = require('multer');
const path   = require('path');
const crypto = require('crypto');

const storage = multer.memoryStorage();

function fileFilter(allowedExts) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) return cb(null, true);
    const err = new Error(`File type not allowed. Allowed: ${allowedExts.join(', ')}`);
    err.statusCode = 400;
    cb(err, false);
  };
}

/** For Excel question imports — .xlsx only */
const uploadExcel = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_EXCEL_SIZE_MB || '10') * 1024 * 1024 },
  fileFilter: fileFilter(['.xlsx']),
}).single('file');

/** For study materials — PDF, DOCX, PPTX */
const uploadMaterial = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../../public/uploads/materials'));
    },
    filename: (req, file, cb) => {
      const unique = crypto.randomBytes(8).toString('hex');
      const ext    = path.extname(file.originalname);
      cb(null, `${Date.now()}-${unique}${ext}`);
    },
  }),
  limits: { fileSize: parseInt(process.env.MAX_MATERIAL_SIZE_MB || '50') * 1024 * 1024 },
  fileFilter: fileFilter(['.pdf', '.docx', '.pptx', '.doc', '.ppt', '.xlsx']),
}).single('material');

module.exports = { uploadExcel, uploadMaterial };
