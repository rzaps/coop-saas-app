from pydantic import BaseModel
from app.models.membership import RoleEnum


class UserOut(BaseModel):
    id: int
    telegram_id: int
    first_name: str
    last_name: str | None
    role: str


class UsersListOut(BaseModel):
    users: list[UserOut]


class UserRoleUpdate(BaseModel):
    role: RoleEnum


class TransferOwnershipRequest(BaseModel):
    new_super_admin_id: int
