# Eternova — Development Guide

## Project Overview
Eternova is a Secret Love & Relationship Memory Platform. Users preserve love stories, memories, and milestones through memory books, time capsules, letters, and personalized mini-websites.

## Tech Stack
- **Backend**: FastAPI + SQLite (raw sqlite3, WAL mode, no ORM)
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Framer Motion
- **Auth**: Custom JWT (PBKDF2 password hashing, HS256, 24hr expiry)
- **Deployment**: Render (backend) + Vercel (frontend)

## Project Structure
```
eternova/
├── backend/
│   ├── main.py              # FastAPI app, CORS, routers, lifespan
│   ├── api/
│   │   ├── models.py         # All Pydantic request/response models
│   │   └── routes/
│   │       ├── auth.py        # Register, login, /me
│   │       ├── books.py       # Books + entries + photos CRUD
│   │       ├── capsules.py    # Time capsules with lock enforcement
│   │       ├── milestones.py  # Milestone CRUD + upcoming
│   │       ├── letters.py     # Letter templates + drafts
│   │       ├── sites.py       # Mini-sites CRUD + multi-book + publish
│   │       ├── public.py      # Unauthenticated: shared books, public sites, guestbook
│   │       ├── dashboard.py   # Stats, search, random memory, together-since
│   │       ├── scheduled_letters.py  # Surprise letter scheduling
│   │       └── couple.py      # Partner linking via invite codes
│   ├── core/
│   │   ├── auth.py            # JWT + password hashing + get_current_user
│   │   ├── email.py           # Gmail SMTP async wrapper
│   │   ├── photos.py          # Photo save/delete with UUID filenames
│   │   ├── sharing.py         # Share token generation
│   │   └── templates.py       # 6 letter templates
│   └── state/
│       └── database.py        # SQLite schema, migrations, helpers
├── frontend/
│   └── src/
│       ├── app/               # Next.js pages (20 routes)
│       ├── components/        # Reusable UI components
│       ├── context/           # AuthContext, ThemeContext
│       └── lib/               # API client, types, PDF export, themes
└── render.yaml                # Render deployment config
```

## Running Locally

### Backend
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your values
uvicorn main:app --port 8001 --reload
```

### Frontend
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local
npm run dev
```

## Key Patterns

### Authentication
Every authenticated route uses `Depends(get_current_user)`. The frontend stores JWT in `localStorage('eternova_token')` and sends it as `Authorization: Bearer <token>`.

### Couple Mode (Shared Ownership)
`get_accessible_user_ids(user_id)` returns `[user_id]` or `[user_id, partner_id]` if linked. All list queries use `WHERE user_id IN (...)` for shared access.

### Capsule Lock Enforcement
Server-side only — GET returns NO message/photos if `date.today() < unlock_date`. Content is never sent to the client before the unlock date.

### Mini-Site Data Flow
Sites link to books via `site_books` junction table, entries via `site_entries`, milestones via `site_milestones`. Empty selection = show all (default). Public endpoint strips `guest_pin` and adds `has_guestbook` flag.

### Schema Migrations
`_add_column_if_missing(conn, table, column, definition)` for safe column additions. New tables use `CREATE TABLE IF NOT EXISTS`.

## Database Tables (15)
users, books, book_entries, entry_photos, capsules, capsule_photos, milestones, letter_drafts, mini_sites, couple_invites, guestbook_entries, scheduled_letters, site_books, site_entries, site_milestones

## API Endpoints (40+)
All authenticated endpoints require `Authorization: Bearer <token>`.
All routes prefixed with `/api`.

### Public (no auth)
- `GET /health`
- `GET /api/public/books/{share_token}`
- `GET /api/public/sites/{slug}`
- `GET /api/public/sites/{slug}/guestbook?pin=...`
- `POST /api/public/sites/{slug}/guestbook`

## Environment Variables

### Backend (.env)
- `JWT_SECRET` — Secret key for JWT signing
- `DB_PATH` — SQLite database path (default: ./eternova.db)
- `CORS_ORIGINS` — Comma-separated allowed origins
- `GMAIL_USER` — Gmail address for surprise letters
- `GMAIL_APP_PASSWORD` — Gmail app password

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` — Backend API URL

## Testing
```bash
# Backend health
curl http://localhost:8001/health

# Register
curl -X POST http://localhost:8001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","name":"Test","password":"test123"}'

# Frontend build check
cd frontend && npm run build
```
