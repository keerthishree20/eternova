from datetime import date

from fastapi import APIRouter, Depends, Query

from core.auth import get_current_user
from state.database import _get_conn, get_accessible_user_ids

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(user: dict = Depends(get_current_user)):
    user_ids = get_accessible_user_ids(user["id"])
    ph = ",".join("?" * len(user_ids))
    conn = _get_conn()
    today = date.today().isoformat()

    book_count = conn.execute(
        f"SELECT COUNT(*) FROM books WHERE user_id IN ({ph})", user_ids
    ).fetchone()[0]

    capsule_count = conn.execute(
        f"SELECT COUNT(*) FROM capsules WHERE user_id IN ({ph})", user_ids
    ).fetchone()[0]

    milestone_count = conn.execute(
        f"SELECT COUNT(*) FROM milestones WHERE user_id IN ({ph})", user_ids
    ).fetchone()[0]

    letter_count = conn.execute(
        "SELECT COUNT(*) FROM letter_drafts WHERE user_id = ?", (user["id"],)
    ).fetchone()[0]

    site_count = conn.execute(
        "SELECT COUNT(*) FROM mini_sites WHERE user_id = ?", (user["id"],)
    ).fetchone()[0]

    recent_books = conn.execute(
        f"SELECT * FROM books WHERE user_id IN ({ph}) ORDER BY updated_at DESC LIMIT 4", user_ids
    ).fetchall()

    upcoming = conn.execute(
        f"SELECT * FROM milestones WHERE user_id IN ({ph}) AND milestone_date >= ? ORDER BY milestone_date LIMIT 3",
        user_ids + [today],
    ).fetchall()

    newly_unlocked = conn.execute(
        f"SELECT * FROM capsules WHERE user_id IN ({ph}) AND unlock_date <= ? AND is_unlocked = 0 ORDER BY unlock_date",
        user_ids + [today],
    ).fetchall()

    otd_entries = conn.execute(
        f"""SELECT be.id, be.title, be.content, be.entry_date, b.title as book_title, b.person_name
           FROM book_entries be JOIN books b ON be.book_id = b.id
           WHERE b.user_id IN ({ph}) AND be.entry_date IS NOT NULL
           AND strftime('%m-%d', be.entry_date) = strftime('%m-%d', 'now')
           AND strftime('%Y', be.entry_date) < strftime('%Y', 'now')
           ORDER BY be.entry_date DESC""",
        user_ids,
    ).fetchall()

    otd_milestones = conn.execute(
        f"""SELECT * FROM milestones
           WHERE user_id IN ({ph})
           AND strftime('%m-%d', milestone_date) = strftime('%m-%d', 'now')
           AND strftime('%Y', milestone_date) < strftime('%Y', 'now')
           ORDER BY milestone_date DESC""",
        user_ids,
    ).fetchall()

    total_entries = conn.execute(
        f"SELECT COUNT(*) FROM book_entries be JOIN books b ON be.book_id = b.id WHERE b.user_id IN ({ph})",
        user_ids,
    ).fetchone()[0]

    total_photos = conn.execute(
        f"""SELECT COUNT(*) FROM entry_photos ep
            JOIN book_entries be ON ep.entry_id = be.id
            JOIN books b ON be.book_id = b.id
            WHERE b.user_id IN ({ph})""",
        user_ids,
    ).fetchone()[0]

    u_row = conn.execute("SELECT together_since FROM users WHERE id = ?", (user["id"],)).fetchone()
    together_since = u_row["together_since"] if u_row else None

    conn.close()

    upcoming_list = []
    for m in upcoming:
        d = dict(m)
        d["days_until"] = (date.fromisoformat(m["milestone_date"]) - date.today()).days
        upcoming_list.append(d)

    otd_milestone_list = []
    for m in otd_milestones:
        d = dict(m)
        d["days_until"] = (date.fromisoformat(m["milestone_date"]) - date.today()).days
        otd_milestone_list.append(d)

    return {
        "stats": {
            "books": book_count,
            "capsules": capsule_count,
            "milestones": milestone_count,
            "letters": letter_count,
            "sites": site_count,
        },
        "recent_books": [dict(r) for r in recent_books],
        "upcoming_milestones": upcoming_list,
        "newly_unlocked_capsules": [dict(c) for c in newly_unlocked],
        "on_this_day": {
            "entries": [dict(e) for e in otd_entries],
            "milestones": otd_milestone_list,
        },
        "total_entries": total_entries,
        "total_photos": total_photos,
        "together_since": together_since,
    }


@router.get("/search")
async def search(q: str = Query(..., min_length=1), user: dict = Depends(get_current_user)):
    user_ids = get_accessible_user_ids(user["id"])
    ph = ",".join("?" * len(user_ids))
    conn = _get_conn()
    query = f"%{q}%"

    books = conn.execute(
        f"SELECT id, title, person_name, cover_color FROM books WHERE user_id IN ({ph}) AND (title LIKE ? OR person_name LIKE ? OR description LIKE ?)",
        user_ids + [query, query, query],
    ).fetchall()

    entries = conn.execute(
        f"""SELECT be.id, be.title, be.content, be.entry_date, be.mood, b.id as book_id, b.title as book_title
            FROM book_entries be JOIN books b ON be.book_id = b.id
            WHERE b.user_id IN ({ph}) AND (be.title LIKE ? OR be.content LIKE ?)""",
        user_ids + [query, query],
    ).fetchall()

    milestones = conn.execute(
        f"SELECT id, title, description, milestone_date, category FROM milestones WHERE user_id IN ({ph}) AND (title LIKE ? OR description LIKE ?)",
        user_ids + [query, query],
    ).fetchall()

    conn.close()
    return {
        "books": [dict(r) for r in books],
        "entries": [dict(r) for r in entries],
        "milestones": [dict(r) for r in milestones],
    }


@router.get("/random-memory")
async def random_memory(user: dict = Depends(get_current_user)):
    user_ids = get_accessible_user_ids(user["id"])
    ph = ",".join("?" * len(user_ids))
    conn = _get_conn()
    entry = conn.execute(
        f"""SELECT be.id, be.title, be.content, be.entry_date, be.mood, b.title as book_title, b.person_name, b.id as book_id
            FROM book_entries be JOIN books b ON be.book_id = b.id
            WHERE b.user_id IN ({ph})
            ORDER BY RANDOM() LIMIT 1""",
        user_ids,
    ).fetchone()
    conn.close()
    if not entry:
        return None
    return dict(entry)


@router.post("/together-since")
async def set_together_since(body: dict, user: dict = Depends(get_current_user)):
    d = body.get("date")
    conn = _get_conn()
    conn.execute("UPDATE users SET together_since = ? WHERE id = ?", (d, user["id"]))
    conn.commit()
    conn.close()
    return {"ok": True, "together_since": d}
