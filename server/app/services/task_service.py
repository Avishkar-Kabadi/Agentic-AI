# app/services/task_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models.task import Task, TaskStatus, TaskPriority
from app.utils.helpers import utc_now
from typing import Optional
from datetime import datetime, timedelta


def get_dashboard_stats(user_id: int, db: Session) -> dict:
    now = utc_now()
    result = db.query(
        func.count(Task.id).label("total"),
        func.sum(case((Task.status == TaskStatus.pending, 1), else_=0)).label("pending"),
        func.sum(case((Task.status == TaskStatus.completed, 1), else_=0)).label("completed"),
        func.sum(case((Task.priority == TaskPriority.high, 1), else_=0)).label("high_priority"),
        func.sum(case((
            (Task.due_date != None) &
            (Task.due_date < now) &
            (Task.status != TaskStatus.completed), 1
        ), else_=0)).label("overdue")
    ).filter(Task.user_id == user_id).one()

    all_tasks = db.query(Task).filter(Task.user_id == user_id).all()
    
    trends_dict = {}
    for i in range(6, -1, -1):
        day_date = (now - timedelta(days=i)).date()
        day_str = day_date.strftime("%a") # Mon, Tue, etc
        trends_dict[day_date] = {"name": day_str, "completed": 0, "pending": 0}
        
    for t in all_tasks:
        if t.created_at:
            t_date = t.created_at.date()
            if t_date in trends_dict:
                if t.status == TaskStatus.completed:
                    trends_dict[t_date]["completed"] += 1
                else:
                    trends_dict[t_date]["pending"] += 1
                    
    trends = list(trends_dict.values())

    return {
        "total_tasks":        result.total or 0,
        "pending_tasks":      result.pending or 0,
        "completed_tasks":    result.completed or 0,
        "high_priority_tasks": result.high_priority or 0,
        "overdue_tasks":      result.overdue or 0,
        "trends":             trends
    }


def get_user_tasks(user_id: int, db: Session,
                   status: Optional[str] = None,
                   priority: Optional[str] = None) -> list:
    query = db.query(Task).filter(Task.user_id == user_id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    return query.order_by(Task.created_at.desc()).all()


def create_task(user_id: int, data: dict, db: Session) -> Task:
    task = Task(user_id=user_id, **data)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(task: Task, data: dict, db: Session) -> Task:
    for key, value in data.items():
        if value is not None:
            setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


def delete_task(task: Task, db: Session) -> None:
    db.delete(task)
    db.commit()