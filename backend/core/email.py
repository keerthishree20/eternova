import os
import asyncio
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import httpx

logger = logging.getLogger(__name__)

BREVO_URL = "https://api.brevo.com/v3/smtp/email"


def _send_via_brevo(api_key: str, to: str, subject: str, body_html: str) -> bool:
    """Send through Brevo's HTTPS API.

    Render's free web services block outbound SMTP ports (25, 465, 587), so
    Gmail SMTP cannot work there. An HTTPS API on port 443 is not blocked. The
    sender address must be verified as a sender in the Brevo dashboard.
    """
    sender = os.getenv("BREVO_SENDER") or os.getenv("GMAIL_USER", "")
    if not sender:
        print("[EMAIL] MISSING SENDER: set BREVO_SENDER (or GMAIL_USER) to a Brevo-verified address", flush=True)
        return False
    payload = {
        "sender": {"email": sender, "name": os.getenv("EMAIL_FROM_NAME", "Eternova")},
        "to": [{"email": to}],
        "subject": subject,
        "htmlContent": body_html,
    }
    print(f"[EMAIL] Attempting to send to {to} via Brevo", flush=True)
    try:
        resp = httpx.post(
            BREVO_URL,
            json=payload,
            headers={"api-key": api_key, "accept": "application/json"},
            timeout=15,
        )
    except httpx.HTTPError as e:
        print(f"[EMAIL] FAILED to {to} via Brevo: {e}", flush=True)
        return False
    if resp.status_code >= 300:
        print(f"[EMAIL] FAILED to {to} via Brevo: {resp.status_code} {resp.text[:300]}", flush=True)
        return False
    print(f"[EMAIL] SUCCESS: sent to {to} via Brevo", flush=True)
    return True


def _send_via_gmail(to: str, subject: str, body_html: str) -> bool:
    gmail_user = os.getenv("GMAIL_USER", "")
    gmail_password = os.getenv("GMAIL_APP_PASSWORD", "")
    if not gmail_user or not gmail_password:
        print(f"[EMAIL] MISSING CREDENTIALS: GMAIL_USER={bool(gmail_user)} GMAIL_APP_PASSWORD={bool(gmail_password)}", flush=True)
        return False
    print(f"[EMAIL] Attempting to send to {to} via Gmail SMTP", flush=True)
    msg = MIMEMultipart("alternative")
    msg["From"] = gmail_user
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body_html, "html"))
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15) as server:
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, to, msg.as_string())
        print(f"[EMAIL] SUCCESS: sent to {to}", flush=True)
        return True
    except Exception as e:
        print(f"[EMAIL] FAILED to {to}: {e}", flush=True)
        return False


def send_email_sync(to: str, subject: str, body_html: str) -> bool:
    """Brevo when BREVO_API_KEY is set (works on Render's free tier), Gmail SMTP otherwise."""
    brevo_key = os.getenv("BREVO_API_KEY", "")
    if brevo_key:
        return _send_via_brevo(brevo_key, to, subject, body_html)
    return _send_via_gmail(to, subject, body_html)


async def send_email(to: str, subject: str, body_html: str) -> bool:
    return await asyncio.to_thread(send_email_sync, to, subject, body_html)
