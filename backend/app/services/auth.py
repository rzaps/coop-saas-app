import hmac
import hashlib
import json
from urllib.parse import parse_qsl
from datetime import datetime, timedelta
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import os

from app.models.user import User


def validate_telegram_init_data(init_data: str, bot_token: str) -> dict:
    """
    Validates Telegram initData according to official documentation.
    Returns parsed user data if valid, raises HTTPException otherwise.
    """
    try:
        parsed_data = dict(parse_qsl(init_data))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid initData format"
        )

    if "hash" not in parsed_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing hash in initData"
        )

    received_hash = parsed_data.pop("hash")

    # Create data-check-string: sorted key=value pairs joined with \n
    data_check_string = "\n".join(
        f"{key}={value}" 
        for key, value in sorted(parsed_data.items())
    )

    # Calculate secret key: HMAC-SHA256 of bot token with "WebAppData" as key
    secret_key = hmac.new(
        key="WebAppData".encode(),
        msg=bot_token.encode(),
        digestmod=hashlib.sha256
    ).digest()

    # Calculate hash: HMAC-SHA256 of data-check-string with secret key
    calculated_hash = hmac.new(
        key=secret_key,
        msg=data_check_string.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()

    # Debug logging
    print(f"BOT_TOKEN: {bot_token[:10]}...")
    print(f"received_hash: {received_hash}")
    print(f"calculated_hash: {calculated_hash}")

    if calculated_hash != received_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid hash signature"
        )

    # Parse user data
    if "user" not in parsed_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing user data in initData"
        )

    try:
        user_data = json.loads(parsed_data["user"])
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user data format"
        )

    return user_data


async def get_or_create_user(telegram_data: dict, db: AsyncSession) -> User:
    """
    Gets existing user by telegram_id or creates a new one.
    """
    telegram_id = telegram_data.get("id")
    if not telegram_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing telegram user id"
        )

    # Try to find existing user
    result = await db.execute(
        select(User).where(User.telegram_id == telegram_id)
    )
    user = result.scalar_one_or_none()

    if user:
        return user

    # Create new user
    user = User(
        telegram_id=telegram_id,
        first_name=telegram_data.get("first_name", ""),
        last_name=telegram_data.get("last_name")
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


def create_jwt(user_id: int) -> str:
    """
    Creates JWT token for user.
    """
    jwt_secret = os.getenv("JWT_SECRET")
    jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expire_minutes = int(os.getenv("JWT_EXPIRE_MINUTES", "10080"))  # 7 days default

    if not jwt_secret:
        raise ValueError("JWT_SECRET not configured")

    expire = datetime.utcnow() + timedelta(minutes=jwt_expire_minutes)
    
    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    token = jwt.encode(payload, jwt_secret, algorithm=jwt_algorithm)
    return token
