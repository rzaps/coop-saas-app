from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.membership import Membership, RoleEnum
from app.models.residential_complex import ResidentialComplex
from app.schemas.catalog import CatalogOut, CategoryOut
from app.repositories.catalog import get_active_categories_with_products, get_category_with_products

router = APIRouter(prefix="/catalog", tags=["catalog"])


async def get_user_complex_id(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> int:
    """
    Gets complex_id from user's membership.
    If user has no membership but a complex exists, creates membership with 'user' role.
    If no complex exists, raises 404 with needs_onboarding flag.
    """
    # 1. Check if user has membership
    result = await db.execute(
        select(Membership).where(Membership.user_id == current_user.id)
    )
    memberships = result.scalars().all()

    # If user has membership(s)
    if len(memberships) > 0:
        if len(memberships) > 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User has multiple memberships. Please specify complex_id"
            )
        return memberships[0].complex_id

    # 2. User has no membership - check if any complex exists
    result = await db.execute(select(ResidentialComplex))
    complexes = result.scalars().all()

    if len(complexes) == 0:
        # No complex exists - needs onboarding
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"message": "No complex found", "needs_onboarding": True}
        )

    if len(complexes) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Multiple complexes exist. Please contact administrator"
        )

    # 3. Exactly one complex exists - create membership with user role
    complex = complexes[0]
    membership = Membership(
        user_id=current_user.id,
        complex_id=complex.id,
        role=RoleEnum.user
    )
    db.add(membership)
    await db.commit()

    return complex.id


@router.get("", response_model=CatalogOut)
async def get_catalog(
    complex_id: int = Depends(get_user_complex_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all active categories with their available products for user's complex.
    """
    categories = await get_active_categories_with_products(db, complex_id)
    
    return CatalogOut(categories=categories)


@router.get("/{category_id}", response_model=CategoryOut)
async def get_category(
    category_id: int,
    complex_id: int = Depends(get_user_complex_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns a single category with its available products from user's complex.
    """
    category = await get_category_with_products(db, category_id, complex_id)
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return category
