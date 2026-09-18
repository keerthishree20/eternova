"""Which email route is taken, and what Brevo is sent. No real email leaves."""

import httpx

from core import email


class FakeResponse:
    def __init__(self, status_code, text=""):
        self.status_code = status_code
        self.text = text


def test_brevo_is_used_when_its_key_is_set(monkeypatch):
    sent = {}

    def fake_post(url, json, headers, timeout):
        sent.update(url=url, json=json, headers=headers)
        return FakeResponse(201)

    monkeypatch.setenv("BREVO_API_KEY", "test-key")
    monkeypatch.setenv("BREVO_SENDER", "sender@example.com")
    monkeypatch.setattr(email.httpx, "post", fake_post)
    monkeypatch.setattr(email, "_send_via_gmail", lambda *a: (_ for _ in ()).throw(AssertionError("SMTP used")))

    assert email.send_email_sync("partner@example.com", "Hi", "<p>hello</p>") is True
    assert sent["url"] == email.BREVO_URL
    assert sent["headers"]["api-key"] == "test-key"
    assert sent["json"]["sender"]["email"] == "sender@example.com"
    assert sent["json"]["to"] == [{"email": "partner@example.com"}]
    assert sent["json"]["htmlContent"] == "<p>hello</p>"


def test_brevo_falls_back_to_gmail_user_as_sender(monkeypatch):
    sent = {}
    monkeypatch.setenv("BREVO_API_KEY", "k")
    monkeypatch.delenv("BREVO_SENDER", raising=False)
    monkeypatch.setenv("GMAIL_USER", "me@gmail.com")
    monkeypatch.setattr(email.httpx, "post", lambda url, json, headers, timeout: sent.update(json) or FakeResponse(201))
    assert email.send_email_sync("x@example.com", "s", "b") is True
    assert sent["sender"]["email"] == "me@gmail.com"


def test_a_brevo_error_reports_failure(monkeypatch):
    monkeypatch.setenv("BREVO_API_KEY", "k")
    monkeypatch.setenv("BREVO_SENDER", "s@example.com")
    monkeypatch.setattr(email.httpx, "post", lambda *a, **k: FakeResponse(401, "unauthorized"))
    assert email.send_email_sync("x@example.com", "s", "b") is False


def test_a_network_error_reports_failure(monkeypatch):
    def boom(*a, **k):
        raise httpx.ConnectError("down")

    monkeypatch.setenv("BREVO_API_KEY", "k")
    monkeypatch.setenv("BREVO_SENDER", "s@example.com")
    monkeypatch.setattr(email.httpx, "post", boom)
    assert email.send_email_sync("x@example.com", "s", "b") is False


def test_gmail_is_used_without_a_brevo_key(monkeypatch):
    monkeypatch.delenv("BREVO_API_KEY", raising=False)
    monkeypatch.setattr(email, "_send_via_gmail", lambda to, subject, body: to == "x@example.com")
    monkeypatch.setattr(email.httpx, "post", lambda *a, **k: (_ for _ in ()).throw(AssertionError("Brevo used")))
    assert email.send_email_sync("x@example.com", "s", "b") is True


def test_missing_gmail_credentials_fail_without_connecting(monkeypatch):
    monkeypatch.delenv("BREVO_API_KEY", raising=False)
    monkeypatch.delenv("GMAIL_USER", raising=False)
    monkeypatch.delenv("GMAIL_APP_PASSWORD", raising=False)
    monkeypatch.setattr(email.smtplib, "SMTP_SSL", lambda *a, **k: (_ for _ in ()).throw(AssertionError("connected")))
    assert email.send_email_sync("x@example.com", "s", "b") is False
