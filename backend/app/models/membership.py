from sqlalchemy import ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from app.database import Base


class RoleEnum(str, Enum):
    super_admin = "super_admin"
    admin = "admin"
    user = "user"


class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (
        UniqueConstraint("user_id", "complex_id", name="uq_user_complex"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    complex_id: Mapped[int] = mapped_column(ForeignKey("residential_complexes.id"), nullable=False)
    role: Mapped[RoleEnum] = mapped_column(SQLEnum(RoleEnum), nullable=False)

    user: Mapped["User"] = relationship(back_populates="memberships")
    complex: Mapped["ResidentialComplex"] = relationship(back_populates="memberships")
