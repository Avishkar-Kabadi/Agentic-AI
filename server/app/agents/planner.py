# agents/email_agent.py
import google.generativeai as genai
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.user import User
from app.utils.prompt_builder import build_email_classification_prompt
from app.utils.response_parser import parse_email_classification, is_valid_task_suggestion
from app.utils.helpers import utc_now
from app.config import settings
from datetime import datetime
from typing import Optional

genai.configure(api_key=settings.GEMINI_API_KEY)  # ← lowercase
model = genai.GenerativeModel("gemini-2.5-flash")


def classify_and_create_task(subject: str, body: str, user_id: int, db: Session) -> Optional[Task]:
    prompt = build_email_classification_prompt(subject, body)
    raw = model.generate_content(prompt).text
    parsed = parse_email_classification(raw)

    if not is_valid_task_suggestion(parsed):
        return None

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
        description=f"Auto-created from email: {parsed.reason}",
        is_ai_generated=True,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


# agents/planner.py
from app.services.memory_service import format_memory_for_prompt

def build_planner_context(tasks) -> str:
    if not tasks:
        return "The user currently has no tasks."
    
    context = "Here are the user's current tasks:\n"
    for t in tasks:
        status = "Completed" if t.status == "completed" else "Pending"
        due = t.due_date.strftime("%Y-%m-%d") if t.due_date else "No due date"
        priority = t.priority.capitalize() if t.priority else "Medium"
        context += f"- [{status}] {t.title} (Priority: {priority}, Due: {due})\n"
    return context

def build_chat_prompt(message: str, context: str, memory_context: str) -> str:
    return f"""
You are the Agentic AI Productivity Assistant. Your job is to help the user manage their tasks, schedule, and productivity.

{context}

User's Memory/Preferences:
{memory_context or "No specific memory available."}

User's Message: {message}

Respond directly to the user in a helpful, concise, and professional tone. Do not use markdown code blocks unless writing code. 
"""

async def run_planner_agent(user_id: int, message: str, db: Session) -> str:
    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    memory = format_memory_for_prompt(user_id, db)

    context = build_planner_context(tasks)
    prompt  = build_chat_prompt(message, context, memory_context=memory)

    response = model.generate_content(prompt)
    return response.text