import os
import hashlib
import hmac
import time
import json
import base64
import uuid
from typing import Optional

import httpx
from fastapi import Header, HTTPException

from state.database import create_user, get_user_by_email, get_user_by_id, get_user_by_google_id, create_google_user, link_google_to_user

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

JWT_SECRET = os.getenv("JWT_SECRET", "eternova-dev-secret-change-in-prod")


def _hash_password(password: str) -> str:
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return (salt + key).hex()


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        raw = bytes.fromhex(stored_hash)
    except ValueError:
        return False
    salt, key = raw[:32], raw[32:]
    new_key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100_000)
    return hmac.compare_digest(key, new_key)


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    return base64.urlsafe_b64decode(s + "=" * padding)


def create_token(user_id: str, email: str, name: str) -> str:
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url_encode(json.dumps({
        "user_id": user_id,
        "email": email,
        "name": name,
        "exp": int(time.time()) + 86400,
    }).encode())
    signature = _b64url_encode(
        hmac.new(JWT_SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
    )
    return f"{header}.{payload}.{signature}"


def verify_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, payload, signature = parts
        expected_sig = _b64url_encode(
            hmac.new(JWT_SECRET.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(signature, expected_sig):
            return None
        data = json.loads(_b64url_decode(payload))
        if data.get("exp", 0) < time.time():
            return None
        return data
    except Exception:
        return None


def register_user(email: str, name: str, password: str) -> dict:
    user_id = str(uuid.uuid4())
    password_hash = _hash_password(password)
    if not create_user(user_id, email, name, password_hash):
        raise ValueError("Email already registered")
    token = create_token(user_id, email, name)
    return {"user_id": user_id, "email": email, "name": name, "token": token}


def authenticate_user(email: str, password: str) -> dict:
    user = get_user_by_email(email)
    if not user or not _verify_password(password, user["password_hash"]):
        raise ValueError("Invalid email or password")
    token = create_token(user["id"], user["email"], user["name"])
    return {"user_id": user["id"], "email": user["email"], "name": user["name"], "token": token}


async def google_authenticate(credential: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={credential}"
        )
    if resp.status_code != 200:
        raise ValueError("Invalid Google token")
    payload = resp.json()
    if payload.get("aud") != GOOGLE_CLIENT_ID:
        raise ValueError("Token not intended for this app")
    if not payload.get("email_verified", False):
        raise ValueError("Google email not verified")
    google_id = payload["sub"]
    email = payload["email"]
    name = payload.get("name", email.split("@")[0])

    user = get_user_by_google_id(google_id)
    if user:
        token = create_token(user["id"], user["email"], user["name"])
        return {"user_id": user["id"], "email": user["email"], "name": user["name"], "token": token}

    existing = get_user_by_email(email)
    if existing:
        link_google_to_user(existing["id"], google_id)
        token = create_token(existing["id"], existing["email"], existing["name"])
        return {"user_id": existing["id"], "email": existing["email"], "name": existing["name"], "token": token}

    user_id = str(uuid.uuid4())
    if not create_google_user(user_id, email, name, google_id):
        raise ValueError("Could not create account")
    token = create_token(user_id, email, name)
    return {"user_id": user_id, "email": email, "name": name, "token": token}


def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    data = verify_token(token)
    if not data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"id": data["user_id"], "email": data["email"], "name": data["name"]}
