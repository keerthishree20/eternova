import uuid

from fastapi import APIRouter, HTTPException, Depends

from api.models import CreateScheduledLetterRequest
from core.auth import get_current_user
from state.database import _get_conn

router = APIRouter(prefix="/scheduled-letters", tags=["scheduled-letters"])


@router.get("")
async def list_letters(user: dict = Depends(get_current_user)):
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM scheduled_letters WHERE user_id = ? ORDER BY scheduled_date", (user["id"],)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("")
async def create_letter(req: CreateScheduledLetterRequest, user: dict = Depends(get_current_user)):
    letter_id = str(uuid.uuid4())
    conn = _get_conn()
    conn.execute(
        """INSERT INTO scheduled_letters (id, user_id, recipient_email, recipient_name, subject, body, scheduled_date)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (letter_id, user["id"], req.recipient_email, req.recipient_name, req.subject, req.body,
         req.scheduled_date.isoformat()),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM scheduled_letters WHERE id = ?", (letter_id,)).fetchone()
    conn.close()
    return dict(row)


@router.get("/{letter_id}")
async def get_letter(letter_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM scheduled_letters WHERE id = ? AND user_id = ?", (letter_id, user["id"])
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Letter not found")
    return dict(row)


@router.delete("/{letter_id}")
async def delete_letter(letter_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT id, is_sent FROM scheduled_letters WHERE id = ? AND user_id = ?", (letter_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Letter not found")
    conn.execute("DELETE FROM scheduled_letters WHERE id = ?", (letter_id,))
    conn.commit()
    conn.close()
    return {"ok": True}
