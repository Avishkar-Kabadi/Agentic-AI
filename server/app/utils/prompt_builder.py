from datetime import datetime, timezone
from typing import Optional


def utc_now() -> datetime:
    """Single source of truth for current UTC time (replaces deprecated utcnow)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def is_overdue(due_date: Optional[datetime], status: str) -> bool:
    """Check if a task is overdue."""
    if due_date is None or status == "completed":
        return False
    return due_date < utc_now()


def days_until_due(due_date: Optional[datetime]) -> Optional[int]:
    """
    Returns how many days until due date.
    Negative = overdue by that many days.
    None = no due date set.
    """
    if due_date is None:
        return None
    delta = due_date.date() - utc_now().date()
    return delta.days


def due_today(due_date: Optional[datetime]) -> bool:
    if due_date is None:
        return False
    return due_date.date() == utc_now().date()


def due_this_week(due_date: Optional[datetime]) -> bool:
    if due_date is None:
        return False
    days = days_until_due(due_date)
    return 0 <= days <= 7


def urgency_label(due_date: Optional[datetime], status: str) -> str:
    """
    Human-readable urgency string for use in AI prompts.
    e.g. "overdue by 3 days", "due today", "due in 2 days", "no due date"
    """
    if status == "completed":
        return "completed"
    if due_date is None:
        return "no due date"
    
    days = days_until_due(due_date)
    
    if days < 0:
        return f"overdue by {abs(days)} day{'s' if abs(days) != 1 else ''}"
    elif days == 0:
        return "due today"
    elif days == 1:
        return "due tomorrow"
    else:
        return f"due in {days} days"


def format_due_date(due_date: Optional[datetime]) -> str:
    """Format due date for display. Returns 'No due date' if None."""
    if due_date is None:
        return "No due date"
    return due_date.strftime("%b %d, %Y")


# add to app/utils/prompt_builder.py

def build_email_classification_prompt(subject: str, body: str) -> str:
    """
    Prompt for email agent to decide if an email needs a task created.
    Expects strict JSON output from Gemini.
    """
    return f"""
Analyze this email and decide if it requires an action or task from the user.

Subject: {subject}
Body (first 500 chars): {body[:500]}

Respond ONLY with valid JSON. No explanation, no markdown, no code fences.

If action needed:
{{"requires_task": true, "title": "...", "priority": "high|medium|low", "due_date": "YYYY-MM-DD or null", "reason": "one line explanation"}}

If no action needed:
{{"requires_task": false}}
""".strip()