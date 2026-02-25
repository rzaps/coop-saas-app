from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.membership import Membership
from app.schemas.admin.products import ProductCreate, ProductUpdate, ProductOut, ProductsListOut

router = APIRouter(prefix="/admin/products", tags=["admin-products"])


@router.get("", response_model=ProductsListOut)
async def get_products(
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all products where admin_id == current_user.id
    """
    result = await db.execute(
        select(Product).where(
            Product.admin_id == current_user.id,
            Product.complex_id == membership.complex_id
        )
    )
    products = result.scalars().all()

    return ProductsListOut(products=products)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new product.
    """
    # Verify category belongs to admin
    result = await db.execute(
        select(Category).where(
            Category.id == product_data.category_id,
            Category.admin_id == current_user.id,
            Category.complex_id == membership.complex_id
        )
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found or access denied"
        )

    new_product = Product(
        name=product_data.name,
        price=product_data.price,
        unit=product_data.unit,
        note=product_data.note,
        available=True,
        category_id=product_data.category_id,
        admin_id=current_user.id,
        complex_id=membership.complex_id
    )
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)

    return new_product


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates product details.
    """
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.admin_id == current_user.id,
            Product.complex_id == membership.complex_id
        )
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Verify category if changed
    if product_data.category_id:
        cat_result = await db.execute(
            select(Category).where(
                Category.id == product_data.category_id,
                Category.admin_id == current_user.id,
                Category.complex_id == membership.complex_id
            )
        )
        category = cat_result.scalar_one_or_none()

        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found or access denied"
            )

        product.category_id = product_data.category_id

    if product_data.name:
        product.name = product_data.name
    if product_data.price is not None:
        product.price = product_data.price
    if product_data.unit:
        product.unit = product_data.unit
    if product_data.note is not None:
        product.note = product_data.note

    await db.commit()
    await db.refresh(product)

    return product


@router.patch("/{product_id}/toggle", response_model=ProductOut)
async def toggle_product_availability(
    product_id: int,
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Toggles product availability (inverts available flag).
    """
    result = await db.execute(
        select(Product).where(
            Product.id == product_id,
            Product.admin_id == current_user.id,
            Product.complex_id == membership.complex_id
        )
    )
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    product.available = not product.available
    await db.commit()
    await db.refresh(product)

    return product
