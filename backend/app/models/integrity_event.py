from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func

from app.db.database import Base


class AssessmentIntegrityEvent(Base):
    __tablename__ = "assessment_integrity_events"

    id = Column(Integer, primary_key=True, index=True)

    interview_id = Column(
        Integer,
        ForeignKey("interviews.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    event_type = Column(
        String,
        nullable=False, # "tab_switch", "window_blur", "fullscreen_exit", "copy_attempt"
    )

    details = Column(
        Text,
        nullable=True,
    )

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
