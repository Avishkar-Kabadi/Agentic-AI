# api/agent.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.agent import ChatRequest, ChatResponse
from app.models.user import User
from app.agents.planner import run_planner_agent

router = APIRouter(prefix="/agent", tags=["Agent"])




@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reply = await run_planner_agent(
        user_id=current_user.id,
        message=req.message,
        db=db
    )
    return {"reply": reply}