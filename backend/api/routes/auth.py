from fastapi import APIRouter, HTTPException, Depends

from api.models import RegisterRequest, LoginRequest, AuthResponse
from core.auth import register_user, authenticate_user, get_current_user
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
