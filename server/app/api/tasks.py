from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import (
    TaskCreate,
    TaskListResponse,
    TaskPriority,
    TaskResponse,
    TaskStatus,
    TaskUpdate,
)

router = APIRouter(prefix="/task", tags=["Task"])


@router.post('/create', response_model=TaskResponse)
def create_task(data: TaskCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = Task(
        user_id=user.id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        due_date=data.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get('/all', response_model=TaskListResponse)
def get_all_tasks(
    status: TaskStatus | None = Query(None),
    priority: TaskPriority | None = Query(None),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Task).filter(Task.user_id == user.id)

    if status is not None:
        query = query.filter(Task.status == status)

    if priority is not None:
        query = query.filter(Task.priority == priority)

    if search:
        query = query.filter(Task.title.ilike(f"%{search}%"))

    tasks = query.all()
    return {"total": len(tasks), "items": tasks}


@router.put('/{task_id}', response_model=TaskResponse)
def update_task(task_id: str, data: TaskUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if data.title is not None:
        task.title = data.title

    if data.description is not None:
        task.description = data.description

    if data.priority is not None:
        task.priority = data.priority

    if data.status is not None:
        task.status = data.status

    if data.due_date is not None:
        task.due_date = data.due_date

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


@router.delete('/{task_id}')
def delete_task(task_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user.id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
