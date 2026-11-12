# 🎓 Shiksha Abhyas (Shiksha Pariksha)

A full-stack, multi-role **Practice Test & Learning Platform** built for schools, teachers, students, and parents. It supports bulk Excel question imports, timed MCQ practice tests, automated grading, study material distribution, and parent progress tracking.

![Node.js](https://img.shields.io/badge/Node.js-Express%204-339933?style=flat-square&logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT%20%2B%20Cookies-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

---

## ✨ Features by Role

| Role | Portal Route | Key Capabilities |
| :--- | :--- | :--- |
| **Admin** | `/admin/*` | System KPI dashboard, bulk Excel question import & import history, create/manage tests, upload study materials, broadcast notifications |
| **Teacher** | `/teacher/*` | Create & manage practice tests, import questions, share study materials |
| **Student** | `/student/*` | Browse available practice tests, take timed MCQ tests, view scores & attempt history, access study materials & notifications |
| **Parent** | `/parent/*` | View linked child's performance reports, access study materials, receive notifications |

---

## 🏗️ Tech Stack

### Backend (`shiksha-pariksha-backend`)
- **Runtime & Framework:** Node.js, Express `4.19`
- **Database:** PostgreSQL (`pg`) with SQL migrations
- **Authentication & Security:** JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `helmet`, `cors`, `express-rate-limit`
- **Validation & File Processing:** `zod`, `multer` (file uploads), `exceljs` (`.xlsx` parsing & template generation)

### Frontend (`shiksha-pariksha-frontend`)
- **UI & Routing:** React `19`, React Router `7` (lazy-loaded role portals)
- **Build Tool & Linter:** Vite `8`, Oxlint
- **HTTP, Animation & Icons:** Axios, Framer Motion, Lucide React

---

## 📁 Project Structure

```text
shiksha abhiyas/
├── shiksha-pariksha-backend/
│   ├── fixtures/                  # Sample Excel question upload templates
│   ├── migrations/                # PostgreSQL schema migrations & runner
│   ├── public/uploads/            # Uploaded study materials (gitignored)
│   ├── scripts/                   # DB init, demo user/content seeders, template generator
│   ├── src/
│   │   ├── config/                # PostgreSQL pool configuration
│   │   ├── controllers/           # Request handlers
│   │   ├── middleware/            # Auth, error handling, multer uploads
│   │   ├── repositories/          # Database query layer
│   │   ├── routes/                # auth, admin, teacher, student, parent routes
│   │   ├── services/              # Business logic (auth, attempts, Excel import, validation)
│   │   ├── utils/                 # API response helpers & JWT utilities
│   │   └── app.js                 # Express app setup
│   ├── .env.example               # Environment variable template
│   └── server.js                  # Server entry point (default port 4000)
│
└── shiksha-pariksha-frontend/
    ├── public/                    # Static assets
    ├── src/
    │   ├── components/
    │   │   ├── admin/             # AdminDashboard, ExcelImport, ManageTests, etc.
    │   │   ├── auth/              # LoginPage, ParticleCanvas
    │   │   ├── common/            # PortalShell, ProtectedRoute, TakeTest, MyResults, etc.
    │   │   ├── parent/            # ChildReport, StudyMaterials, Notifications
    │   │   ├── student/           # StudentPortal
    │   │   └── teacher/           # TeacherPortal
    │   ├── context/               # AuthContext
    │   ├── services/              # Axios API client
    │   └── App.jsx                # Role-based routing
    └── vite.config.js             # Dev server on port 5174 with /api proxy
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended, with `--watch` support for backend dev mode)
- **PostgreSQL** (running locally or accessible via network)

### 1. Backend Setup

```bash
cd shiksha-pariksha-backend
npm install
```

Create a `.env` file from `.env.example` and configure your PostgreSQL credentials and JWT secret:

```bash
cp .env.example .env
```

Initialize the database schema and seed demo data:

```bash
# Run database migrations
npm run migrate

# Seed demo users (admin, teacher, student, parent)
npm run seed

# (Optional) Seed demo content (tests, questions, etc.)
node scripts/seed_demo_content.js
```

Start the backend server:

```bash
# Development mode (auto-restarts on changes)
npm run dev

# Production mode
npm start
```

The API server will run at `http://localhost:4000` (health check: `GET /api/health`).

### 2. Frontend Setup

Open a new terminal:

```bash
cd shiksha-pariksha-frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5174` and proxy `/api` requests to `http://localhost:4000`.

---

## 🔐 Environment Variables (`shiksha-pariksha-backend/.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `4000` | Backend server port |
| `NODE_ENV` | `development` | Environment (`development` / `production`) |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `shiksha_pariksha` | PostgreSQL database name |
| `DB_USER` | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | — | PostgreSQL password |
| `JWT_SECRET` | — | Secret key for signing JWTs (min 32 chars recommended) |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token lifetime |
| `FRONTEND_URL` | `http://localhost:5174` | Allowed frontend origin for CORS |
| `FRONTEND_ORIGIN` | `http://localhost:5174` | Comma-separated additional CORS origins |
| `MAX_EXCEL_SIZE_MB` | `10` | Max Excel import file size (MB) |
| `MAX_MATERIAL_SIZE_MB` | `50` | Max study material upload size (MB) |
| `MAX_QUESTION_ROWS` | `5000` | Max rows allowed per Excel question import |

---

## 🧪 Demo Accounts

After running `npm run seed` in `shiksha-pariksha-backend`, you can log in with:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@shiksha.local` | `Admin@123` |
| **Teacher** | `teacher@shiksha.local` | `Teacher@123` |
| **Student** | `student@shiksha.local` | `Student@123` |
| **Parent** | `parent@shiksha.local` | `Parent@123` |

---

## 📡 API Overview

| Base Path | Description |
| :--- | :--- |
| `GET /api/health` | Service & PostgreSQL connection health check |
| `GET /api/question-imports/template` | Download sample Excel question upload template |
| `/api/auth` | Login, logout, token refresh, current user profile |
| `/api/admin` | Admin dashboard, user/test management, Excel imports, materials, notifications |
| `/api/teacher` | Teacher test management, imports, and materials |
| `/api/student` | Available tests, attempt submission, results, materials |
| `/api/parent` | Linked student reports, materials, notifications |

---

## 🛠️ Available Scripts

**Backend (`shiksha-pariksha-backend`)**
- `npm run dev` — Start API server with file watching
- `npm start` — Start API server
- `npm run migrate` — Run SQL migrations
- `npm run seed` — Seed demo users and parent-student link
- `npm run template` — Generate the Excel question upload template

**Frontend (`shiksha-pariksha-frontend`)**
- `npm run dev` — Start Vite dev server on port `5174`
- `npm run build` — Build production bundle to `dist/`
- `npm run lint` — Lint source files with `oxlint`
- `npm run preview` — Preview production build locally

