import os
import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI

logging.basicConfig(level=logging.INFO)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from api.routes import auth, books, capsules, milestones, letters, sites, public, dashboard
from api.routes import scheduled_letters, couple
from core.email import send_email
from state.database import _get_conn


async def check_and_send_letters():
    while True:
        try:
            conn = _get_conn()
            due = conn.execute(
                "SELECT * FROM scheduled_letters WHERE scheduled_date <= date('now') AND is_sent = 0"
            ).fetchall()
            for letter in due:
                body_html = f"""
                <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 30px;">
                    <h2 style="color: #7c3aed;">{letter['subject']}</h2>
                    {f'<p style="color: #888;">Dear {letter["recipient_name"]},</p>' if letter['recipient_name'] else ''}
                    <div style="white-space: pre-wrap; line-height: 1.8; color: #333;">{letter['body']}</div>
                    <hr style="border: none; border-top: 1px solid #f3e8ff; margin: 20px 0;" />
                    <p style="color: #9b8ab8; font-size: 12px;">Sent with love via Eternova 💜</p>
                </div>
                """
                success = await send_email(letter["recipient_email"], letter["subject"], body_html)
                if success:
                    conn.execute(
                        "UPDATE scheduled_letters SET is_sent = 1, sent_at = datetime('now') WHERE id = ?",
                        (letter["id"],),
                    )
                    conn.commit()
            conn.close()
        except Exception:
            pass
        await asyncio.sleep(300)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(check_and_send_letters())
    yield
    task.cancel()


app = FastAPI(title="Eternova API", version="1.0.0", lifespan=lifespan)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(books.router, prefix="/api")
app.include_router(capsules.router, prefix="/api")
app.include_router(milestones.router, prefix="/api")
app.include_router(letters.router, prefix="/api")
app.include_router(sites.router, prefix="/api")
app.include_router(public.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(scheduled_letters.router, prefix="/api")
app.include_router(couple.router, prefix="/api")

uploads_dir = Path(__file__).parent / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok"}
