from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.database import Base


class ResidentialComplex(Base):
    __tablename__ = "residential_complexes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, nullable=False)

    memberships: Mapped[list["Membership"]] = relationship(back_populates="complex")
    categories: Mapped[list["Category"]] = relationship(back_populates="complex")
    products: Mapped[list["Product"]] = relationship(back_populates="complex")
    orders: Mapped[list["Order"]] = relationship(back_populates="complex")
