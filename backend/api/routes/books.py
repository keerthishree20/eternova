import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File

from api.models import CreateBookRequest, UpdateBookRequest, CreateEntryRequest, UpdateEntryRequest
from core.auth import get_current_user
from core.photos import save_photo, delete_photo
from core.sharing import generate_share_token
from state.database import _get_conn, get_accessible_user_ids

router = APIRouter(prefix="/books", tags=["books"])


@router.get("")
async def list_books(user: dict = Depends(get_current_user)):
    user_ids = get_accessible_user_ids(user["id"])
    placeholders = ",".join("?" * len(user_ids))
    conn = _get_conn()
    rows = conn.execute(
        f"SELECT * FROM books WHERE user_id IN ({placeholders}) ORDER BY updated_at DESC", user_ids
    ).fetchall()
    books = []
    for r in rows:
        entry_count = conn.execute(
            "SELECT COUNT(*) FROM book_entries WHERE book_id = ?", (r["id"],)
        ).fetchone()[0]
        books.append({**dict(r), "entry_count": entry_count})
    conn.close()
    return books


@router.post("")
async def create_book(req: CreateBookRequest, user: dict = Depends(get_current_user)):
    book_id = str(uuid.uuid4())
    conn = _get_conn()
    conn.execute(
        "INSERT INTO books (id, user_id, title, person_name, description, cover_color, spotify_url) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (book_id, user["id"], req.title, req.person_name, req.description, req.cover_color, req.spotify_url),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    conn.close()
    return dict(row)


@router.get("/{book_id}")
async def get_book(book_id: str, user: dict = Depends(get_current_user)):
    user_ids = get_accessible_user_ids(user["id"])
    placeholders = ",".join("?" * len(user_ids))
    conn = _get_conn()
    book = conn.execute(
        f"SELECT * FROM books WHERE id = ? AND user_id IN ({placeholders})", [book_id] + user_ids
    ).fetchone()
    if not book:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    entries = conn.execute(
        "SELECT * FROM book_entries WHERE book_id = ? ORDER BY sort_order, created_at", (book_id,)
    ).fetchall()
    result = {**dict(book), "entries": []}
    for entry in entries:
        photos = conn.execute(
            "SELECT * FROM entry_photos WHERE entry_id = ? ORDER BY sort_order", (entry["id"],)
        ).fetchall()
        result["entries"].append({**dict(entry), "photos": [dict(p) for p in photos]})
    conn.close()
    return result


@router.put("/{book_id}")
async def update_book(book_id: str, req: UpdateBookRequest, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    book = conn.execute(
        "SELECT id FROM books WHERE id = ? AND user_id = ?", (book_id, user["id"])
    ).fetchone()
    if not book:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    if updates:
        updates["updated_at"] = datetime.utcnow().isoformat()
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        conn.execute(
            f"UPDATE books SET {set_clause} WHERE id = ?",
            (*updates.values(), book_id),
        )
        conn.commit()
    row = conn.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    conn.close()
    return dict(row)


@router.delete("/{book_id}")
async def delete_book(book_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    book = conn.execute(
        "SELECT id FROM books WHERE id = ? AND user_id = ?", (book_id, user["id"])
    ).fetchone()
    if not book:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    photos = conn.execute(
        "SELECT ep.file_path FROM entry_photos ep JOIN book_entries be ON ep.entry_id = be.id WHERE be.book_id = ?",
        (book_id,),
    ).fetchall()
    for p in photos:
        delete_photo(p["file_path"])
    conn.execute("DELETE FROM books WHERE id = ?", (book_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.post("/{book_id}/share")
async def toggle_share(book_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    book = conn.execute(
        "SELECT * FROM books WHERE id = ? AND user_id = ?", (book_id, user["id"])
    ).fetchone()
    if not book:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    if book["is_shared"]:
        conn.execute("UPDATE books SET is_shared = 0, share_token = NULL WHERE id = ?", (book_id,))
    else:
        token = generate_share_token()
        conn.execute("UPDATE books SET is_shared = 1, share_token = ? WHERE id = ?", (token, book_id))
    conn.commit()
    row = conn.execute("SELECT * FROM books WHERE id = ?", (book_id,)).fetchone()
    conn.close()
    return dict(row)


# ── Entries ──────────────────────────────────────────────────────────────────

@router.post("/{book_id}/entries")
async def create_entry(book_id: str, req: CreateEntryRequest, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    book = conn.execute(
        "SELECT id FROM books WHERE id = ? AND user_id = ?", (book_id, user["id"])
    ).fetchone()
    if not book:
        conn.close()
        raise HTTPException(status_code=404, detail="Book not found")
    entry_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO book_entries (id, book_id, title, content, entry_date, sort_order, mood) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (entry_id, book_id, req.title, req.content, req.entry_date.isoformat() if req.entry_date else None, req.sort_order, req.mood),
    )
    conn.execute("UPDATE books SET updated_at = ? WHERE id = ?", (datetime.utcnow().isoformat(), book_id))
    conn.commit()
    row = conn.execute("SELECT * FROM book_entries WHERE id = ?", (entry_id,)).fetchone()
    conn.close()
    return dict(row)


@router.put("/{book_id}/entries/{entry_id}")
async def update_entry(book_id: str, entry_id: str, req: UpdateEntryRequest, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    entry = conn.execute(
        "SELECT be.id FROM book_entries be JOIN books b ON be.book_id = b.id WHERE be.id = ? AND be.book_id = ? AND b.user_id = ?",
        (entry_id, book_id, user["id"]),
    ).fetchone()
    if not entry:
        conn.close()
        raise HTTPException(status_code=404, detail="Entry not found")
    updates = {}
    for k, v in req.model_dump().items():
        if v is not None:
            updates[k] = v.isoformat() if k == "entry_date" else v
    if updates:
        updates["updated_at"] = datetime.utcnow().isoformat()
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        conn.execute(f"UPDATE book_entries SET {set_clause} WHERE id = ?", (*updates.values(), entry_id))
        conn.commit()
    row = conn.execute("SELECT * FROM book_entries WHERE id = ?", (entry_id,)).fetchone()
    conn.close()
    return dict(row)


@router.delete("/{book_id}/entries/{entry_id}")
async def delete_entry(book_id: str, entry_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    entry = conn.execute(
        "SELECT be.id FROM book_entries be JOIN books b ON be.book_id = b.id WHERE be.id = ? AND be.book_id = ? AND b.user_id = ?",
        (entry_id, book_id, user["id"]),
    ).fetchone()
    if not entry:
        conn.close()
        raise HTTPException(status_code=404, detail="Entry not found")
    photos = conn.execute("SELECT file_path FROM entry_photos WHERE entry_id = ?", (entry_id,)).fetchall()
    for p in photos:
        delete_photo(p["file_path"])
    conn.execute("DELETE FROM book_entries WHERE id = ?", (entry_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# ── Photos ───────────────────────────────────────────────────────────────────

@router.post("/{book_id}/entries/{entry_id}/photos")
async def upload_photos(
    book_id: str, entry_id: str,
    files: list[UploadFile] = File(...),
    user: dict = Depends(get_current_user),
):
    conn = _get_conn()
    entry = conn.execute(
        "SELECT be.id FROM book_entries be JOIN books b ON be.book_id = b.id WHERE be.id = ? AND be.book_id = ? AND b.user_id = ?",
        (entry_id, book_id, user["id"]),
    ).fetchone()
    if not entry:
        conn.close()
        raise HTTPException(status_code=404, detail="Entry not found")
    uploaded = []
    for file in files:
        content = await file.read()
        filename = save_photo(content, file.filename or "photo.jpg")
        photo_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO entry_photos (id, entry_id, file_path, caption) VALUES (?, ?, ?, ?)",
            (photo_id, entry_id, filename, ""),
        )
        uploaded.append({"id": photo_id, "file_path": filename})
    conn.commit()
    conn.close()
    return uploaded


@router.delete("/photos/{photo_id}")
async def delete_photo_endpoint(photo_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    photo = conn.execute(
        "SELECT ep.* FROM entry_photos ep JOIN book_entries be ON ep.entry_id = be.id JOIN books b ON be.book_id = b.id WHERE ep.id = ? AND b.user_id = ?",
        (photo_id, user["id"]),
    ).fetchone()
    if not photo:
        conn.close()
        raise HTTPException(status_code=404, detail="Photo not found")
    delete_photo(photo["file_path"])
    conn.execute("DELETE FROM entry_photos WHERE id = ?", (photo_id,))
    conn.commit()
    conn.close()
    return {"ok": True}
