from sqlalchemy import String, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from datetime import datetime
from app.database import Base


class OrderStatusEnum(str, Enum):
    draft = "draft"
    confirmed = "confirmed"
    closed = "closed"


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_user_complex", "user_id", "complex_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    complex_id: Mapped[int] = mapped_column(ForeignKey("residential_complexes.id"), nullable=False)
    status: Mapped[OrderStatusEnum] = mapped_column(SQLEnum(OrderStatusEnum), nullable=False)
    comment: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)

    user: Mapped["User"] = relationship(back_populates="orders")
    complex: Mapped["ResidentialComplex"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")
