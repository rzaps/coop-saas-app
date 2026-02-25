from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import os

from app.database import get_db
from app.schemas.auth import TelegramAuthRequest, TokenResponse
from app.services.auth import validate_telegram_init_data, get_or_create_user, create_jwt

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/telegram", response_model=TokenResponse)
async def telegram_auth(
    request: TelegramAuthRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticates user via Telegram initData and returns JWT token.
    """
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not bot_token:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bot token not configured"
        )

    # Validate Telegram initData
    telegram_data = validate_telegram_init_data(request.init_data, bot_token)

    # Get or create user
    user = await get_or_create_user(telegram_data, db)

    # Create JWT token
    access_token = create_jwt(user.id)

    return TokenResponse(access_token=access_token)
