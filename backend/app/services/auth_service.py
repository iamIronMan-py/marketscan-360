from __future__ import annotations

import hashlib
import secrets
import smtplib
import uuid
from datetime import timedelta
from email.message import EmailMessage

import jwt
from passlib.context import CryptContext
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import OtpCode, User, UserSession
from app.utils.datetime import utc_now


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def _build_jwt(user: User, jti: str, expires_at) -> str:
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "jti": jti,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_jwt_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def create_password_setup_token(email: str, code: str, purpose: str) -> str:
    expires_at = utc_now() + timedelta(minutes=settings.otp_expiry_minutes)
    payload = {
        "sub": email,
        "otp": _hash_code(code.strip()),
        "purpose": purpose,
        "exp": expires_at,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_password_setup_token(token: str) -> dict:
    payload = decode_jwt_token(token)
    if payload.get("purpose") not in {"password_setup", "password_reset"}:
        raise jwt.InvalidTokenError("Invalid token purpose")
    return payload


async def get_or_create_user(session: AsyncSession, email: str) -> User:
    normalized = email.strip().lower()
    user = await session.scalar(select(User).where(User.email == normalized))
    if user:
        return user
    user = User(email=normalized, full_name=normalized.split("@")[0].replace(".", " ").title())
    session.add(user)
    await session.flush()
    return user


async def request_signup_otp(session: AsyncSession, email: str) -> dict:
    user = await get_or_create_user(session, email)
    if user.password_hash:
        return {
            "email": user.email,
            "emailSent": False,
            "expiresInMinutes": settings.otp_expiry_minutes,
            "deliveryError": "Account already exists. Use password login.",
        }
    otp = _generate_otp()
    await session.execute(delete(OtpCode).where(OtpCode.user_id == user.id, OtpCode.consumed_at.is_(None)))
    expires_at = utc_now() + timedelta(minutes=settings.otp_expiry_minutes)
    session.add(OtpCode(user_id=user.id, otp_hash=_hash_code(otp), expires_at=expires_at))
    await session.commit()

    email_sent, error = send_otp_email(user.email, otp, expires_at, "signup")
    payload = {
        "email": user.email,
        "emailSent": email_sent,
        "expiresInMinutes": settings.otp_expiry_minutes,
    }
    if error:
        payload["deliveryError"] = error
    if settings.auth_debug_return_otp:
        payload["debugOtp"] = otp
    return payload


async def request_reset_otp(session: AsyncSession, email: str) -> dict:
    normalized = email.strip().lower()
    user = await session.scalar(select(User).where(User.email == normalized))
    if not user or not user.password_hash:
        return {
            "email": normalized,
            "emailSent": False,
            "expiresInMinutes": settings.otp_expiry_minutes,
            "deliveryError": "No existing account found for reset.",
        }
    otp = _generate_otp()
    await session.execute(delete(OtpCode).where(OtpCode.user_id == user.id, OtpCode.consumed_at.is_(None)))
    expires_at = utc_now() + timedelta(minutes=settings.otp_expiry_minutes)
    session.add(OtpCode(user_id=user.id, otp_hash=_hash_code(otp), expires_at=expires_at))
    await session.commit()

    email_sent, error = send_otp_email(user.email, otp, expires_at, "reset")
    payload = {
        "email": user.email,
        "emailSent": email_sent,
        "expiresInMinutes": settings.otp_expiry_minutes,
    }
    if error:
        payload["deliveryError"] = error
    if settings.auth_debug_return_otp:
        payload["debugOtp"] = otp
    return payload


async def validate_otp(session: AsyncSession, email: str, code: str, purpose: str) -> dict | None:
    normalized = email.strip().lower()
    user = await session.scalar(select(User).where(User.email == normalized))
    if not user:
        return None

    otp_record = await session.scalar(
        select(OtpCode)
        .where(
            OtpCode.user_id == user.id,
            OtpCode.consumed_at.is_(None),
        )
        .order_by(OtpCode.created_at.desc())
    )
    if not otp_record:
        return None
    now = utc_now()
    if otp_record.expires_at < now:
        return None
    if otp_record.otp_hash != _hash_code(code.strip()):
        return None

    return {
        "setupToken": create_password_setup_token(user.email, code, purpose),
        "email": user.email,
    }


async def set_password_from_setup_token(session: AsyncSession, setup_token: str, password: str) -> dict | None:
    try:
        payload = decode_password_setup_token(setup_token)
    except jwt.InvalidTokenError:
        return None

    email = str(payload.get("sub", "")).strip().lower()
    otp_hash = payload.get("otp")
    user = await session.scalar(select(User).where(User.email == email))
    if not user or not otp_hash:
        return None

    otp_record = await session.scalar(
        select(OtpCode)
        .where(
            OtpCode.user_id == user.id,
            OtpCode.consumed_at.is_(None),
        )
        .order_by(OtpCode.created_at.desc())
    )
    if not otp_record:
        return None
    now = utc_now()
    if otp_record.expires_at < now:
        return None
    if otp_record.otp_hash != otp_hash:
        return None

    otp_record.consumed_at = now
    user.is_verified = True
    user.password_hash = _hash_password(password)
    user.last_login_at = now
    jti = str(uuid.uuid4())
    expires_at = now + timedelta(minutes=settings.jwt_expire_minutes)
    session.add(UserSession(user_id=user.id, token=jti, token_jti=jti, expires_at=expires_at))
    await session.commit()
    token = _build_jwt(user, jti, expires_at)
    return {
        "token": token,
        "user": {
            "email": user.email,
            "fullName": user.full_name,
            "isVerified": user.is_verified,
        },
    }


async def login_with_password(session: AsyncSession, email: str, password: str) -> dict | None:
    normalized = email.strip().lower()
    user = await session.scalar(select(User).where(User.email == normalized))
    if not user or not user.password_hash:
        return None
    if not _verify_password(password, user.password_hash):
        return None

    now = utc_now()
    user.last_login_at = now
    jti = str(uuid.uuid4())
    expires_at = now + timedelta(minutes=settings.jwt_expire_minutes)
    session.add(UserSession(user_id=user.id, token=jti, token_jti=jti, expires_at=expires_at))
    await session.commit()
    token = _build_jwt(user, jti, expires_at)
    return {
        "token": token,
        "user": {
            "email": user.email,
            "fullName": user.full_name,
            "isVerified": user.is_verified,
        },
    }


async def get_user_by_token(session: AsyncSession, token: str) -> User | None:
    try:
        payload = decode_jwt_token(token)
    except jwt.InvalidTokenError:
        return None

    jti = payload.get("jti")
    if not jti:
        return None

    session_row = await session.scalar(
        select(UserSession).where(
            UserSession.token_jti == jti,
            UserSession.revoked_at.is_(None),
        )
    )
    if not session_row:
        return None
    if session_row.expires_at < utc_now():
        return None
    return await session.get(User, session_row.user_id)


async def revoke_token(session: AsyncSession, token: str) -> bool:
    try:
        payload = decode_jwt_token(token)
    except jwt.InvalidTokenError:
        return False
    jti = payload.get("jti")
    if not jti:
        return False
    session_row = await session.scalar(select(UserSession).where(UserSession.token_jti == jti))
    if not session_row:
        return False
    session_row.revoked_at = utc_now()
    await session.commit()
    return True


def send_otp_email(email: str, otp: str, expires_at, mode: str) -> tuple[bool, str | None]:
    if not settings.gmail_sender_email or not settings.gmail_app_password:
        return False, "Gmail SMTP credentials are missing"

    try:
        message = EmailMessage()
        message["Subject"] = "Your MarketScan 360 OTP"
        message["From"] = settings.gmail_sender_email
        message["To"] = email
        message.set_content(
            f"Your MarketScan 360 {mode} OTP is {otp}. It expires at {expires_at.isoformat()}."
        )

        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as smtp:
            smtp.login(settings.gmail_sender_email, settings.gmail_app_password)
            smtp.send_message(message)
        return True, None
    except Exception as exc:
        return False, str(exc)
