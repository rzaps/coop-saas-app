from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.residential_complex import ResidentialComplex
from app.models.membership import Membership, RoleEnum
from app.schemas.onboarding import ComplexCreateRequest, ComplexCreateResponse

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


@router.post("/complex", response_model=ComplexCreateResponse)
async def create_complex(
    request: ComplexCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new residential complex and assigns current user as super_admin.
    Returns 400 if complex with this name already exists.
    """
    # Check if complex already exists
    result = await db.execute(
        select(ResidentialComplex).where(ResidentialComplex.name == request.name)
    )
    existing_complex = result.scalar_one_or_none()

    if existing_complex:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Residential complex with this name already exists"
        )

    # Create new complex
    new_complex = ResidentialComplex(name=request.name)
    db.add(new_complex)
    await db.flush()

    # Create membership with super_admin role
    membership = Membership(
        user_id=current_user.id,
        complex_id=new_complex.id,
        role=RoleEnum.super_admin
    )
    db.add(membership)
    await db.commit()
    await db.refresh(new_complex)

    return ComplexCreateResponse(
        complex_id=new_complex.id,
        name=new_complex.name,
        role=RoleEnum.super_admin.value
    )
