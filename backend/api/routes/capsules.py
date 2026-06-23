import uuid
from datetime import date

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File

from api.models import CreateCapsuleRequest
from core.auth import get_current_user
from core.photos import save_photo, delete_photo
from state.database import _get_conn, get_accessible_user_ids

router = APIRouter(prefix="/capsules", tags=["capsules"])


@router.get("")
async def list_capsules(user: dict = Depends(get_current_user)):
    user_ids = get_accessible_user_ids(user["id"])
    placeholders = ",".join("?" * len(user_ids))
    conn = _get_conn()
    rows = conn.execute(
        f"SELECT * FROM capsules WHERE user_id IN ({placeholders}) ORDER BY unlock_date", user_ids
    ).fetchall()
    capsules = []
    for r in rows:
        is_locked = date.fromisoformat(r["unlock_date"]) > date.today()
        photo_count = conn.execute(
            "SELECT COUNT(*) FROM capsule_photos WHERE capsule_id = ?", (r["id"],)
        ).fetchone()[0]
        item = {
            "id": r["id"],
            "title": r["title"],
            "unlock_date": r["unlock_date"],
            "is_locked": is_locked,
            "created_at": r["created_at"],
            "photo_count": photo_count,
        }
        if not is_locked:
            item["message"] = r["message"]
        capsules.append(item)
    conn.close()
    return capsules


@router.post("")
async def create_capsule(req: CreateCapsuleRequest, user: dict = Depends(get_current_user)):
    if req.unlock_date <= date.today():
        raise HTTPException(status_code=400, detail="Unlock date must be in the future")
    capsule_id = str(uuid.uuid4())
    conn = _get_conn()
    conn.execute(
        "INSERT INTO capsules (id, user_id, title, message, unlock_date) VALUES (?, ?, ?, ?, ?)",
        (capsule_id, user["id"], req.title, req.message, req.unlock_date.isoformat()),
    )
    conn.commit()
    conn.close()
    return {
        "id": capsule_id,
        "title": req.title,
        "unlock_date": req.unlock_date.isoformat(),
        "is_locked": True,
        "created_at": None,
    }


@router.get("/{capsule_id}")
async def get_capsule(capsule_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM capsules WHERE id = ? AND user_id = ?", (capsule_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Capsule not found")
    is_locked = date.fromisoformat(row["unlock_date"]) > date.today()
    result = {
        "id": row["id"],
        "title": row["title"],
        "unlock_date": row["unlock_date"],
        "is_locked": is_locked,
        "created_at": row["created_at"],
    }
    if not is_locked:
        result["message"] = row["message"]
        photos = conn.execute(
            "SELECT * FROM capsule_photos WHERE capsule_id = ? ORDER BY sort_order", (capsule_id,)
        ).fetchall()
        result["photos"] = [dict(p) for p in photos]
        if not row["is_unlocked"]:
            conn.execute("UPDATE capsules SET is_unlocked = 1 WHERE id = ?", (capsule_id,))
            conn.commit()
    conn.close()
    return result


@router.delete("/{capsule_id}")
async def delete_capsule(capsule_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT id FROM capsules WHERE id = ? AND user_id = ?", (capsule_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Capsule not found")
    photos = conn.execute("SELECT file_path FROM capsule_photos WHERE capsule_id = ?", (capsule_id,)).fetchall()
    for p in photos:
        delete_photo(p["file_path"])
    conn.execute("DELETE FROM capsules WHERE id = ?", (capsule_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.post("/{capsule_id}/photos")
async def upload_capsule_photos(
    capsule_id: str,
    files: list[UploadFile] = File(...),
    user: dict = Depends(get_current_user),
):
    conn = _get_conn()
    row = conn.execute(
        "SELECT id FROM capsules WHERE id = ? AND user_id = ?", (capsule_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Capsule not found")
    uploaded = []
    for file in files:
        content = await file.read()
        filename = save_photo(content, file.filename or "photo.jpg")
        photo_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO capsule_photos (id, capsule_id, file_path, caption) VALUES (?, ?, ?, ?)",
            (photo_id, capsule_id, filename, ""),
        )
        uploaded.append({"id": photo_id, "file_path": filename})
    conn.commit()
    conn.close()
    return uploaded
