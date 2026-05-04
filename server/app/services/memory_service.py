from sqlalchemy.orm import Session
from sqlalchemy.dialects.sqlite import insert
from app.models.memory import AgentMemory
from typing import Optional


def get_memory(user_id: int, db: Session) -> dict:
    """Returns all memory as a flat key-value dict."""
    memories = db.query(AgentMemory).filter(
        AgentMemory.user_id == user_id
    ).all()
    return {m.key: m.value for m in memories}


def set_memory(user_id: int, key: str, value: str, db: Session) -> AgentMemory:
    """Upsert — update if exists, insert if not."""
    existing = db.query(AgentMemory).filter(
        AgentMemory.user_id == user_id,
        AgentMemory.key == key
    ).first()

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
    existing = db.query(AgentMemory).filter(
        AgentMemory.user_id == user_id,
        AgentMemory.key == key
    ).first()
    if not existing:
        return False
    db.delete(existing)
    db.commit()
    return True


def format_memory_for_prompt(user_id: int, db: Session) -> Optional[str]:
    """Formats memory into a string block for Gemini prompt injection."""
    memory = get_memory(user_id, db)
    if not memory:
        return None
    lines = [f"- {k}: {v}" for k, v in memory.items()]
    return "\n".join(lines)


