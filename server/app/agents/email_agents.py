# agents/email_agents.py
import google.generativeai as genai
import time
from sqlalchemy.orm import Session
from app.models.task import Task
from app.utils.response_parser import parse_email_classification, is_valid_task_suggestion
from app.config import settings
from datetime import datetime
from typing import Optional

genai.configure(api_key=settings.GEMINI_API_KEY)

# Explicitly hardcode — don't rely on a variable that might be cached
model = genai.GenerativeModel("gemini-2.5-flash")


def build_email_prompt(subject: str, body: str) -> str:
    return f"""
You are a task extraction assistant. Your job is to decide if an email requires ANY action from the recipient.

Be LIBERAL in creating tasks. When in doubt, create a task.

Create a task if the email:
- Asks a question that needs a reply
- Contains a deadline or date
- Is a newsletter or article worth reading
- Mentions a proposal, project, or opportunity
- Requires any follow-up whatsoever
- Is from a real person (not automated)

Email Subject: {subject}
Email Body (preview): {body[:300]}

Respond ONLY with valid JSON, no markdown, no explanation:

If action needed:
{{"requires_task": true, "title": "short action title", "priority": "high|medium|low", "due_date": "YYYY-MM-DD or null", "reason": "why this needs action", "summary": "1-2 sentence summary of the email"}}

If truly no action needed (e.g. automated receipts, spam, pure notifications):
{{"requires_task": false, "summary": "1-2 sentence summary of the email"}}
""".strip()


def classify_and_create_task(
    subject: str,
    body: str,
    user_id: int,
    db: Session
) -> tuple[Optional[Task], Optional[str]]:
    try:
        prompt = build_email_prompt(subject, body)
        raw = model.generate_content(prompt).text

        print(f"[EMAIL AGENT] Subject: {subject}")
        print(f"[EMAIL AGENT] Gemini raw: {raw}")

        parsed = parse_email_classification(raw)
        print(f"[EMAIL AGENT] Parsed: {parsed}")

        summary = getattr(parsed, "summary", None)

        if not is_valid_task_suggestion(parsed):
            return None, summary

        due_date = None
        if parsed.due_date:
            try:
                due_date = datetime.strptime(parsed.due_date, "%Y-%m-%d")
            except ValueError:
                pass

        task = Task(
            user_id=user_id,
            title=parsed.title,
            priority=parsed.priority or "medium",
            status="pending",
            due_date=due_date,
            description=f"From email: {subject}. {parsed.reason or ''}",
            is_ai_generated=True,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task, summary

    except Exception as e:
        print(f"[EMAIL AGENT] Error: {e}")
        return None, None