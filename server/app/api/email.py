# app/api/email.py
import base64
import hashlib
import secrets
import requests
import redis
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.config import settings
from app.core.database import get_db
from app.models.user import User
from app.services.email_sync import process_user_emails

router = APIRouter(prefix="/gmail", tags=["Gmail"])

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

_pkce_store: dict[str, str] = {}

try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    redis_client = None


def _pkce_key(user_id: str) -> str:
    return f"gmail:pkce:{user_id}"


def _save_code_verifier(user_id: str, verifier: str):
    if redis_client is not None:
        try:
            redis_client.setex(_pkce_key(user_id), 600, verifier)
            return
        except Exception:
            pass
    _pkce_store[user_id] = verifier


def _pop_code_verifier(user_id: str) -> str | None:
    if redis_client is not None:
        try:
            key = _pkce_key(user_id)
            verifier = redis_client.get(key)
            if verifier:
                redis_client.delete(key)
                return verifier
        except Exception:
            pass
    return _pkce_store.pop(user_id, None)


def _generate_pkce() -> tuple[str, str]:
    code_verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return code_verifier, code_challenge


@router.get("/connect")
def connect_gmail(current_user: User = Depends(get_current_user)):
    code_verifier, code_challenge = _generate_pkce()
    _save_code_verifier(str(current_user.id), code_verifier)

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": str(current_user.id),
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    from urllib.parse import urlencode

    auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return {"auth_url": auth_url}


@router.get("/callback")
def gmail_callback(code: str, state: str, db: Session = Depends(get_db)):
    code_verifier = _pop_code_verifier(state)
    if not code_verifier:
        raise HTTPException(status_code=400, detail="PKCE verifier not found or expired")

    payload = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
        "code_verifier": code_verifier,
    }

    token_response = requests.post("https://oauth2.googleapis.com/token", data=payload)
    token_data = token_response.json()

    if "error" in token_data:
        raise HTTPException(
            status_code=400,
            detail=f"Token exchange failed: {token_data.get('error_description', token_data['error'])}",
        )

    user_id = int(state)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from datetime import datetime, timedelta

    user.gmail_access_token = token_data.get("access_token")
    user.gmail_refresh_token = token_data.get("refresh_token")
    user.gmail_connected = True
    if "expires_in" in token_data:
        user.gmail_token_expiry = datetime.utcnow() + timedelta(seconds=token_data["expires_in"])
    db.commit()

    return RedirectResponse(url="http://localhost:5173/settings")


@router.post("/sync")
async def sync_gmail(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.gmail_connected:
        raise HTTPException(status_code=400, detail="Gmail not connected")

    result = await process_user_emails(current_user, db)
    return result


@router.get("/status")
def gmail_status(current_user: User = Depends(get_current_user)):
    return {"connected": current_user.gmail_connected}


@router.delete("/disconnect")
def disconnect_gmail(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.gmail_access_token = None
    current_user.gmail_refresh_token = None
    current_user.gmail_token_expiry = None
    current_user.gmail_connected = False
    db.commit()
    return {"message": "Gmail disconnected"}
