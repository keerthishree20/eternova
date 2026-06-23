import uuid
import json
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends

from api.models import SaveDraftRequest, UpdateDraftRequest
from core.auth import get_current_user
from core.templates import get_all_templates, get_template, fill_template
from state.database import _get_conn

router = APIRouter(prefix="/letters", tags=["letters"])


@router.get("/templates")
async def list_templates(user: dict = Depends(get_current_user)):
    return get_all_templates()


@router.get("/templates/{template_id}")
async def get_template_detail(template_id: str, user: dict = Depends(get_current_user)):
    t = get_template(template_id)
    if not t:
        raise HTTPException(status_code=404, detail="Template not found")
    return t


@router.post("/preview")
async def preview_letter(req: SaveDraftRequest, user: dict = Depends(get_current_user)):
    result = fill_template(req.template_id, req.filled_fields)
    if result is None:
        raise HTTPException(status_code=400, detail="Invalid template or fields")
    return {"rendered": result}


@router.post("/drafts")
async def save_draft(req: SaveDraftRequest, user: dict = Depends(get_current_user)):
    draft_id = str(uuid.uuid4())
    conn = _get_conn()
    conn.execute(
        "INSERT INTO letter_drafts (id, user_id, template_id, filled_fields) VALUES (?, ?, ?, ?)",
        (draft_id, user["id"], req.template_id, json.dumps(req.filled_fields)),
    )
    conn.commit()
    conn.close()
    return {"id": draft_id, "template_id": req.template_id, "filled_fields": req.filled_fields}


@router.get("/drafts")
async def list_drafts(user: dict = Depends(get_current_user)):
    conn = _get_conn()
    rows = conn.execute(
        "SELECT * FROM letter_drafts WHERE user_id = ? ORDER BY updated_at DESC", (user["id"],)
    ).fetchall()
    conn.close()
    return [
        {**dict(r), "filled_fields": json.loads(r["filled_fields"])}
        for r in rows
    ]


@router.get("/drafts/{draft_id}")
async def get_draft(draft_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT * FROM letter_drafts WHERE id = ? AND user_id = ?", (draft_id, user["id"])
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Draft not found")
    return {**dict(row), "filled_fields": json.loads(row["filled_fields"])}


@router.put("/drafts/{draft_id}")
async def update_draft(draft_id: str, req: UpdateDraftRequest, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT id FROM letter_drafts WHERE id = ? AND user_id = ?", (draft_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Draft not found")
    conn.execute(
        "UPDATE letter_drafts SET filled_fields = ?, updated_at = ? WHERE id = ?",
        (json.dumps(req.filled_fields), datetime.utcnow().isoformat(), draft_id),
    )
    conn.commit()
    conn.close()
    return {"ok": True}


@router.delete("/drafts/{draft_id}")
async def delete_draft(draft_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT id FROM letter_drafts WHERE id = ? AND user_id = ?", (draft_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Draft not found")
    conn.execute("DELETE FROM letter_drafts WHERE id = ?", (draft_id,))
    conn.commit()
    conn.close()
    return {"ok": True}
