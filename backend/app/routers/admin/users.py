from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies.auth import get_current_user, require_super_admin
from app.models.user import User
from app.models.membership import Membership, RoleEnum
from app.schemas.admin.users import UserOut, UsersListOut, UserRoleUpdate, TransferOwnershipRequest

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


@router.get("", response_model=UsersListOut)
async def get_users(
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all users in the complex with their roles.
    """
    result = await db.execute(
        select(Membership)
        .where(Membership.complex_id == membership.complex_id)
    )
    memberships = result.scalars().all()

    users_out = []
    for m in memberships:
        user_result = await db.execute(
            select(User).where(User.id == m.user_id)
        )
        user = user_result.scalar_one()

        users_out.append(UserOut(
            id=user.id,
            telegram_id=user.telegram_id,
            first_name=user.first_name,
            last_name=user.last_name,
            role=m.role.value
        ))

    return UsersListOut(users=users_out)


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates user role (admin/user).
    Cannot change own role or assign super_admin.
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )

    if role_update.role == RoleEnum.super_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use transfer-ownership endpoint to assign super_admin"
        )

    # Get user membership
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == user_id,
            Membership.complex_id == membership.complex_id
        )
    )
    user_membership = result.scalar_one_or_none()

    if not user_membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in this complex"
        )

    # Update role
    user_membership.role = role_update.role
    await db.commit()

    # Get user info
    user_result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = user_result.scalar_one()

    return UserOut(
        id=user.id,
        telegram_id=user.telegram_id,
        first_name=user.first_name,
        last_name=user.last_name,
        role=user_membership.role.value
    )


@router.post("/transfer-ownership", response_model=dict)
async def transfer_ownership(
    transfer_request: TransferOwnershipRequest,
    current_user: User = Depends(get_current_user),
    membership: Membership = Depends(require_super_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Transfers super_admin role to another user.
    Current super_admin becomes admin.
    """
    if transfer_request.new_super_admin_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already super_admin"
        )

    # Get new super_admin membership
    result = await db.execute(
        select(Membership).where(
            Membership.user_id == transfer_request.new_super_admin_id,
            Membership.complex_id == membership.complex_id
        )
    )
    new_super_admin_membership = result.scalar_one_or_none()

    if not new_super_admin_membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in this complex"
        )

    # Transfer ownership
    membership.role = RoleEnum.admin  # Current super_admin → admin
    new_super_admin_membership.role = RoleEnum.super_admin  # New user → super_admin

    await db.commit()

    return {
        "message": "Ownership transferred successfully",
        "new_super_admin_id": transfer_request.new_super_admin_id
    }
