import sqlite3
import os
from pathlib import Path
from typing import Optional

DB_PATH = os.getenv("DB_PATH", str(Path(__file__).parent.parent / "eternova.db"))


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    cols = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return any(c["name"] == column for c in cols)


def _add_column_if_missing(conn: sqlite3.Connection, table: str, column: str, col_def: str):
    if not _column_exists(conn, table, column):
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_def}")


def get_accessible_user_ids(user_id: str) -> list:
    conn = _get_conn()
    user = conn.execute("SELECT partner_id FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if user and user["partner_id"]:
        return [user_id, user["partner_id"]]
    return [user_id]


def init_db():
    conn = _get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS books (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            person_name TEXT NOT NULL,
            description TEXT DEFAULT '',
            cover_color TEXT DEFAULT '#7c3aed',
            share_token TEXT UNIQUE,
            is_shared INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS book_entries (
            id TEXT PRIMARY KEY,
            book_id TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            entry_date DATE,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS entry_photos (
            id TEXT PRIMARY KEY,
            entry_id TEXT NOT NULL,
            file_path TEXT NOT NULL,
            caption TEXT DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (entry_id) REFERENCES book_entries(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS capsules (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            unlock_date DATE NOT NULL,
            is_unlocked INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS capsule_photos (
            id TEXT PRIMARY KEY,
            capsule_id TEXT NOT NULL,
            file_path TEXT NOT NULL,
            caption TEXT DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            FOREIGN KEY (capsule_id) REFERENCES capsules(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS milestones (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            milestone_date DATE NOT NULL,
            category TEXT DEFAULT 'other',
            icon TEXT DEFAULT 'heart',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS letter_drafts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            template_id TEXT NOT NULL,
            filled_fields TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS mini_sites (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            subtitle TEXT DEFAULT '',
            partner_name TEXT DEFAULT '',
            theme_color TEXT DEFAULT '#7c3aed',
            accent_color TEXT DEFAULT '#ec4899',
            background_style TEXT DEFAULT 'gradient',
            book_id TEXT,
            show_milestones INTEGER DEFAULT 1,
            show_photos INTEGER DEFAULT 1,
            is_published INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_books_user ON books(user_id);
        CREATE INDEX IF NOT EXISTS idx_books_share_token ON books(share_token);
        CREATE INDEX IF NOT EXISTS idx_book_entries_book ON book_entries(book_id);
        CREATE INDEX IF NOT EXISTS idx_entry_photos_entry ON entry_photos(entry_id);
        CREATE INDEX IF NOT EXISTS idx_capsules_user ON capsules(user_id);
        CREATE INDEX IF NOT EXISTS idx_capsule_photos_capsule ON capsule_photos(capsule_id);
        CREATE INDEX IF NOT EXISTS idx_milestones_user ON milestones(user_id);
        CREATE INDEX IF NOT EXISTS idx_letter_drafts_user ON letter_drafts(user_id);
        CREATE INDEX IF NOT EXISTS idx_mini_sites_user ON mini_sites(user_id);
        CREATE INDEX IF NOT EXISTS idx_mini_sites_slug ON mini_sites(slug);

        CREATE TABLE IF NOT EXISTS couple_invites (
            id TEXT PRIMARY KEY,
            from_user_id TEXT NOT NULL,
            invite_code TEXT UNIQUE NOT NULL,
            invite_email TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (from_user_id) REFERENCES users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_couple_invites_code ON couple_invites(invite_code);
        CREATE INDEX IF NOT EXISTS idx_couple_invites_email ON couple_invites(invite_email);

        CREATE TABLE IF NOT EXISTS guestbook_entries (
            id TEXT PRIMARY KEY,
            site_id TEXT NOT NULL,
            author_name TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (site_id) REFERENCES mini_sites(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_guestbook_site ON guestbook_entries(site_id);

        CREATE TABLE IF NOT EXISTS scheduled_letters (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            recipient_email TEXT NOT NULL,
            recipient_name TEXT DEFAULT '',
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            scheduled_date DATE NOT NULL,
            is_sent INTEGER DEFAULT 0,
            sent_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_scheduled_letters_user ON scheduled_letters(user_id);
        CREATE INDEX IF NOT EXISTS idx_scheduled_letters_date ON scheduled_letters(scheduled_date);
    """)

    _add_column_if_missing(conn, "users", "partner_id", "TEXT DEFAULT NULL")
    _add_column_if_missing(conn, "books", "spotify_url", "TEXT DEFAULT NULL")
    _add_column_if_missing(conn, "milestones", "spotify_url", "TEXT DEFAULT NULL")
    _add_column_if_missing(conn, "mini_sites", "guest_pin", "TEXT DEFAULT NULL")
    _add_column_if_missing(conn, "mini_sites", "theme", "TEXT DEFAULT 'romantic'")
    _add_column_if_missing(conn, "book_entries", "mood", "TEXT DEFAULT NULL")

    conn.execute("""CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    _add_column_if_missing(conn, "users", "together_since", "DATE DEFAULT NULL")

    conn.execute("""CREATE TABLE IF NOT EXISTS site_books (
        site_id TEXT NOT NULL,
        book_id TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        PRIMARY KEY (site_id, book_id),
        FOREIGN KEY (site_id) REFERENCES mini_sites(id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )""")

    conn.execute("""CREATE TABLE IF NOT EXISTS site_entries (
        site_id TEXT NOT NULL,
        entry_id TEXT NOT NULL,
        PRIMARY KEY (site_id, entry_id),
        FOREIGN KEY (site_id) REFERENCES mini_sites(id) ON DELETE CASCADE,
        FOREIGN KEY (entry_id) REFERENCES book_entries(id) ON DELETE CASCADE
    )""")

    conn.execute("""CREATE TABLE IF NOT EXISTS site_milestones (
        site_id TEXT NOT NULL,
        milestone_id TEXT NOT NULL,
        PRIMARY KEY (site_id, milestone_id),
        FOREIGN KEY (site_id) REFERENCES mini_sites(id) ON DELETE CASCADE,
        FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
    )""")

    conn.commit()
    conn.close()


# ── User operations ──────────────────────────────────────────────────────────

def create_user(id: str, email: str, name: str, password_hash: str) -> bool:
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
            (id, email, name, password_hash),
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()


def get_user_by_email(email: str) -> Optional[dict]:
    conn = _get_conn()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: str) -> Optional[dict]:
    conn = _get_conn()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


try:
    init_db()
except Exception:
    pass
