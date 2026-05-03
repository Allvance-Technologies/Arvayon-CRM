# Arvayon CRM — Quick Start Guide

**Desktop App | No AWS | No Redis | SQLite**

---

## ✅ Current Status: Production Ready

| Component | Status |
|-----------|--------|
| Backend (Laravel 10) | ✅ 100% — All controllers, models, migrations |
| Frontend (React + TypeScript) | ✅ 100% — All pages built |
| Database (SQLite) | ✅ Local file, no server needed |
| File Storage | ✅ Local disk (`storage/app/public`) |
| Authentication | ✅ Laravel Sanctum |
| Desktop App | ✅ NativePHP/Electron |
| Tests | ✅ 7/7 passing |

---

## 🚀 Option A — Run as Desktop App (NativePHP)

### Prerequisites
- PHP 8.1+
- Node.js 18+
- Composer

### Steps

```bash
# 1. Install backend dependencies
cd backend
composer install

# 2. Database is already configured (SQLite)
# Run migrations
php artisan migrate --force

# 3. Seed admin user
php artisan db:seed --force

# 4. Install frontend dependencies
cd ../frontend
npm install

# 5. Launch the desktop app
cd ../backend
npm run native:dev
```

The app will open as a native desktop window.

---

## 🌐 Option B — Run as Web App (Browser)

### Backend

```bash
cd backend
composer install
php artisan migrate --force
php artisan db:seed --force
php artisan serve
# → http://localhost:8000
```

### Frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

Open http://localhost:5173 in your browser.

---

## 🔐 Login Credentials

| Field | Value |
|-------|-------|
| Email | `admin@arvayon.com` |
| Password | `admin123` |
| Role | Admin |

---

## 📁 Project Structure

```
Arvayon-CRM/
├── backend/                    # Laravel 10 API
│   ├── app/
│   │   ├── Http/Controllers/   # 20 controllers
│   │   ├── Models/             # 15 models
│   │   ├── Jobs/               # Background jobs
│   │   └── Services/           # AIService
│   ├── database/
│   │   ├── migrations/         # 28 migrations
│   │   ├── seeders/            # Admin user seeder
│   │   └── database.sqlite     # Local SQLite DB
│   └── routes/api.php          # All API routes
│
├── frontend/                   # React 18 + TypeScript
│   ├── src/
│   │   ├── pages/              # All pages (leads, projects, tasks, etc.)
│   │   ├── components/         # Reusable UI components
│   │   ├── stores/             # Zustand state management
│   │   └── services/           # API service layer
│   └── dist/                   # Built frontend (served by NativePHP)
│
└── ai-service/                 # FastAPI AI microservice (optional)
    └── main.py
```

---

## 🗂️ Features

### CRM Core
- **Dashboard** — KPIs, sales funnel, AI insights, project progress
- **Leads** — Table view, Kanban board, detail with tabs, AI scoring
- **Projects** — List, detail with milestones/tasks/documents
- **Tasks** — My Tasks, All Tasks, calendar view
- **Clients** — Client management

### Finance
- **Invoices** — Create, track, mark paid
- **Payments** — Record payments against invoices
- **Quotes** — Generate and print quotes
- **Proposals** — AI-assisted proposal generation
- **Reports** — Monthly revenue, project profitability

### HR
- **Employees** — Employee profiles, tasks, social links
- **Attendance** — Clock in/out, leave management
- **Payroll** — Monthly payroll generation

### Admin
- **Users** — Create users, assign roles, activate/deactivate
- **Search** — Global search across all entities
- **Export** — CSV export for leads, projects, tasks, invoices

---

## 👥 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access to everything |
| **Sales** | Leads, clients, proposals |
| **Architect** | Projects, tasks, documents |
| **Accounts** | Invoices, payments, reports |

---

## 🔧 Configuration

### Backend `.env` (already configured for desktop)

```env
APP_NAME="Arvayon"
APP_ENV=local
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database
CACHE_DRIVER=file
```

No Redis, no MySQL, no AWS needed.

### AI Service (Optional)

The AI features (lead scoring, delay prediction, proposal generation) work with heuristics by default. To enable the full AI service:

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
python main.py
# → http://localhost:8001
```

Then set in `backend/.env`:
```env
AI_SERVICE_URL=http://localhost:8001
```

---

## 🧪 Running Tests

```bash
cd backend
php vendor/phpunit/phpunit/phpunit --testdox
```

Expected output: **7 tests, 20 assertions, all passing**

---

## 🐛 Troubleshooting

### "Unable to open database file"
```bash
cd backend
New-Item -ItemType File -Path "database\database.sqlite" -Force
php artisan migrate --force
```

### "Login fails"
```bash
cd backend
php artisan db:seed --force
```
Then login with `admin@arvayon.com` / `admin123`

### "Page not found" errors
```bash
cd backend
php artisan route:cache
php artisan config:cache
```

### Frontend won't build
```bash
cd frontend
npm install
npm run build
```

---

## 📊 API Endpoints Reference

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET  /api/v1/auth/user`

### Core CRM
- `GET/POST/PUT/DELETE /api/v1/leads`
- `GET/POST/PUT/DELETE /api/v1/projects`
- `GET/POST/PUT/DELETE /api/v1/tasks`
- `GET/POST/PUT/DELETE /api/v1/clients`

### Finance
- `GET/POST/PUT/DELETE /api/v1/invoices`
- `POST /api/v1/invoices/{id}/payments`
- `GET/POST/PUT/DELETE /api/v1/quotes`
- `GET/POST/PUT/DELETE /api/v1/proposals`
- `GET /api/v1/financial/reports`

### HR
- `GET/POST/PUT/DELETE /api/v1/employees`
- `POST /api/v1/attendance/clock-in`
- `POST /api/v1/attendance/clock-out`
- `POST /api/v1/payroll/generate`

### Admin
- `GET/POST/PUT/DELETE /api/v1/users`
- `GET /api/v1/search?q=...`
- `POST /api/v1/export/leads`

---

## 🎉 You're Ready!

The system is production-ready for desktop use. All data is stored locally in SQLite — no cloud services required.
