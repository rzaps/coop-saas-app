from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from decimal import Decimal

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.order import Order, OrderStatusEnum
from app.models.order_item import OrderItem
from app.models.product import Product
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartCommentUpdate, CartOut, CartItemOut
from app.services.cart import (
    get_or_create_draft_order,
    validate_product_available,
    add_or_update_cart_item,
    validate_cart_not_empty
)
from app.routers.catalog import get_user_complex_id

router = APIRouter(prefix="/cart", tags=["cart"])


async def build_cart_response(order: Order, db: AsyncSession) -> CartOut:
    """
    Builds CartOut response with items and total calculation.
    """
    result = await db.execute(
        select(OrderItem)
        .where(OrderItem.order_id == order.id)
        .options(selectinload(OrderItem.product))
    )
    items = result.scalars().all()

    cart_items = []
    total = Decimal("0.00")

    for item in items:
        subtotal = item.product.price * item.quantity
        total += subtotal

        cart_items.append(CartItemOut(
            id=item.id,
            product_id=item.product.id,
            product_name=item.product.name,
            price=item.product.price,
            unit=item.product.unit.value,
            quantity=item.quantity,
            subtotal=subtotal
        ))

    return CartOut(
        id=order.id,
        status=order.status.value,
        comment=order.comment,
        items=cart_items,
        total=total
    )


@router.get("", response_model=CartOut)
async def get_cart(
    current_user: User = Depends(get_current_user),
    complex_id: int = Depends(get_user_complex_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns current draft order or creates a new one.
    """
    draft_order = await get_or_create_draft_order(current_user.id, complex_id, db)
    return await build_cart_response(draft_order, db)


@router.post("/items", response_model=CartOut)
async def add_cart_item(
    item: CartItemCreate,
    current_user: User = Depends(get_current_user),
    complex_id: int = Depends(get_user_complex_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Adds or updates item in cart.
    """
    # Validate product is available
    await validate_product_available(item.product_id, db)

    # Get or create draft order
    draft_order = await get_or_create_draft_order(current_user.id, complex_id, db)

    # Add or update item
    await add_or_update_cart_item(draft_order.id, item.product_id, item.quantity, db)

    return await build_cart_response(draft_order, db)


@router.put("/items/{item_id}", response_model=CartOut)
async def update_cart_item(
    item_id: int,
    update: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    complex_id: int = Depends(get_user_complex_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates quantity of cart item.
    """
    # Get draft order
    draft_order = await get_or_create_draft_order(current_user.id, complex_id, db)

    # Get item
    result = await db.execute(
        select(OrderItem).where(
            OrderItem.id == item_id,
            OrderItem.order_id == draft_order.id
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    # Update quantity
    item.quantity = update.quantity
    await db.commit()

    return await build_cart_response(draft_order, db)


@router.delete("/items/{item_id}", response_model=CartOut)
async def delete_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    complex_id: int = Depends(get_user_complex_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Removes item from cart.
    """
    # Get draft order
    draft_order = await get_or_create_draft_order(current_user.id, complex_id, db)

    # Get item
    result = await db.execute(
        select(OrderItem).where(
            OrderItem.id == item_id,
            OrderItem.order_id == draft_order.id
        )
    )
    item = result.scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cart item not found"
        )

    # Delete item
    await db.delete(item)
    await db.commit()

    return await build_cart_response(draft_order, db)


@router.put("/comment", response_model=CartOut)
async def update_cart_comment(
    comment_update: CartCommentUpdate,
    current_user: User = Depends(get_current_user),
    complex_id: int = Depends(get_user_complex_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates comment for draft order.
    """
    draft_order = await get_or_create_draft_order(current_user.id, complex_id, db)

    draft_order.comment = comment_update.comment
    await db.commit()

    return await build_cart_response(draft_order, db)


@router.post("/confirm", response_model=CartOut)
async def confirm_cart(
    current_user: User = Depends(get_current_user),
    complex_id: int = Depends(get_user_complex_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Confirms draft order (changes status to confirmed).
    """
    draft_order = await get_or_create_draft_order(current_user.id, complex_id, db)

    # Validate cart is not empty
    await validate_cart_not_empty(draft_order.id, db)

    # Change status to confirmed
    draft_order.status = OrderStatusEnum.confirmed
    await db.commit()

    return await build_cart_response(draft_order, db)
