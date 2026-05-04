from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.helpers import utc_now
from app.config import settings
import base64
import email as email_lib
from typing import Optional


SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]


def get_gmail_credentials(user: User) -> Optional[Credentials]:
    """Build credentials from stored tokens. Refreshes if expired."""
    if not user.gmail_refresh_token:
        return None

    creds = Credentials(
        token=user.gmail_access_token,
        refresh_token=user.gmail_refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        scopes=SCOPES,
    )

    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        return creds, True  # True = tokens were refreshed, save them

    return creds, False


def save_refreshed_tokens(user: User, creds: Credentials, db: Session):
    """Persist refreshed tokens back to DB."""
    user.gmail_access_token = creds.token
    user.gmail_token_expiry = creds.expiry
    db.commit()


def fetch_recent_emails(user: User, db: Session, max_results: int = 10) -> list[dict]:
    """
    Fetches recent emails from Gmail.
    Returns list of {subject, sender, body, message_id}
    """
    result = get_gmail_credentials(user)
    if result is None:
        raise ValueError("Gmail not connected for this user")

    creds, was_refreshed = result
    if was_refreshed:
        save_refreshed_tokens(user, creds, db)

    service = build("gmail", "v1", credentials=creds)

    # Fetch message IDs
    messages_response = service.users().messages().list(
        userId="me",
        maxResults=max_results,
        labelIds=["INBOX"],
        q="is:unread"  # only unread for now
    ).execute()

    messages = messages_response.get("messages", [])
    emails = []

    for msg in messages:
        msg_data = service.users().messages().get(
            userId="me",
            id=msg["id"],
            format="full"
        ).execute()

        headers = {h["name"]: h["value"] for h in msg_data["payload"]["headers"]}
        subject = headers.get("Subject", "(no subject)")
        sender  = headers.get("From", "unknown")
        body    = _extract_body(msg_data["payload"])

        emails.append({
            "message_id": msg["id"],
            "subject":    subject,
            "sender":     sender,
            "body":       body,
        })

    return emails


def _extract_body(payload: dict) -> str:
    """Recursively extract plain text body from Gmail payload."""
    if payload.get("mimeType") == "text/plain":
        data = payload.get("body", {}).get("data", "")
        return base64.urlsafe_b64decode(data + "==").decode("utf-8", errors="ignore")

    # Multipart — recurse into parts
    for part in payload.get("parts", []):
        text = _extract_body(part)
        if text:
            return text

    return ""