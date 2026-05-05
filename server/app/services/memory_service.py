import json
from sqlalchemy.orm import Session
from app.models.memory import AgentMemory
from typing import Optional


def get_memory(user_id: int, db: Session) -> dict:
    memories = db.query(AgentMemory).filter(AgentMemory.user_id == user_id).all()
    return {m.key: m.value for m in memories}


def set_memory(user_id: int, key: str, value: str, db: Session) -> AgentMemory:
    existing = db.query(AgentMemory).filter(AgentMemory.user_id == user_id, AgentMemory.key == key).first()
    if existing:
        existing.value = value
        db.commit()
        db.refresh(existing)
        return existing
    memory = AgentMemory(user_id=user_id, key=key, value=value)
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return memory


def delete_memory(user_id: int, key: str, db: Session) -> bool:
    existing = db.query(AgentMemory).filter(AgentMemory.user_id == user_id, AgentMemory.key == key).first()
    if not existing:
        return False
    db.delete(existing)
    db.commit()
    return True


def format_memory_for_prompt(user_id: int, db: Session) -> Optional[str]:
    memory = get_memory(user_id, db)
    if not memory:
        return None
    lines = [f"- {k}: {v}" for k, v in memory.items() if k != "chat_history"]
    return "\n".join(lines) if lines else None


def get_chat_history(user_id: int, db: Session, limit: int = 12) -> list[dict]:
    raw = get_memory(user_id, db).get("chat_history")
    if not raw:
        return []
    try:
        arr = json.loads(raw)
        return arr[-limit:]
    except Exception:
        return []


def append_chat_history(user_id: int, db: Session, role: str, text: str, limit: int = 20):
    history = get_chat_history(user_id, db, limit=limit)
    history.append({"role": role, "text": text})
    history = history[-limit:]
    set_memory(user_id, "chat_history", json.dumps(history), db)
