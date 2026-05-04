from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str
    

class ChatResponse(BaseModel):
    reply: str


from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MemoryCreate(BaseModel):
    key: str
    value: str

class MemoryResponse(BaseModel):
    id: int
    key: str
    value: str
    updated_at: Optional[datetime]

    model_config = {"from_attributes": True}
