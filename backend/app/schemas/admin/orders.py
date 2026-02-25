from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime


class OrderAggregationOut(BaseModel):
    product_id: int
    product_name: str
    total_quantity: Decimal
    unit: str
    orders_count: int


class OrderAggregationListOut(BaseModel):
    aggregations: list[OrderAggregationOut]


class OrderCommentOut(BaseModel):
    order_id: int
    user_name: str
    comment: str
    created_at: datetime


class OrderCommentsListOut(BaseModel):
    comments: list[OrderCommentOut]
