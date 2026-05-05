from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    task_created: bool = False
    history: list[dict] = []


class MemoryCreate(BaseModel):
    key: str
    value: str


class MemoryResponse(BaseModel):
    id: int
    key: str
    value: str

    model_config = {"from_attributes": True}
