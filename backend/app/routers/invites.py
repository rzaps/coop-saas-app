from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import secrets
import string
import os

from app.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.user import User
from app.models.invite_code import InviteCode
from app.models.membership import Membership, RoleEnum
from app.models.residential_complex import ResidentialComplex

router = APIRouter(prefix="/invites", tags=["invites"])


def generate_invite_code() -> str:
    """Generate a random 8-character alphanumeric code"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))


@router.post("/generate")
async def generate_invite(
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate a new invite code for the complex.
    Only admin and super_admin can generate invites.
    """
    # Generate unique code
    code = generate_invite_code()
    while True:
        result = await db.execute(select(InviteCode).where(InviteCode.code == code))
        if not result.scalar_one_or_none():
            break
        code = generate_invite_code()

    # Create invite code
    invite = InviteCode(
        code=code,
        complex_id=membership.complex_id,
        created_by=current_user.id,
        is_active=True
    )
    db.add(invite)
    await db.commit()
    await db.refresh(invite)

    # Get bot username from environment
    bot_username = os.getenv("BOT_USERNAME", "your_bot")
    invite_url = f"https://t.me/{bot_username}/GroupBuy?startapp=invite_{code}"

    return {
        "code": code,
        "invite_url": invite_url
    }


@router.post("/join")
async def join_by_invite(
    invite_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Join a complex using an invite code.
    """
    code = invite_data.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Invite code is required")

    # Find invite code
    result = await db.execute(
        select(InviteCode).where(
            InviteCode.code == code,
            InviteCode.is_active == True
        )
    )
    invite = result.scalar_one_or_none()

    if not invite:
        raise HTTPException(status_code=400, detail="Invalid or expired invite code")

    # Check if user already has membership in this complex
    existing_membership = await db.execute(
        select(Membership).where(
            Membership.user_id == current_user.id,
            Membership.complex_id == invite.complex_id
        )
    )
    membership = existing_membership.scalar_one_or_none()

    if membership:
        # User already in this complex, just return success
        complex_result = await db.execute(
            select(ResidentialComplex).where(ResidentialComplex.id == invite.complex_id)
        )
        complex = complex_result.scalar_one()
        return {
            "complex_id": complex.id,
            "complex_name": complex.name,
            "role": membership.role.value
        }

    # Create new membership
    new_membership = Membership(
        user_id=current_user.id,
        complex_id=invite.complex_id,
        role=RoleEnum.user
    )
    db.add(new_membership)
    await db.commit()

    # Get complex info
    complex_result = await db.execute(
        select(ResidentialComplex).where(ResidentialComplex.id == invite.complex_id)
    )
    complex = complex_result.scalar_one()

    return {
        "complex_id": complex.id,
        "complex_name": complex.name,
        "role": "user"
    }


@router.get("")
async def list_invites(
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    List all active invite codes for the current complex.
    Only admin and super_admin can view invites.
    """
    result = await db.execute(
        select(InviteCode).where(
            InviteCode.complex_id == membership.complex_id,
            InviteCode.is_active == True
        ).order_by(InviteCode.created_at.desc())
    )
    invites = result.scalars().all()

    return {
        "invites": [
            {
                "code": invite.code,
                "created_at": invite.created_at.isoformat(),
                "created_by": invite.created_by
            }
            for invite in invites
        ]
    }


@router.delete("/{code}")
async def deactivate_invite(
    code: str,
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Deactivate an invite code.
    Only admin and super_admin can deactivate invites.
    """
    result = await db.execute(
        select(InviteCode).where(
            InviteCode.code == code,
            InviteCode.complex_id == membership.complex_id
        )
    )
    invite = result.scalar_one_or_none()

    if not invite:
        raise HTTPException(status_code=404, detail="Invite code not found")

    invite.is_active = False
    await db.commit()

    return {"message": "Invite code deactivated"}
