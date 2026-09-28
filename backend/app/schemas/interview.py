from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class InterviewCreate(BaseModel):
    role: str


class InterviewResponse(BaseModel):
    id: int
    user_id: int
    role: str
    status: str
    score: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)