from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EmailResponse(BaseModel):
    id: int
    gmail_message_id: Optional[str]
    sender: Optional[str]
    subject: Optional[str]
    summary: Optional[str]
    priority: str
    is_read: bool
    is_replied: bool
    received_at: Optional[datetime]

    model_config = {"from_attributes": True}

