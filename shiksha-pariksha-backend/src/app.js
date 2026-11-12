require('dotenv').config();
const path    = require('path');
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit    = require('express-rate-limit');

const { testConnection }   = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const ApiResponse = require('./utils/apiResponse');

// Routes
const authRoutes     = require('./routes/auth.routes');
const adminRoutes    = require('./routes/admin.routes');
const teacherRoutes  = require('./routes/teacher.routes');
const studentRoutes  = require('./routes/student.routes');
const parentRoutes   = require('./routes/parent.routes');

const app = express();
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5174',
  'http://localhost:5174',
  'http://localhost:5173',
  'http://127.0.0.1:5174',
  ...(process.env.FRONTEND_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean),
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl / Postman / mobile
    if (allowedOrigins.includes(origin)) return cb(null, true);
    if (process.env.NODE_ENV !== 'production') {
      try {
        const { hostname } = new URL(origin);
        if (hostname === 'localhost' || hostname === '127.0.0.1') return cb(null, true);
      } catch {}
    }
    cb(new Error(`CORS: origin not permitted — ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

// ── Rate Limiting ─────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production';
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 5000 : 300,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Rate limit exceeded. Please slow down.' },
}));

// ── Body Parsers ──────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());
app.use(morgan(isDev ? 'dev' : 'combined'));

// ── Static Files ──────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ── Health Check ──────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const db = await testConnection();
    return ApiResponse.success(res, {
      status:   'UP',
      service:  'Shiksha Abhyas API',
      version:  '1.0.0',
      frontend: process.env.FRONTEND_URL || 'http://localhost:5174',
      database: { connected: true, name: db.db, time: db.now },
    }, 'Service is healthy');
  } catch (err) {
    return ApiResponse.error(res, 'Database unreachable', 503, { error: err.message });
  }
});

// ── Public Template Downloads ─────────────────────────────────
app.get(['/api/question-imports/template', '/api/admin/question-imports/template'], async (req, res, next) => {
  try {
    const fs = require('fs');
    const { generateTemplate } = require('../scripts/generate_template');
    const templatePath = path.join(__dirname, '../fixtures/CGTET2016_Minimal_Question_Upload.xlsx');
    if (!fs.existsSync(templatePath)) {
      await generateTemplate(templatePath);
    }
    res.setHeader('Content-Disposition', 'attachment; filename="CGTET2016_Minimal_Question_Upload.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.sendFile(templatePath);
  } catch (err) { next(err); }
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/admin',   adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent',  parentRoutes);

// ── 404 & Error ───────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
