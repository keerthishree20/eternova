import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends

from api.models import CreateSiteRequest, UpdateSiteRequest
from core.auth import get_current_user
from state.database import _get_conn

router = APIRouter(prefix="/sites", tags=["sites"])


def _get_book_ids(conn, site_id: str) -> list:
    rows = conn.execute(
        "SELECT book_id FROM site_books WHERE site_id = ? ORDER BY sort_order", (site_id,)
    ).fetchall()
    return [r["book_id"] for r in rows]


def _get_entry_ids(conn, site_id: str) -> list:
    rows = conn.execute(
        "SELECT entry_id FROM site_entries WHERE site_id = ?", (site_id,)
    ).fetchall()
    return [r["entry_id"] for r in rows]


def _set_book_ids(conn, site_id: str, book_ids: list):
    conn.execute("DELETE FROM site_books WHERE site_id = ?", (site_id,))
    for i, bid in enumerate(book_ids):
        conn.execute(
            "INSERT INTO site_books (site_id, book_id, sort_order) VALUES (?, ?, ?)",
            (site_id, bid, i),
        )


def _set_entry_ids(conn, site_id: str, entry_ids: list):
    conn.execute("DELETE FROM site_entries WHERE site_id = ?", (site_id,))
    for eid in entry_ids:
        conn.execute(
            "INSERT OR IGNORE INTO site_entries (site_id, entry_id) VALUES (?, ?)",
            (site_id, eid),
        )


def _get_milestone_ids(conn, site_id: str) -> list:
    rows = conn.execute(
        "SELECT milestone_id FROM site_milestones WHERE site_id = ?", (site_id,)
    ).fetchall()
    return [r["milestone_id"] for r in rows]


def _set_milestone_ids(conn, site_id: str, milestone_ids: list):
    conn.execute("DELETE FROM site_milestones WHERE site_id = ?", (site_id,))
    for mid in milestone_ids:
        conn.execute(
            "INSERT OR IGNORE INTO site_milestones (site_id, milestone_id) VALUES (?, ?)",
            (site_id, mid),
        )


def _site_with_books(conn, row) -> dict:
    result = dict(row)
    result["book_ids"] = _get_book_ids(conn, row["id"])
    result["entry_ids"] = _get_entry_ids(conn, row["id"])
    result["milestone_ids"] = _get_milestone_ids(conn, row["id"])
    return result


@router.get("")
async def list_sites(user: dict = Depends(get_current_user)):
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM mini_sites WHERE user_id = ? ORDER BY updated_at DESC", (user["id"],)
    ).fetchall()
    sites = [_site_with_books(conn, r) for r in rows]
    conn.close()
    return sites


@router.post("")
async def create_site(req: CreateSiteRequest, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    existing = conn.execute("SELECT id FROM mini_sites WHERE slug = ?", (req.slug,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Slug already taken")
    site_id = str(uuid.uuid4())
    conn.execute(
        """INSERT INTO mini_sites (id, user_id, slug, title, subtitle, partner_name,
           theme_color, accent_color, background_style, theme, book_id,
           show_milestones, show_photos, guest_pin)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (site_id, user["id"], req.slug, req.title, req.subtitle, req.partner_name,
         req.theme_color, req.accent_color, req.background_style, req.theme, req.book_id,
         int(req.show_milestones), int(req.show_photos), req.guest_pin),
    )
    book_ids = req.book_ids if req.book_ids else ([req.book_id] if req.book_id else [])
    _set_book_ids(conn, site_id, book_ids)
    if req.entry_ids:
        _set_entry_ids(conn, site_id, req.entry_ids)
    if req.milestone_ids:
        _set_milestone_ids(conn, site_id, req.milestone_ids)
    conn.commit()
    row = conn.execute("SELECT * FROM mini_sites WHERE id = ?", (site_id,)).fetchone()
    result = _site_with_books(conn, row)
    conn.close()
    return result


@router.get("/{site_id}")
async def get_site(site_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM mini_sites WHERE id = ? AND user_id = ?", (site_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Site not found")
    result = _site_with_books(conn, row)
    conn.close()
    return result


@router.put("/{site_id}")
async def update_site(site_id: str, req: UpdateSiteRequest, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT id FROM mini_sites WHERE id = ? AND user_id = ?", (site_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Site not found")
    updates = {}
    for k, v in req.model_dump().items():
        if v is not None and k not in ("book_ids", "entry_ids", "milestone_ids"):
            if isinstance(v, bool):
                updates[k] = int(v)
            else:
                updates[k] = v
    if updates:
        updates["updated_at"] = datetime.utcnow().isoformat()
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        conn.execute(f"UPDATE mini_sites SET {set_clause} WHERE id = ?", (*updates.values(), site_id))
    if req.book_ids is not None:
        _set_book_ids(conn, site_id, req.book_ids)
    if req.entry_ids is not None:
        _set_entry_ids(conn, site_id, req.entry_ids)
    if req.milestone_ids is not None:
        _set_milestone_ids(conn, site_id, req.milestone_ids)
    conn.commit()
    row = conn.execute("SELECT * FROM mini_sites WHERE id = ?", (site_id,)).fetchone()
    result = _site_with_books(conn, row)
    conn.close()
    return result


@router.delete("/{site_id}")
async def delete_site(site_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT id FROM mini_sites WHERE id = ? AND user_id = ?", (site_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Site not found")
    conn.execute("DELETE FROM mini_sites WHERE id = ?", (site_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.post("/{site_id}/publish")
async def toggle_publish(site_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM mini_sites WHERE id = ? AND user_id = ?", (site_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Site not found")
    new_state = 0 if row["is_published"] else 1
    conn.execute("UPDATE mini_sites SET is_published = ?, updated_at = ? WHERE id = ?",
                 (new_state, datetime.utcnow().isoformat(), site_id))
    conn.commit()
    row = conn.execute("SELECT * FROM mini_sites WHERE id = ?", (site_id,)).fetchone()
    result = _site_with_books(conn, row)
    conn.close()
    return result
