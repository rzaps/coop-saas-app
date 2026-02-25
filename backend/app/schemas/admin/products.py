from pydantic import BaseModel
from decimal import Decimal
from app.models.product import UnitEnum


class ProductCreate(BaseModel):
    name: str
    price: Decimal
    unit: UnitEnum
    note: str | None = None
    category_id: int


class ProductUpdate(BaseModel):
    name: str | None = None
    price: Decimal | None = None
    unit: UnitEnum | None = None
    note: str | None = None
    category_id: int | None = None


class ProductOut(BaseModel):
    id: int
    name: str
    price: Decimal
    unit: str
    note: str | None
    available: bool
    category_id: int
    admin_id: int
    complex_id: int

    class Config:
        from_attributes = True


class ProductsListOut(BaseModel):
    products: list[ProductOut]
