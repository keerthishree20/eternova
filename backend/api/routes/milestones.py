import uuid
from datetime import date

from fastapi import APIRouter, HTTPException, Depends

from api.models import CreateMilestoneRequest, UpdateMilestoneRequest
from core.auth import get_current_user
from state.database import _get_conn, get_accessible_user_ids

router = APIRouter(prefix="/milestones", tags=["milestones"])


@router.get("")
async def list_milestones(user: dict = Depends(get_current_user)):
    user_ids = get_accessible_user_ids(user["id"])
    placeholders = ",".join("?" * len(user_ids))
    conn = _get_conn()
    rows = conn.execute(
        f"SELECT * FROM milestones WHERE user_id IN ({placeholders}) ORDER BY milestone_date", user_ids
    ).fetchall()
    conn.close()
    result = []
    today = date.today()
    for r in rows:
        m = dict(r)
        m_date = date.fromisoformat(r["milestone_date"])
        m["days_until"] = (m_date - today).days
        result.append(m)
    return result


@router.post("")
async def create_milestone(req: CreateMilestoneRequest, user: dict = Depends(get_current_user)):
    milestone_id = str(uuid.uuid4())
    conn = _get_conn()
    conn.execute(
        "INSERT INTO milestones (id, user_id, title, description, milestone_date, category, icon, spotify_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (milestone_id, user["id"], req.title, req.description, req.milestone_date.isoformat(), req.category, req.icon, req.spotify_url),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM milestones WHERE id = ?", (milestone_id,)).fetchone()
    conn.close()
    m = dict(row)
    m["days_until"] = (req.milestone_date - date.today()).days
    return m


@router.put("/{milestone_id}")
async def update_milestone(milestone_id: str, req: UpdateMilestoneRequest, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT id FROM milestones WHERE id = ? AND user_id = ?", (milestone_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Milestone not found")
    updates = {}
    for k, v in req.model_dump().items():
        if v is not None:
            updates[k] = v.isoformat() if k == "milestone_date" else v
    if updates:
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        conn.execute(f"UPDATE milestones SET {set_clause} WHERE id = ?", (*updates.values(), milestone_id))
        conn.commit()
    row = conn.execute("SELECT * FROM milestones WHERE id = ?", (milestone_id,)).fetchone()
    conn.close()
    m = dict(row)
    m["days_until"] = (date.fromisoformat(row["milestone_date"]) - date.today()).days
    return m


@router.delete("/{milestone_id}")
async def delete_milestone(milestone_id: str, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    row = conn.execute(
        "SELECT id FROM milestones WHERE id = ? AND user_id = ?", (milestone_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Milestone not found")
    conn.execute("DELETE FROM milestones WHERE id = ?", (milestone_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.get("/upcoming")
async def upcoming_milestones(user: dict = Depends(get_current_user)):
    conn = _get_conn()
    today = date.today().isoformat()
    user_ids = get_accessible_user_ids(user["id"])
    placeholders = ",".join("?" * len(user_ids))
    rows = conn.execute(
        f"SELECT * FROM milestones WHERE user_id IN ({placeholders}) AND milestone_date >= ? ORDER BY milestone_date LIMIT 5",
        user_ids + [today],
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        m = dict(r)
        m["days_until"] = (date.fromisoformat(r["milestone_date"]) - date.today()).days
        result.append(m)
    return result
