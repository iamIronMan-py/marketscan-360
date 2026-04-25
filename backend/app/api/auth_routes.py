from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.auth_service import (
    get_user_by_token,
    login_with_password,
    request_reset_otp,
    request_signup_otp,
    revoke_token,
    set_password_from_setup_token,
    validate_otp,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup/request-otp")
async def request_signup(payload: dict, db: AsyncSession = Depends(get_db)) -> dict:
    email = payload.get("email", "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    return await request_signup_otp(db, email)


@router.post("/signup/verify-otp")
async def verify_signup_otp(payload: dict, db: AsyncSession = Depends(get_db)) -> dict:
    email = payload.get("email", "").strip().lower()
    code = payload.get("code", "").strip()
    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and OTP are required")
    result = await validate_otp(db, email, code, "password_setup")
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    return result


@router.post("/forgot-password/request-otp")
async def request_reset(payload: dict, db: AsyncSession = Depends(get_db)) -> dict:
    email = payload.get("email", "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Valid email is required")
    return await request_reset_otp(db, email)


@router.post("/forgot-password/verify-otp")
async def verify_reset_otp(payload: dict, db: AsyncSession = Depends(get_db)) -> dict:
    email = payload.get("email", "").strip().lower()
    code = payload.get("code", "").strip()
    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and OTP are required")
    result = await validate_otp(db, email, code, "password_reset")
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    return result


@router.post("/set-password")
async def set_password(payload: dict, db: AsyncSession = Depends(get_db)) -> dict:
    setup_token = payload.get("setupToken", "").strip()
    password = payload.get("password", "")
    confirm_password = payload.get("confirmPassword", "")
    if not setup_token or not password or not confirm_password:
        raise HTTPException(status_code=400, detail="Setup token, password, and confirm password are required")
    if password != confirm_password:
        raise HTTPException(status_code=400, detail="Password and confirm password must match")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    result = await set_password_from_setup_token(db, setup_token, password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid or expired setup session")
    return result


@router.post("/login")
async def login(payload: dict, db: AsyncSession = Depends(get_db)) -> dict:
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    result = await login_with_password(db, email, password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return result


@router.get("/me")
async def get_me(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    token = authorization.removeprefix("Bearer ").strip()
    user = await get_user_by_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    return {
        "email": user.email,
        "fullName": user.full_name,
        "isVerified": user.is_verified,
    }


@router.post("/logout")
async def logout(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    token = authorization.removeprefix("Bearer ").strip()
    revoked = await revoke_token(db, token)
    if not revoked:
        raise HTTPException(status_code=401, detail="Invalid session")
    return {"success": True}
