# app/services/email_sync.py
"""
Shared email sync logic used by both:
- Manual sync: POST /gmail/sync
- Background scheduler: runs every 5 minutes
"""
import asyncio
import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.email import Email
from app.services.gmail_service import fetch_recent_emails
from app.agents.email_agents import classify_and_create_task
from app.api.ws import manager

logger = logging.getLogger(__name__)


async def process_user_emails(user: User, db: Session) -> dict:
    """
    Fetches unread emails for a user, classifies them with Gemini,
    creates tasks, saves summaries, and broadcasts WebSocket events.

    Returns a summary dict with counts.
    """
    try:
        emails = fetch_recent_emails(user, db, max_results=5)
    except Exception as e:
        logger.error(f"[SYNC] Could not fetch emails for user_id={user.id}: {e}")
        return {"emails_scanned": 0, "emails_skipped": 0, "tasks_created": 0, "tasks": []}

    created_tasks = []
    skipped = 0

    for em in emails:
        # Skip already-processed emails
        existing = db.query(Email).filter(
            Email.gmail_message_id == em["message_id"],
            Email.user_id == user.id
        ).first()

        if existing:
            skipped += 1
            logger.debug(f"[SYNC] Skipping already processed: {em['subject']}")
            continue

        # Save email record first to prevent reprocessing on failure
        email_record = Email(
            user_id=user.id,
            gmail_message_id=em["message_id"],
            sender=em["sender"],
            subject=em["subject"],
            body=em["body"][:500],
        )
        db.add(email_record)
        db.commit()

        await manager.broadcast_to_user(
            str(user.id),
            {"type": "NEW_EMAIL", "subject": em["subject"], "sender": em["sender"], "message_id": em["message_id"]}
        )

        # Call Gemini to classify and create task
        try:
            task, summary = classify_and_create_task(
                subject=em["subject"],
                body=em["body"],
                user_id=user.id,
                db=db
            )

            if summary:
                email_record.summary = summary
                db.add(email_record)
                db.commit()

            if task:
                created_tasks.append({
                    "task_id":    task.id,
                    "title":      task.title,
                    "from_email": em["subject"]
                })
                logger.info(f"[SYNC] Created task '{task.title}' for user_id={user.id}")

                # Push live update to any connected WebSocket clients
                await manager.broadcast_to_user(
                    str(user.id),
                    {"type": "NEW_TASK", "task_id": task.id, "title": task.title}
                )

        except Exception as e:
            logger.error(f"[SYNC] Gemini error on '{em['subject']}': {e}")
            continue

        # Rate limit between Gemini calls to avoid quota errors
        await asyncio.sleep(13)

    return {
        "emails_scanned": len(emails),
        "emails_skipped":  skipped,
        "tasks_created":  len(created_tasks),
        "tasks":          created_tasks
    }
