from pydantic import BaseModel
from decimal import Decimal


class ProductOut(BaseModel):
    id: int
    name: str
    price: Decimal
    unit: str
    note: str | None
    available: bool

    class Config:
        from_attributes = True


class CategoryOut(BaseModel):
    id: int
    name: str
    products: list[ProductOut]

    class Config:
        from_attributes = True


class CatalogOut(BaseModel):
    categories: list[CategoryOut]
