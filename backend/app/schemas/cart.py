from pydantic import BaseModel
from decimal import Decimal


class CartItemCreate(BaseModel):
    product_id: int
    quantity: Decimal


class CartItemUpdate(BaseModel):
    quantity: Decimal


class CartCommentUpdate(BaseModel):
    comment: str


class CartItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: Decimal
    unit: str
    quantity: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class CartOut(BaseModel):
    id: int
    status: str
    comment: str | None
    items: list[CartItemOut]
    total: Decimal

    class Config:
        from_attributes = True
