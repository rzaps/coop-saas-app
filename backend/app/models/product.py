from sqlalchemy import String, ForeignKey, Boolean, Numeric, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from decimal import Decimal
from app.database import Base


class UnitEnum(str, Enum):
    kg = "кг"
    pcs = "шт."


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[UnitEnum] = mapped_column(SQLEnum(UnitEnum), nullable=False)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    admin_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    complex_id: Mapped[int] = mapped_column(ForeignKey("residential_complexes.id"), nullable=False)

    category: Mapped["Category"] = relationship(back_populates="products")
    admin: Mapped["User"] = relationship(back_populates="products_created")
    complex: Mapped["ResidentialComplex"] = relationship(back_populates="products")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")
