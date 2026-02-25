from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    product_name: str
    price: Decimal
    unit: str
    quantity: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    status: str
    comment: str | None
    created_at: datetime
    items: list[OrderItemOut]
    total: Decimal

    class Config:
        from_attributes = True


class OrdersListOut(BaseModel):
    orders: list[OrderOut]
