import json
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, field_validator


class AnswerBase(BaseModel):
    question_id: int
    answer_text: str


class AnswerCreate(AnswerBase):
    pass


class AnswerResponse(BaseModel):
    id: int
    interview_id: int
    question_id: int
    answer_text: str
    score: Optional[int] = None
    feedback: Optional[str] = None
    strengths: List[str] = []
    improvements: List[str] = []
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("strengths", "improvements", mode="before")
    @classmethod
    def parse_string_list(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            v_str = v.strip()
            if not v_str:
                return []
            try:
                parsed = json.loads(v_str)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                pass
            if v_str.startswith("{") and v_str.endswith("}"):
                inner = v_str[1:-1]
                # Split postgres text array
                items = [s.strip(' "\'') for s in inner.split('","') if s.strip()]
                return items
            return [v_str]
        return []