# Eternova — Complete Project Guide

## Table of Contents
1. [What is Eternova?](#what-is-eternova)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Deep Dive](#backend-deep-dive)
5. [Frontend Deep Dive](#frontend-deep-dive)
6. [Feature Walkthrough](#feature-walkthrough)
7. [Deployment Guide](#deployment-guide)
8. [Troubleshooting](#troubleshooting)

---

## What is Eternova?

Eternova is a full-stack web application for preserving love stories and relationship memories. Unlike social media or dating apps, it focuses on the deeply personal act of recording, protecting, and sharing memories with one special person.

**22 features** across **70 source files** (23 backend, 32 frontend), **15 database tables**, and **40+ API endpoints**.

---

## Architecture

```
┌─────────────────────────────┐
│         Vercel              │
│    Next.js 14 Frontend      │
│    (App Router + SSR)       │
│    Tailwind + Framer Motion │
└──────────┬──────────────────┘
           │ HTTPS (fetch)
           │ Bearer JWT
┌──────────▼──────────────────┐
│         Render              │
│    FastAPI Backend           │
│    (Uvicorn + Docker)       │
│    ┌───────────────────┐    │
│    │   SQLite (WAL)    │    │
│    │   15 tables       │    │
│    └───────────────────┘    │
│    ┌───────────────────┐    │
│    │   Gmail SMTP      │    │
│    │   (Surprise Ltrs) │    │
│    └───────────────────┘    │
└─────────────────────────────┘
```

**Data flow:**
1. User opens Vercel URL → Next.js serves the page
2. Client-side JS fetches data from FastAPI via `lib/api.ts`
3. FastAPI authenticates via JWT in `Authorization: Bearer` header
4. Queries SQLite using raw `sqlite3` module (no ORM)
5. Returns JSON → React renders the UI

---

## Database Schema

### 15 Tables

**Core User Data:**
- `users` — id, email, name, password_hash, partner_id, together_since
- `couple_invites` — id, from_user_id, invite_code, invite_email, status

**Memory Books:**
- `books` — id, user_id, title, person_name, description, cover_color, spotify_url, share_token, is_shared
- `book_entries` — id, book_id, title, content, entry_date, sort_order, mood
- `entry_photos` — id, entry_id, file_path, caption, sort_order

**Time Capsules:**
- `capsules` — id, user_id, title, message, unlock_date, is_unlocked
- `capsule_photos` — id, capsule_id, file_path, caption, sort_order

**Milestones:**
- `milestones` — id, user_id, title, description, milestone_date, category, icon, spotify_url

**Letters:**
- `letter_drafts` — id, user_id, template_id, filled_fields (JSON)
- `scheduled_letters` — id, user_id, recipient_email, recipient_name, subject, body, scheduled_date, is_sent, sent_at

**Mini-Sites:**
- `mini_sites` — id, user_id, slug, title, subtitle, partner_name, theme_color, accent_color, theme, guest_pin, is_published
- `site_books` — site_id, book_id, sort_order (many-to-many)
- `site_entries` — site_id, entry_id (selected entries filter)
- `site_milestones` — site_id, milestone_id (selected milestones filter)

**Guestbook:**
- `guestbook_entries` — id, site_id, author_name, message

### Safe Migrations
New columns added via `_add_column_if_missing()` so `init_db()` is safe to run multiple times. New tables use `CREATE TABLE IF NOT EXISTS`.

---

## Backend Deep Dive

### File-by-File

#### `main.py`
- Creates FastAPI app with lifespan for scheduled letter delivery
- Background task polls every 5 minutes for due letters
- CORS middleware reads `CORS_ORIGINS` env var
- 10 routers mounted under `/api` prefix
- StaticFiles mount for `/uploads`

#### `core/auth.py`
- `_hash_password()` — PBKDF2-HMAC-SHA256, 100k iterations, 32-byte salt
- `create_token()` — Custom JWT with HS256, base64url encoding, 24hr expiry
- `get_current_user()` — FastAPI `Depends()` that reads Bearer token, returns user dict or 401

#### `core/email.py`
- `send_email_sync()` — Blocking SMTP via Gmail SSL (port 465)
- `send_email()` — Async wrapper using `asyncio.to_thread()`
- Reads `GMAIL_USER` and `GMAIL_APP_PASSWORD` from env

#### `core/templates.py`
- 6 letter templates: love-letter, appreciation, missing-you, anniversary, apology, congratulations
- Each has id, name, category, description, fields (key/label/placeholder), body with `{field}` placeholders
- `fill_template()` replaces placeholders with user values

#### `state/database.py`
- SQLite with WAL mode and foreign keys ON
- `init_db()` creates all 15 tables + indexes
- `_add_column_if_missing()` for safe schema evolution
- `get_accessible_user_ids()` returns [user_id] or [user_id, partner_id] for couple mode

#### `api/routes/books.py`
- CRUD for books + entries + photos
- `list_books` uses `get_accessible_user_ids` for couple mode
- Photo upload via multipart `UploadFile`
- Cascading delete: book → entries → photos (files cleaned from disk)
- Share toggle generates/removes `share_token`

#### `api/routes/capsules.py`
- **Lock enforcement**: GET list hides `message` if `unlock_date > today`
- GET single capsule marks `is_unlocked=1` on first view after unlock
- Couple mode: partner sees your capsules too

#### `api/routes/sites.py`
- Multi-book linking via `site_books` junction table
- Entry selection via `site_entries` table
- Milestone selection via `site_milestones` table
- `_site_with_books()` enriches response with book_ids, entry_ids, milestone_ids
- Publish toggle flips `is_published`

#### `api/routes/public.py`
- No auth required — keyed by share_token (books) or slug (sites)
- Strips `guest_pin` from response, adds `has_guestbook` flag
- Guestbook: PIN verification on GET and POST
- Entry/milestone filtering: if `site_entries` or `site_milestones` has records, only those show

#### `api/routes/dashboard.py`
- Aggregated stats (all counts partner-aware)
- "On This Day": `strftime('%m-%d')` matching across years
- Search: LIKE queries across books, entries, milestones
- Random memory: `ORDER BY RANDOM() LIMIT 1`
- Together-since: stores date on user record

#### `api/routes/couple.py`
- Generate invite code (8-char `secrets.token_urlsafe`)
- Optional email invite via `core/email.py`
- Accept: links both users (sets `partner_id` on both)
- Unlink: clears `partner_id` on both

---

## Frontend Deep Dive

### Architecture
- All pages use `"use client"` (client-side rendering)
- `AuthContext` — stores user + token in localStorage, auto-validates on mount
- `ThemeContext` — dark/light toggle, persists in localStorage
- `lib/api.ts` — typed fetch wrapper with automatic Bearer token injection
- No external state management (useState + useEffect pattern)

### Key Components

#### `components/DetailsMenu.tsx`
Reusable 3-dot menu with details display + edit/delete actions. Used on books, capsules, milestones, sites, entries, and surprise letters.

#### `components/SpotifyEmbed.tsx`
Extracts track ID from Spotify URLs, renders iframe embed. Falls back to link if URL format is unexpected.

#### `components/layout/SearchBar.tsx`
Debounced search (300ms) with dropdown results grouped by books, entries, milestones. Appears in navbar.

#### `components/layout/MainWrapper.tsx`
Conditionally wraps pages in `max-w-7xl` container. Public pages (`/site/*`, `/shared/*`) render full-width.

### Page Routes (20)

| Route | Purpose |
|-------|---------|
| `/` | Dashboard — stats, together-since, on-this-day, surprise-me |
| `/login` | Login form |
| `/register` | Registration form |
| `/books` | Book list with 3-dot menu |
| `/books/new` | Create book with Spotify + color picker |
| `/books/[bookId]` | Page-flip reader with PDF export + Spotify |
| `/books/[bookId]/edit` | Entry CRUD with mood tags + inline editing |
| `/capsules` | Capsule grid with locked/unlocked states |
| `/capsules/new` | Create capsule with future date validation |
| `/milestones` | Timeline with inline edit via 3-dot menu |
| `/letters` | Template gallery with category badges |
| `/letters/[templateId]` | Fill-in-the-blank editor with live preview |
| `/surprise-letters` | Schedule email letters for future dates |
| `/sites` | Site list with QR code + publish toggle |
| `/sites/new` | Create site: multi-book, entry/milestone picker, themes |
| `/sites/[siteId]/edit` | Edit all site settings |
| `/site/[slug]` | Public mini-site with theme rendering + guestbook |
| `/shared/[token]` | Public shared book view |
| `/settings` | Couple mode: invite, accept, unlink |

### Theming
CSS variables in `globals.css` with `.dark` class toggle. Tailwind `darkMode: "class"`.

**Light**: cream background (#fef7f0), dark purple foreground
**Dark**: deep purple background (#0f0720), light lavender text

4 mini-site themes defined in `lib/siteThemes.ts`: romantic, minimal, vintage, neon.

---

## Feature Walkthrough

### 1. Register & Login
- Register with email, name, password (min 6 chars)
- JWT token stored in localStorage
- Auto-redirects to dashboard

### 2. Dashboard
- Welcome banner with "Surprise Me" button
- Together Since counter (set via date picker)
- Stats grid: books, capsules, milestones, letters, sites
- Total memories + photos counters
- On This Day section (entries/milestones from same day, past years)
- Newly unlocked capsules
- Recent books
- Upcoming milestones

### 3. Memory Books
- Create with title, person name, description, color, Spotify URL
- Add entries with title, content, date, mood tag
- Upload photos per entry
- Page-flip reader with prev/next navigation
- Share toggle generates secret link
- PDF download (title page + entries + photos)
- Inline edit entries from edit page
- 3-dot menu with created/updated details

### 4. Time Capsules
- Write message, set future unlock date
- Locked capsules show countdown
- Unlocked capsules have "Open" button with reveal animation
- Server never sends content before unlock date

### 5. Milestones
- Create with title, date, category, description, Spotify URL
- Vertical alternating timeline
- Status badges: "Today!", "X days away", "X days ago"
- Inline edit via 3-dot menu

### 6. Letter Generator
- 6 templates with different categories
- Fill-in-the-blank form on left, live preview on right
- Save as draft, download as .txt file

### 7. Surprise Letters
- Schedule email to be sent on a future date
- Enter recipient email, name, subject, body
- Background loop checks every 5 minutes for due letters
- Sends via Gmail SMTP with HTML formatting
- Status tracking: pending/sent

### 8. Mini-Sites
- Select multiple books (each = a chapter/day)
- Pick specific entries per book (or show all)
- Pick specific milestones (or show all)
- Choose theme: romantic, minimal, vintage, neon
- Custom colors (theme + accent)
- Partner name, subtitle
- Guest PIN for guestbook
- Publish/unpublish toggle
- QR code generation + download
- Public URL: /site/{slug}

### 9. Guestbook
- Set PIN when creating/editing site
- Public visitors enter PIN to unlock guestbook
- Leave messages with name
- Messages display on the site

### 10. Couple Mode
- Generate invite code (share manually)
- Or send email invite (with code in formatted email)
- Partner accepts code to link accounts
- Once linked: both see each other's books, capsules, milestones
- Dashboard stats include partner's data
- Can unlink at any time

### 11. Search
- Navbar search bar (debounced 300ms)
- Searches across book titles, entry content, milestone titles
- Results grouped by type with click-to-navigate

### 12. Spotify Integration
- Add Spotify track URL to books or milestones
- Renders embedded player on book reader, milestone cards, and public sites
- Falls back to link if URL format is non-standard

### 13. PDF Export
- Click "PDF" on book reader
- Generates formatted PDF: title page → entries → photos
- Downloads as `{book_title}.pdf`

### 14. QR Code
- Click "QR" on published site card
- Modal with QR code pointing to public URL
- Download as PNG

---

## Deployment Guide

### Backend on Render

1. Go to https://dashboard.render.com
2. **New** → **Web Service**
3. Connect repo: `keerthishree20/eternova`
4. Settings:
   - Name: `eternova-api`
   - Root Directory: `backend`
   - Runtime: Docker
   - Instance: Free
5. Environment Variables:
   - `JWT_SECRET` → Generate random value
   - `DB_PATH` → `./eternova.db`
   - `CORS_ORIGINS` → Your Vercel URL (e.g., `https://eternova-abc.vercel.app`)
   - `GMAIL_USER` → Your Gmail (optional)
   - `GMAIL_APP_PASSWORD` → App password (optional)
6. Deploy

### Frontend on Vercel

1. Go to https://vercel.com/new
2. Import `keerthishree20/eternova`
3. Root Directory: `frontend`
4. Framework: Next.js (auto-detected)
5. Environment Variable:
   - `NEXT_PUBLIC_API_URL` → Your Render URL (e.g., `https://eternova-api.onrender.com`)
6. Deploy

### Post-Deploy
- Update Render's `CORS_ORIGINS` to your actual Vercel URL
- Test: register → login → create book → share → verify public link works

### Free Tier Notes
- Render free tier spins down after 15 min inactivity (30-50s cold start)
- SQLite DB resets on each Render redeploy (no persistent disk on free tier)
- For persistence, upgrade to Render Starter ($7/mo) for persistent disk

---

## Troubleshooting

### "Cannot find module './vendor-chunks/motion-dom.js'"
Stale `.next` cache. Fix: `rm -rf frontend/.next` and restart dev server.

### Port already in use
```bash
fuser -k 3000/tcp  # Kill frontend
fuser -k 8001/tcp  # Kill backend
```

### Backend 500 errors
Check the terminal running uvicorn for Python tracebacks. Common cause: missing column (run `init_db()` to apply migrations).

### CORS errors in browser
Verify `CORS_ORIGINS` in backend `.env` includes the frontend URL. Use `*` for development.

### Guestbook PIN not working
PIN comparison is exact string match. Check the PIN set on the site via the API or edit page.

### Email not sending
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set
- Use a Gmail App Password (not your regular password): https://myaccount.google.com/apppasswords
- Check backend logs for SMTP errors

### Couple mode not sharing data
After linking, both partners need to refresh/re-login. The `get_accessible_user_ids()` reads `partner_id` on each request.
