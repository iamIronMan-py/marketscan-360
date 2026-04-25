import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class Company(TimestampMixin, Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    domain: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    industry: Mapped[str] = mapped_column(String(120), default="B2B SaaS")
    headquarters: Mapped[str] = mapped_column(String(160), default="")
    founded_year: Mapped[int] = mapped_column(Integer, default=2020)
    summary: Mapped[str] = mapped_column(Text, default="")
    opportunity_score: Mapped[int] = mapped_column(Integer, default=0)
    health_score: Mapped[int] = mapped_column(Integer, default=0)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    products: Mapped[list[dict]] = mapped_column(JSON, default=list)

    platform_links: Mapped[list["PlatformLink"]] = relationship(back_populates="company", cascade="all, delete-orphan", lazy="selectin")
    scans: Mapped[list["Scan"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    reports: Mapped[list["ReportArtifact"]] = relationship(back_populates="company", cascade="all, delete-orphan")


class PlatformLink(TimestampMixin, Base):
    __tablename__ = "platform_links"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    platform: Mapped[str] = mapped_column(String(50), index=True)
    label: Mapped[str] = mapped_column(String(120))
    url: Mapped[str] = mapped_column(Text)
    source_kind: Mapped[str] = mapped_column(String(50), default="official")
    note: Mapped[str] = mapped_column(Text, default="")
    signal_count: Mapped[int] = mapped_column(Integer, default=0)
    sentiment_score: Mapped[float] = mapped_column(Float, default=0.0)

    company: Mapped["Company"] = relationship(back_populates="platform_links")


class Scan(TimestampMixin, Base):
    __tablename__ = "scans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    query: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(40), default="completed")
    workflow_state: Mapped[list[dict]] = mapped_column(JSON, default=list)
    summary: Mapped[dict] = mapped_column(JSON, default=dict)
    gap_analysis: Mapped[list[dict]] = mapped_column(JSON, default=list)
    promo_ideas: Mapped[list[dict]] = mapped_column(JSON, default=list)

    company: Mapped["Company"] = relationship(back_populates="scans")
    signals: Mapped[list["Signal"]] = relationship(back_populates="scan", cascade="all, delete-orphan")
    competitors: Mapped[list["CompetitorSnapshot"]] = relationship(back_populates="scan", cascade="all, delete-orphan")


class Signal(TimestampMixin, Base):
    __tablename__ = "signals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    scan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"))
    platform: Mapped[str] = mapped_column(String(50), index=True)
    source_label: Mapped[str] = mapped_column(String(160))
    source_url: Mapped[str] = mapped_column(Text)
    signal_type: Mapped[str] = mapped_column(String(50), default="review")
    sentiment: Mapped[str] = mapped_column(String(20), default="neutral")
    sentiment_score: Mapped[float] = mapped_column(Float, default=0.0)
    author_handle: Mapped[str] = mapped_column(String(120), default="")
    title: Mapped[str] = mapped_column(String(255), default="")
    content: Mapped[str] = mapped_column(Text, default="")
    engagement_count: Mapped[int] = mapped_column(Integer, default=0)
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    published_label: Mapped[str] = mapped_column(String(60), default="Just now")

    scan: Mapped["Scan"] = relationship(back_populates="signals")


class CompetitorSnapshot(TimestampMixin, Base):
    __tablename__ = "competitor_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("scans.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(160))
    domain: Mapped[str] = mapped_column(String(255))
    benchmark_score: Mapped[int] = mapped_column(Integer, default=0)
    source_type: Mapped[str] = mapped_column(String(50), default="mock-benchmark")
    strengths: Mapped[list[str]] = mapped_column(JSON, default=list)

    scan: Mapped["Scan"] = relationship(back_populates="competitors")


class ReportArtifact(TimestampMixin, Base):
    __tablename__ = "report_artifacts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    scan_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("scans.id", ondelete="SET NULL"), nullable=True)
    file_name: Mapped[str] = mapped_column(String(255))
    file_path: Mapped[str] = mapped_column(Text)
    file_type: Mapped[str] = mapped_column(String(20), default="json")
    file_size: Mapped[int] = mapped_column(Integer, default=0)

    company: Mapped["Company"] = relationship(back_populates="reports")


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(180), default="")
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    password_hash: Mapped[str] = mapped_column(String(255), default="")
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    otp_codes: Mapped[list["OtpCode"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    sessions: Mapped[list["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class OtpCode(TimestampMixin, Base):
    __tablename__ = "otp_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    otp_hash: Mapped[str] = mapped_column(String(128))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc) + timedelta(minutes=10))
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="otp_codes")


class UserSession(TimestampMixin, Base):
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True, default="")
    token_jti: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc) + timedelta(days=7))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="sessions")
