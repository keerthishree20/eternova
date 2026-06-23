import uuid
from datetime import date

from fastapi import APIRouter, HTTPException, Query

from api.models import GuestbookEntryRequest
from state.database import _get_conn

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/books/{share_token}")
async def get_shared_book(share_token: str):
    conn = _get_conn()
    book = conn.execute(
        "SELECT * FROM books WHERE share_token = ? AND is_shared = 1", (share_token,)
    ).fetchone()
    if not book:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    entries = conn.execute(
        "SELECT * FROM book_entries WHERE book_id = ? ORDER BY sort_order, created_at", (book["id"],)
    ).fetchall()
    result = {
        "id": book["id"],
        "title": book["title"],
        "person_name": book["person_name"],
        "description": book["description"],
        "cover_color": book["cover_color"],
        "spotify_url": book["spotify_url"],
        "entries": [],
    }
    for entry in entries:
        photos = conn.execute(
            "SELECT * FROM entry_photos WHERE entry_id = ? ORDER BY sort_order", (entry["id"],)
        ).fetchall()
        result["entries"].append({**dict(entry), "photos": [dict(p) for p in photos]})
    conn.close()
    return result


@router.get("/sites/{slug}")
async def get_public_site(slug: str):
    conn = _get_conn()
    site = conn.execute(
        "SELECT * FROM mini_sites WHERE slug = ? AND is_published = 1", (slug,)
    ).fetchone()
    if not site:
        conn.close()
        raise HTTPException(status_code=404, detail="Site not found")
    result = dict(site)
    result.pop("guest_pin", None)
    result["has_guestbook"] = bool(site["guest_pin"])

    # Load linked books + selected entries
    site_book_rows = conn.execute(
        "SELECT book_id FROM site_books WHERE site_id = ? ORDER BY sort_order", (site["id"],)
    ).fetchall()
    linked_book_ids = [r["book_id"] for r in site_book_rows]
    if not linked_book_ids and site["book_id"]:
        linked_book_ids = [site["book_id"]]

    selected_entry_rows = conn.execute(
        "SELECT entry_id FROM site_entries WHERE site_id = ?", (site["id"],)
    ).fetchall()
    selected_entry_ids = {r["entry_id"] for r in selected_entry_rows}

    books_list = []
    for bid in linked_book_ids:
        book = conn.execute("SELECT * FROM books WHERE id = ?", (bid,)).fetchone()
        if not book:
            continue
        entries = conn.execute(
            "SELECT * FROM book_entries WHERE book_id = ? ORDER BY sort_order, created_at",
            (book["id"],),
        ).fetchall()
        book_data = {**dict(book), "entries": []}
        for entry in entries:
            if selected_entry_ids and entry["id"] not in selected_entry_ids:
                continue
            photos = conn.execute(
                "SELECT * FROM entry_photos WHERE entry_id = ? ORDER BY sort_order",
                (entry["id"],),
            ).fetchall()
            if site["show_photos"]:
                book_data["entries"].append({**dict(entry), "photos": [dict(p) for p in photos]})
            else:
                book_data["entries"].append({**dict(entry), "photos": []})
        books_list.append(book_data)

    result["books"] = books_list
    result["book"] = books_list[0] if books_list else None
    if site["show_milestones"]:
        selected_ms_rows = conn.execute(
            "SELECT milestone_id FROM site_milestones WHERE site_id = ?", (site["id"],)
        ).fetchall()
        selected_ms_ids = {r["milestone_id"] for r in selected_ms_rows}
        milestones = conn.execute(
            "SELECT * FROM milestones WHERE user_id = ? ORDER BY milestone_date",
            (site["user_id"],),
        ).fetchall()
        if selected_ms_ids:
            result["milestones"] = [dict(m) for m in milestones if m["id"] in selected_ms_ids]
        else:
            result["milestones"] = [dict(m) for m in milestones]
    else:
        result["milestones"] = []
    conn.close()
    return result


@router.get("/sites/{slug}/guestbook")
async def get_guestbook(slug: str, pin: str = Query(...)):
    conn = _get_conn()
    site = conn.execute(
        "SELECT id, guest_pin FROM mini_sites WHERE slug = ? AND is_published = 1", (slug,)
    ).fetchone()
    if not site or not site["guest_pin"] or site["guest_pin"] != pin:
        conn.close()
        raise HTTPException(status_code=403, detail="Invalid PIN")
    rows = conn.execute(
        "SELECT * FROM guestbook_entries WHERE site_id = ? ORDER BY created_at", (site["id"],)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/sites/{slug}/guestbook")
async def add_guestbook_entry(slug: str, req: GuestbookEntryRequest):
    conn = _get_conn()
    site = conn.execute(
        "SELECT id, guest_pin FROM mini_sites WHERE slug = ? AND is_published = 1", (slug,)
    ).fetchone()
    if not site or not site["guest_pin"] or site["guest_pin"] != req.pin:
        conn.close()
        raise HTTPException(status_code=403, detail="Invalid PIN")
    entry_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO guestbook_entries (id, site_id, author_name, message) VALUES (?, ?, ?, ?)",
        (entry_id, site["id"], req.author_name, req.message),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM guestbook_entries WHERE id = ?", (entry_id,)).fetchone()
    conn.close()
    return dict(row)
