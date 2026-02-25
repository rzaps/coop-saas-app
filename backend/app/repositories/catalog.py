from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.category import Category
from app.models.product import Product


async def get_active_categories_with_products(db: AsyncSession, complex_id: int) -> list[Category]:
    """
    Returns all active categories with their available products for a given complex.
    """
    result = await db.execute(
        select(Category)
        .where(
            Category.complex_id == complex_id,
            Category.is_active == True
        )
        .options(selectinload(Category.products))
    )
    categories = result.scalars().all()
    
    # Filter only available products
    for category in categories:
        category.products = [p for p in category.products if p.available]
    
    return list(categories)


async def get_category_with_products(db: AsyncSession, category_id: int, complex_id: int) -> Category | None:
    """
    Returns a single category with its available products.
    """
    result = await db.execute(
        select(Category)
        .where(
            Category.id == category_id,
            Category.complex_id == complex_id,
            Category.is_active == True
        )
        .options(selectinload(Category.products))
    )
    category = result.scalar_one_or_none()
    
    if category:
        # Filter only available products
        category.products = [p for p in category.products if p.available]
    
    return category
