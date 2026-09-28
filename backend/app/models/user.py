from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_admin = Column(Boolean, default=False, nullable=False)
    target_role = Column(String, nullable=True, default="Java Developer")
    preferred_language = Column(String, nullable=True, default="Python")
    created_at = Column(DateTime(timezone=True), server_default=func.now())