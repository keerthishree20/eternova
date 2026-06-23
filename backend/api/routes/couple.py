import uuid
import secrets

from fastapi import APIRouter, HTTPException, Depends

from api.models import CreateInviteRequest, AcceptInviteRequest
from core.auth import get_current_user
from core.email import send_email
from state.database import _get_conn

router = APIRouter(prefix="/couple", tags=["couple"])


@router.get("/status")
async def couple_status(user: dict = Depends(get_current_user)):
    conn = _get_conn()
    u = conn.execute("SELECT partner_id FROM users WHERE id = ?", (user["id"],)).fetchone()
    if u and u["partner_id"]:
        partner = conn.execute(
            "SELECT id, email, name FROM users WHERE id = ?", (u["partner_id"],)
        ).fetchone()
        conn.close()
        return {"linked": True, "partner": dict(partner) if partner else None, "pending_invite": None}
    invite = conn.execute(
        "SELECT * FROM couple_invites WHERE from_user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
        (user["id"],),
    ).fetchone()
    conn.close()
    return {
        "linked": False,
        "partner": None,
        "pending_invite": dict(invite) if invite else None,
    }


@router.post("/invite")
async def create_invite(req: CreateInviteRequest = None, user: dict = Depends(get_current_user)):
    if req is None:
        req = CreateInviteRequest()
    conn = _get_conn()
    u = conn.execute("SELECT partner_id FROM users WHERE id = ?", (user["id"],)).fetchone()
    if u and u["partner_id"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Already linked to a partner")
    conn.execute(
        "UPDATE couple_invites SET status = 'expired' WHERE from_user_id = ? AND status = 'pending'",
        (user["id"],),
    )
    invite_id = str(uuid.uuid4())
    code = secrets.token_urlsafe(8)
    conn.execute(
        "INSERT INTO couple_invites (id, from_user_id, invite_code, invite_email, status) VALUES (?, ?, ?, ?, 'pending')",
        (invite_id, user["id"], code, req.invite_email),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM couple_invites WHERE id = ?", (invite_id,)).fetchone()
    conn.close()

    if req.invite_email:
        body = f"""
        <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px;">
            <h2 style="color: #7c3aed;">You've been invited to Eternova 💜</h2>
            <p>{user['name']} wants to link accounts with you on Eternova.</p>
            <p>Use this invite code to connect:</p>
            <div style="background: #f3e8ff; padding: 15px; border-radius: 12px; text-align: center; font-size: 24px; letter-spacing: 4px; font-weight: bold; color: #7c3aed;">
                {code}
            </div>
            <p style="color: #9b8ab8; font-size: 12px; margin-top: 20px;">Eternova — Preserve Your Love Stories</p>
        </div>
        """
        await send_email(req.invite_email, f"{user['name']} invited you to Eternova", body)

    return dict(row)


@router.post("/accept")
async def accept_invite(req: AcceptInviteRequest, user: dict = Depends(get_current_user)):
    conn = _get_conn()
    u = conn.execute("SELECT partner_id FROM users WHERE id = ?", (user["id"],)).fetchone()
    if u and u["partner_id"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Already linked to a partner")
    invite = conn.execute(
        "SELECT * FROM couple_invites WHERE invite_code = ? AND status = 'pending'", (req.code,)
    ).fetchone()
    if not invite:
        conn.close()
        raise HTTPException(status_code=404, detail="Invalid or expired invite code")
    if invite["from_user_id"] == user["id"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Cannot accept your own invite")
    conn.execute("UPDATE users SET partner_id = ? WHERE id = ?", (invite["from_user_id"], user["id"]))
    conn.execute("UPDATE users SET partner_id = ? WHERE id = ?", (user["id"], invite["from_user_id"]))
    conn.execute("UPDATE couple_invites SET status = 'accepted' WHERE id = ?", (invite["id"],))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.post("/unlink")
async def unlink_partner(user: dict = Depends(get_current_user)):
    conn = _get_conn()
    u = conn.execute("SELECT partner_id FROM users WHERE id = ?", (user["id"],)).fetchone()
    if not u or not u["partner_id"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Not linked to a partner")
    conn.execute("UPDATE users SET partner_id = NULL WHERE id = ?", (user["id"],))
    conn.execute("UPDATE users SET partner_id = NULL WHERE id = ?", (u["partner_id"],))
    conn.commit()
    conn.close()
    return {"ok": True}
