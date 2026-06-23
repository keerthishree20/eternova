import uuid
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends

from api.models import RegisterRequest, LoginRequest, AuthResponse, ForgotPasswordRequest, ResetPasswordRequest
from core.auth import register_user, authenticate_user, get_current_user, _hash_password
from core.email import send_email
from state.database import _get_conn

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    try:
        result = register_user(req.email, req.name, req.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    try:
        result = authenticate_user(req.email, req.password)
        return result
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    result = {"id": user["id"], "email": user["email"], "name": user["name"],
              "partner_id": None, "partner_name": None}
    conn = _get_conn()
    u = conn.execute("SELECT partner_id FROM users WHERE id = ?", (user["id"],)).fetchone()
    if u and u["partner_id"]:
        partner = conn.execute("SELECT name FROM users WHERE id = ?", (u["partner_id"],)).fetchone()
        result["partner_id"] = u["partner_id"]
        result["partner_name"] = partner["name"] if partner else None
    conn.close()
    return result


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    conn = _get_conn()
    user = conn.execute("SELECT id, name FROM users WHERE email = ?", (req.email,)).fetchone()
    if not user:
        conn.close()
        return {"ok": True, "message": "If the email exists, a reset code has been sent"}

    code = str(secrets.randbelow(900000) + 100000)
    expires = (datetime.utcnow() + timedelta(minutes=15)).isoformat()
    conn.execute(
        "INSERT INTO password_resets (id, email, code, expires_at) VALUES (?, ?, ?, ?)",
        (str(uuid.uuid4()), req.email, code, expires),
    )
    conn.commit()
    conn.close()

    body = f"""
    <div style="font-family: Inter, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px;">
        <h2 style="color: #7c3aed;">Password Reset</h2>
        <p>Hi {user['name']},</p>
        <p>Use the code below to reset your password. It expires in 15 minutes.</p>
        <div style="background: #f3e8ff; padding: 20px; border-radius: 12px; text-align: center; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #7c3aed; margin: 20px 0;">
            {code}
        </div>
        <p style="color: #9b8ab8; font-size: 12px;">If you didn't request this, ignore this email.</p>
        <p style="color: #9b8ab8; font-size: 12px;">Eternova — Preserve Your Love Stories 💜</p>
    </div>
    """
    await send_email(req.email, "Eternova Password Reset", body)

    return {"ok": True, "message": "If the email exists, a reset code has been sent"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    conn = _get_conn()
    reset = conn.execute(
        "SELECT * FROM password_resets WHERE email = ? AND code = ? AND used = 0 ORDER BY created_at DESC LIMIT 1",
        (req.email, req.code),
    ).fetchone()

    if not reset:
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    if datetime.fromisoformat(reset["expires_at"]) < datetime.utcnow():
        conn.close()
        raise HTTPException(status_code=400, detail="Reset code has expired")

    new_hash = _hash_password(req.new_password)
    conn.execute("UPDATE users SET password_hash = ? WHERE email = ?", (new_hash, req.email))
    conn.execute("UPDATE password_resets SET used = 1 WHERE id = ?", (reset["id"],))
    conn.commit()
    conn.close()

    return {"ok": True, "message": "Password reset successfully"}
