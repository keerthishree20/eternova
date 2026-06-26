import os
import asyncio
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def send_email_sync(to: str, subject: str, body_html: str) -> bool:
    gmail_user = os.getenv("GMAIL_USER", "")
    gmail_password = os.getenv("GMAIL_APP_PASSWORD", "")
    if not gmail_user or not gmail_password:
        logger.warning("Email not sent: GMAIL_USER or GMAIL_APP_PASSWORD not configured")
        return False
    msg = MIMEMultipart("alternative")
    msg["From"] = gmail_user
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body_html, "html"))
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, to, msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Email failed to {to}: {e}")
        return False


async def send_email(to: str, subject: str, body_html: str) -> bool:
    return await asyncio.to_thread(send_email_sync, to, subject, body_html)
