from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.user import User
from app.models.order import Order, OrderStatusEnum
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.membership import Membership
from app.schemas.admin.orders import OrderAggregationOut, OrderAggregationListOut, OrderCommentOut, OrderCommentsListOut

router = APIRouter(prefix="/admin/orders", tags=["admin-orders"])


@router.get("", response_model=OrderAggregationListOut)
async def get_orders_aggregation(
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns aggregated order data for confirmed orders.
    Groups by product and shows total quantity and order count.
    """
    result = await db.execute(
        select(
            OrderItem.product_id,
            Product.name,
            func.sum(OrderItem.quantity).label("total_quantity"),
            Product.unit,
            func.count(func.distinct(OrderItem.order_id)).label("orders_count")
        )
        .join(Order, OrderItem.order_id == Order.id)
        .join(Product, OrderItem.product_id == Product.id)
        .where(
            Order.status == OrderStatusEnum.confirmed,
            Product.admin_id == current_user.id,
            Order.complex_id == membership.complex_id
        )
        .group_by(OrderItem.product_id, Product.name, Product.unit)
    )
    
    aggregations = []
    for row in result:
        aggregations.append(OrderAggregationOut(
            product_id=row.product_id,
            product_name=row.name,
            total_quantity=row.total_quantity,
            unit=row.unit.value,
            orders_count=row.orders_count
        ))

    return OrderAggregationListOut(aggregations=aggregations)


@router.get("/comments", response_model=OrderCommentsListOut)
async def get_order_comments(
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns list of comments from confirmed orders.
    """
    result = await db.execute(
        select(Order)
        .where(
            Order.status == OrderStatusEnum.confirmed,
            Order.complex_id == membership.complex_id,
            Order.comment.isnot(None)
        )
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()

    comments = []
    for order in orders:
        # Get user info
        user_result = await db.execute(
            select(User).where(User.id == order.user_id)
        )
        user = user_result.scalar_one()

        comments.append(OrderCommentOut(
            order_id=order.id,
            user_name=f"{user.first_name} {user.last_name or ''}".strip(),
            comment=order.comment,
            created_at=order.created_at
        ))

    return OrderCommentsListOut(comments=comments)
