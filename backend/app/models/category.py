from sqlalchemy import String, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    complex_id: Mapped[int] = mapped_column(ForeignKey("residential_complexes.id"), nullable=False)
    admin_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    complex: Mapped["ResidentialComplex"] = relationship(back_populates="categories")
    admin: Mapped["User"] = relationship(back_populates="categories_created")
    products: Mapped[list["Product"]] = relationship(back_populates="category")
