from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date


# ── Auth ─────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str

class AuthResponse(BaseModel):
    user_id: str
    email: str
    name: str
    token: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str


# ── Memory Books ─────────────────────────────────────────────────────────────

class CreateBookRequest(BaseModel):
    title: str
    person_name: str
    description: str = ""
    cover_color: str = "#7c3aed"
    spotify_url: Optional[str] = None

class UpdateBookRequest(BaseModel):
    title: Optional[str] = None
    person_name: Optional[str] = None
    description: Optional[str] = None
    cover_color: Optional[str] = None
    spotify_url: Optional[str] = None

class CreateEntryRequest(BaseModel):
    title: str
    content: str
    entry_date: Optional[date] = None
    sort_order: int = 0
    mood: Optional[str] = None

class UpdateEntryRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    entry_date: Optional[date] = None
    sort_order: Optional[int] = None
    mood: Optional[str] = None


# ── Time Capsules ────────────────────────────────────────────────────────────

class CreateCapsuleRequest(BaseModel):
    title: str
    message: str
    unlock_date: date

class CapsuleResponse(BaseModel):
    id: str
    title: str
    unlock_date: str
    is_locked: bool
    created_at: str
    message: Optional[str] = None
    photos: Optional[list] = None


# ── Milestones ───────────────────────────────────────────────────────────────

class CreateMilestoneRequest(BaseModel):
    title: str
    description: str = ""
    milestone_date: date
    category: str = "other"
    icon: str = "heart"
    spotify_url: Optional[str] = None

class UpdateMilestoneRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    milestone_date: Optional[date] = None
    category: Optional[str] = None
    icon: Optional[str] = None
    spotify_url: Optional[str] = None


# ── Letters ──────────────────────────────────────────────────────────────────

class SaveDraftRequest(BaseModel):
    template_id: str
    filled_fields: dict

class UpdateDraftRequest(BaseModel):
    filled_fields: dict


# ── Mini-Sites ───────────────────────────────────────────────────────────────

class CreateSiteRequest(BaseModel):
    slug: str
    title: str
    subtitle: str = ""
    partner_name: str = ""
    theme_color: str = "#7c3aed"
    accent_color: str = "#ec4899"
    background_style: str = "gradient"
    theme: str = "romantic"
    book_id: Optional[str] = None
    book_ids: List[str] = []
    entry_ids: List[str] = []
    milestone_ids: List[str] = []
    show_milestones: bool = True
    show_photos: bool = True
    guest_pin: Optional[str] = None

class UpdateSiteRequest(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    partner_name: Optional[str] = None
    theme_color: Optional[str] = None
    accent_color: Optional[str] = None
    background_style: Optional[str] = None
    theme: Optional[str] = None
    book_id: Optional[str] = None
    book_ids: Optional[List[str]] = None
    entry_ids: Optional[List[str]] = None
    milestone_ids: Optional[List[str]] = None
    show_milestones: Optional[bool] = None
    show_photos: Optional[bool] = None
    guest_pin: Optional[str] = None


# ── Guestbook ───────────────────────────────────────────────────────────────

class GuestbookEntryRequest(BaseModel):
    author_name: str
    message: str
    pin: str


# ── Scheduled Letters ────────────────────────────────────────────────────────

class CreateScheduledLetterRequest(BaseModel):
    recipient_email: EmailStr
    recipient_name: str = ""
    subject: str
    body: str
    scheduled_date: date


# ── Couple Mode ──────────────────────────────────────────────────────────────

class CreateInviteRequest(BaseModel):
    invite_email: Optional[EmailStr] = None

class AcceptInviteRequest(BaseModel):
    code: str
