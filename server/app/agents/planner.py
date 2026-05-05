import google.generativeai as genai
from sqlalchemy.orm import Session

from app.config import settings
from app.models.task import Task
from app.services.memory_service import format_memory_for_prompt, get_chat_history

genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")


def build_planner_context(tasks) -> str:
    if not tasks:
        return "The user currently has no tasks."

    context = "Here are the user's current tasks:\n"
    for t in tasks:
        status = "Completed" if str(t.status) == "completed" else "Pending"
        due = t.due_date.strftime("%Y-%m-%d") if t.due_date else "No due date"
        priority = str(t.priority).capitalize() if t.priority else "Medium"
        context += f"- [{status}] {t.title} (Priority: {priority}, Due: {due})\n"
    return context


def build_chat_prompt(message: str, context: str, memory_context: str, history: list[dict]) -> str:
    history_block = "\n".join([f"{h['role']}: {h['text']}" for h in history[-8:]]) if history else "No previous chat history."
    return f"""
You are the Agentic AI Productivity Assistant. Help manage tasks and productivity.

{context}

User Preferences Memory:
{memory_context or "No specific memory available."}

Recent chat history:
{history_block}

User message:
{message}

Respond helpfully and concisely.
"""


async def run_planner_agent(user_id: int, message: str, db: Session) -> str:
    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    memory = format_memory_for_prompt(user_id, db)
    history = get_chat_history(user_id, db)

    prompt = build_chat_prompt(message, build_planner_context(tasks), memory_context=memory, history=history)
    response = model.generate_content(prompt)
    return response.text
