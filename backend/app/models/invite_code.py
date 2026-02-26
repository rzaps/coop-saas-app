from sqlalchemy import String, Boolean, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.database import Base


class InviteCode(Base):
    __tablename__ = "invite_codes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(8), unique=True, index=True, nullable=False)
    complex_id: Mapped[int] = mapped_column(Integer, ForeignKey("residential_complexes.id"), nullable=False)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    complex: Mapped["ResidentialComplex"] = relationship("ResidentialComplex", back_populates="invite_codes")
    creator: Mapped["User"] = relationship("User", back_populates="invite_codes")
