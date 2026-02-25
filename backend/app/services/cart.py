from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from decimal import Decimal

from app.models.order import Order, OrderStatusEnum
from app.models.order_item import OrderItem
from app.models.product import Product


async def get_or_create_draft_order(user_id: int, complex_id: int, db: AsyncSession) -> Order:
    """
    Returns existing draft order or creates a new one.
    Ensures user has only one active draft.
    """
    result = await db.execute(
        select(Order).where(
            Order.user_id == user_id,
            Order.complex_id == complex_id,
            Order.status == OrderStatusEnum.draft
        )
    )
    draft_order = result.scalar_one_or_none()

    if draft_order:
        return draft_order

    # Create new draft order
    new_order = Order(
        user_id=user_id,
        complex_id=complex_id,
        status=OrderStatusEnum.draft
    )
    db.add(new_order)
    await db.commit()
    await db.refresh(new_order)

    return new_order


async def validate_product_available(product_id: int, db: AsyncSession) -> Product:
    """
    Validates that product exists and is available.
    """
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    if not product.available:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product is not available"
        )

    return product


async def add_or_update_cart_item(
    order_id: int,
    product_id: int,
    quantity: Decimal,
    db: AsyncSession
) -> OrderItem:
    """
    Adds new item to cart or updates quantity if item already exists.
    """
    # Check if item already exists in cart
    result = await db.execute(
        select(OrderItem).where(
            OrderItem.order_id == order_id,
            OrderItem.product_id == product_id
        )
    )
    existing_item = result.scalar_one_or_none()

    if existing_item:
        # Add quantity to existing
        existing_item.quantity += quantity
        await db.commit()
        await db.refresh(existing_item)
        return existing_item

    # Create new item
    new_item = OrderItem(
        order_id=order_id,
        product_id=product_id,
        quantity=quantity
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)

    return new_item


async def validate_cart_not_empty(order_id: int, db: AsyncSession):
    """
    Validates that cart has at least one item.
    """
    result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    items = result.scalars().all()

    if len(items) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot confirm empty cart"
        )
