from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.user import User
from app.models.category import Category
from app.models.membership import Membership
from app.schemas.admin.categories import CategoryCreate, CategoryUpdate, CategoryOut, CategoriesListOut

router = APIRouter(prefix="/admin/categories", tags=["admin-categories"])


@router.get("", response_model=CategoriesListOut)
async def get_categories(
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all categories where admin_id == current_user.id
    """
    result = await db.execute(
        select(Category).where(
            Category.admin_id == current_user.id,
            Category.complex_id == membership.complex_id
        )
    )
    categories = result.scalars().all()

    return CategoriesListOut(categories=categories)


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new category.
    """
    new_category = Category(
        name=category_data.name,
        complex_id=membership.complex_id,
        admin_id=current_user.id,
        is_active=True
    )
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)

    return new_category


@router.put("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates category name.
    """
    result = await db.execute(
        select(Category).where(
            Category.id == category_id,
            Category.admin_id == current_user.id,
            Category.complex_id == membership.complex_id
        )
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    category.name = category_data.name
    await db.commit()
    await db.refresh(category)

    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def archive_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Archives category (sets is_active=False).
    """
    result = await db.execute(
        select(Category).where(
            Category.id == category_id,
            Category.admin_id == current_user.id,
            Category.complex_id == membership.complex_id
        )
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )

    category.is_active = False
    await db.commit()
