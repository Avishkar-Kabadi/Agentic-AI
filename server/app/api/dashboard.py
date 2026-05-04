from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.user import User
from sqlalchemy import func, case
from app.services.task_service import get_dashboard_stats


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


from app.services.task_service import get_dashboard_stats

@router.get("/stats")
def stats(db: Session = Depends(get_db),
          current_user: User = Depends(get_current_user)):
    return get_dashboard_stats(current_user.id, db)