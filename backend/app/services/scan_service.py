from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Company, CompetitorSnapshot, PlatformLink, Scan, Signal
from app.services.research_service import run_research_scan
from app.utils.datetime import utc_now


async def bootstrap_demo_data(session: AsyncSession) -> Company | None:
    result = await session.scalars(select(Company).limit(1))
    return result.first()


def build_dashboard_summary(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "stats": payload["stats"],
        "hashtags": payload["hashtags"],
        "last_updated": utc_now().isoformat(),
        "platform_summary": payload["platform_links"],
        "researchDetails": payload["research_details"],
    }


async def list_companies(session: AsyncSession) -> list[Company]:
    result = await session.scalars(
        select(Company)
        .options(selectinload(Company.platform_links))
        .order_by(Company.updated_at.desc(), Company.created_at.desc())
    )
    return list(result.all())


async def get_company_by_slug(session: AsyncSession, slug: str) -> Company | None:
    return await session.scalar(
        select(Company)
        .options(selectinload(Company.platform_links))
        .where(Company.slug == slug)
    )


async def get_active_scan(session: AsyncSession, company_id) -> Scan | None:
    result = await session.scalars(select(Scan).where(Scan.company_id == company_id).order_by(Scan.created_at.desc()))
    return result.first()


async def get_signals_for_scan(session: AsyncSession, scan_id) -> list[Signal]:
    result = await session.scalars(select(Signal).where(Signal.scan_id == scan_id).order_by(Signal.created_at.desc()))
    return list(result.all())


async def get_competitors_for_scan(session: AsyncSession, scan_id) -> list[CompetitorSnapshot]:
    result = await session.scalars(select(CompetitorSnapshot).where(CompetitorSnapshot.scan_id == scan_id))
    return list(result.all())


async def create_scan(session: AsyncSession, query: str) -> dict[str, Any]:
    payload = await run_research_scan(query)
    company_slug = payload["company"]["slug"]
    company = await session.scalar(select(Company).where(Company.slug == company_slug))

    if not company:
        company = Company(
            name=payload["company"]["name"],
            slug=company_slug,
            domain=payload["company"]["domain"],
            industry=payload["company"]["industry"],
            headquarters=payload["company"]["headquarters"],
            founded_year=payload["company"]["founded_year"],
            summary=payload["company"]["summary"],
            opportunity_score=payload["company"]["opportunity_score"],
            health_score=payload["company"]["health_score"],
            tags=payload["company"]["tags"],
            products=payload["company"]["products"],
        )
        session.add(company)
        await session.flush()
    else:
        company.summary = payload["company"]["summary"]
        company.name = payload["company"]["name"]
        company.domain = payload["company"]["domain"]
        company.industry = payload["company"]["industry"]
        company.headquarters = payload["company"]["headquarters"]
        company.founded_year = payload["company"]["founded_year"]
        company.opportunity_score = payload["company"]["opportunity_score"]
        company.health_score = payload["company"]["health_score"]
        company.tags = payload["company"]["tags"]
        company.products = payload["company"]["products"]

        await session.execute(select(PlatformLink).where(PlatformLink.company_id == company.id))
        existing_links = await session.scalars(select(PlatformLink).where(PlatformLink.company_id == company.id))
        for link in existing_links.all():
            await session.delete(link)

    for item in payload["platform_links"]:
        session.add(PlatformLink(company_id=company.id, **item))

    scan = Scan(
        company_id=company.id,
        query=query,
        status="active",
        workflow_state=payload["workflow"],
        summary=build_dashboard_summary(payload),
        gap_analysis=payload["gaps"],
        promo_ideas=payload["promo_ideas"],
    )
    session.add(scan)
    await session.flush()

    for signal in payload["signals"]:
        session.add(Signal(company_id=company.id, scan_id=scan.id, **signal))

    for competitor in payload["competitors"]:
        session.add(CompetitorSnapshot(scan_id=scan.id, **competitor))

    await session.commit()
    return {"scanId": str(scan.id), "companySlug": company.slug, "status": scan.status}
