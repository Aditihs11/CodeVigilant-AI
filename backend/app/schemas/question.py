from datetime import datetime

from pydantic import BaseModel, ConfigDict


class QuestionCreate(BaseModel):
    question_text: str
    question_number: int


class QuestionResponse(BaseModel):
    id: int
    interview_id: int
    question_text: str
    question_number: int
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)