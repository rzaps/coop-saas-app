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


@router.get("/details")
async def get_orders_details(
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns detailed list of confirmed and closed orders with items.
    Only shows orders that contain products from current admin.
    """
    # Get all confirmed and closed orders for this complex
    result = await db.execute(
        select(Order)
        .where(
            Order.complex_id == membership.complex_id,
            Order.status.in_([OrderStatusEnum.confirmed, OrderStatusEnum.closed])
        )
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()

    detailed_orders = []
    for order in orders:
        # Get order items
        items_result = await db.execute(
            select(OrderItem, Product)
            .join(Product, OrderItem.product_id == Product.id)
            .where(
                OrderItem.order_id == order.id,
                Product.admin_id == current_user.id
            )
        )
        items_data = items_result.all()

        # Skip orders without admin's products
        if not items_data:
            continue

        # Get user info
        user_result = await db.execute(
            select(User).where(User.id == order.user_id)
        )
        user = user_result.scalar_one()

        # Build items list
        items = []
        total = 0
        for order_item, product in items_data:
            subtotal = float(order_item.quantity) * float(product.price)
            total += subtotal
            items.append({
                "product_name": product.name,
                "quantity": float(order_item.quantity),
                "unit": product.unit.value,
                "price": str(product.price),
                "subtotal": subtotal
            })

        detailed_orders.append({
            "order_id": order.id,
            "user_first_name": user.first_name,
            "user_last_name": user.last_name or "",
            "status": order.status.value,
            "created_at": order.created_at.isoformat(),
            "comment": order.comment,
            "items": items,
            "total": total
        })

    return {"orders": detailed_orders}


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: int,
    status_data: dict,
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update order status. Admin can only update orders containing their products.
    """
    # Get order
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.complex_id == membership.complex_id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if order contains admin's products
    items_result = await db.execute(
        select(OrderItem, Product)
        .join(Product, OrderItem.product_id == Product.id)
        .where(
            OrderItem.order_id == order_id,
            Product.admin_id == current_user.id
        )
    )
    items_data = items_result.all()

    if not items_data:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="You can only update orders with your products")

    # Update status
    new_status = status_data.get("status")
    if new_status not in ["confirmed", "closed"]:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid status")

    order.status = OrderStatusEnum(new_status)
    await db.commit()

    return {"message": "Order status updated", "order_id": order_id, "status": new_status}
