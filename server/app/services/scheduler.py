# app/services/scheduler.py
import asyncio
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.database import SessionLocal
from app.models.user import User
from app.services.email_sync import process_user_emails

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def background_gmail_sync():
    """
    Background job that runs every 5 minutes.
    Finds all Gmail-connected users and syncs their unread emails.
    """
    logger.info("[SCHEDULER] Running background Gmail sync...")
    db = SessionLocal()
    try:
        connected_users = db.query(User).filter(User.gmail_connected == True).all()
        logger.info(f"[SCHEDULER] Found {len(connected_users)} connected user(s).")

        for user in connected_users:
            try:
                logger.info(f"[SCHEDULER] Syncing emails for user_id={user.id}")
                await process_user_emails(user, db)
            except Exception as e:
                logger.error(f"[SCHEDULER] Failed for user_id={user.id}: {e}")
    finally:
        db.close()


def start_scheduler():
    scheduler.add_job(
        background_gmail_sync,
        trigger="interval",
        minutes=5,
        id="gmail_sync",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("[SCHEDULER] Background Gmail sync scheduler started (every 5 minutes).")


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("[SCHEDULER] Scheduler stopped.")
