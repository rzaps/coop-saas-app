from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from decimal import Decimal

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.order import Order, OrderStatusEnum
from app.models.order_item import OrderItem
from app.schemas.orders import OrdersListOut, OrderOut, OrderItemOut
from app.routers.catalog import get_user_complex_id

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=OrdersListOut)
async def get_orders(
    current_user: User = Depends(get_current_user),
    complex_id: int = Depends(get_user_complex_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns history of confirmed and closed orders for current user.
    """
    result = await db.execute(
        select(Order)
        .where(
            Order.user_id == current_user.id,
            Order.complex_id == complex_id,
            Order.status.in_([OrderStatusEnum.confirmed, OrderStatusEnum.closed])
        )
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()

    orders_out = []
    for order in orders:
        # Get order items
        items_result = await db.execute(
            select(OrderItem)
            .where(OrderItem.order_id == order.id)
            .options(selectinload(OrderItem.product))
        )
        items = items_result.scalars().all()

        order_items = []
        total = Decimal("0.00")

        for item in items:
            subtotal = item.product.price * item.quantity
            total += subtotal

            order_items.append(OrderItemOut(
                id=item.id,
                product_id=item.product.id,
                product_name=item.product.name,
                price=item.product.price,
                unit=item.product.unit.value,
                quantity=item.quantity,
                subtotal=subtotal
            ))

        orders_out.append(OrderOut(
            id=order.id,
            status=order.status.value,
            comment=order.comment,
            created_at=order.created_at,
            items=order_items,
            total=total
        ))

    return OrdersListOut(orders=orders_out)
