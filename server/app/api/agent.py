import re

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.agents.planner import run_planner_agent
from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.agent import ChatRequest, ChatResponse

router = APIRouter(prefix="/agent", tags=["Agent"])


def _try_create_task_from_message(message: str, user_id: int, db: Session) -> bool:
    text = message.strip()
    match = re.match(r"^(?:add|create)\s+task\s*:\s*(.+)$", text, re.IGNORECASE)
    if not match:
        return False

    title = match.group(1).strip()
    if not title:
        return False

    task = Task(user_id=user_id, title=title, description="Created from AI chat command", is_ai_generated=True)
    db.add(task)
    db.commit()
    return True


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task_created = _try_create_task_from_message(req.message, current_user.id, db)
    reply = await run_planner_agent(
        user_id=current_user.id,
        message=req.message,
        db=db,
    )
    if task_created:
        reply = f"✅ I created a task from your message.\n\n{reply}"
    return {"reply": reply, "task_created": task_created}
