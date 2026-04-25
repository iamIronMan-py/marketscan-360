from __future__ import annotations

import strawberry
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.scalars import JSON

from app.services.scan_service import (
    get_active_scan,
    get_company_by_slug,
    get_competitors_for_scan,
    get_signals_for_scan,
    list_companies,
)


@strawberry.type
class PlatformLinkNode:
    platform: str
    label: str
    url: str
    source_kind: str
    note: str
    signal_count: int
    sentiment_score: float


@strawberry.type
class SignalNode:
    platform: str
    source_label: str
    source_url: str
    signal_type: str
    sentiment: str
    title: str
    content: str
    engagement_count: int
    published_label: str


@strawberry.type
class CompetitorNode:
    name: str
    domain: str
    benchmark_score: int
    strengths: list[str]


@strawberry.type
class CompanyNode:
    name: str
    slug: str
    domain: str
    industry: str
    headquarters: str
    founded_year: int
    summary: str
    opportunity_score: int
    health_score: int
    tags: list[str]


@strawberry.type
class CompanySnapshot:
    company: CompanyNode
    workflow: list[JSON]
    platform_links: list[PlatformLinkNode]
    gaps: list[JSON]
    promo_ideas: list[JSON]
    signals: list[SignalNode]
    competitors: list[CompetitorNode]
    summary: JSON


@strawberry.type
class Query:
    @strawberry.field
    async def companies(self, info) -> list[CompanyNode]:
        if not info.context.get("user"):
            raise PermissionError("Unauthorized")
        session: AsyncSession = info.context["db"]
        companies = await list_companies(session)
        return [
            CompanyNode(
                name=item.name,
                slug=item.slug,
                domain=item.domain,
                industry=item.industry,
                headquarters=item.headquarters,
                founded_year=item.founded_year,
                summary=item.summary,
                opportunity_score=item.opportunity_score,
                health_score=item.health_score,
                tags=item.tags,
            )
            for item in companies
        ]

    @strawberry.field
    async def company_snapshot(self, info, slug: str) -> CompanySnapshot | None:
        if not info.context.get("user"):
            raise PermissionError("Unauthorized")
        session: AsyncSession = info.context["db"]
        company = await get_company_by_slug(session, slug)
        if not company:
            return None
        scan = await get_active_scan(session, company.id)
        if not scan:
            return None
        signals = await get_signals_for_scan(session, scan.id)
        competitors = await get_competitors_for_scan(session, scan.id)
        return CompanySnapshot(
            company=CompanyNode(
                name=company.name,
                slug=company.slug,
                domain=company.domain,
                industry=company.industry,
                headquarters=company.headquarters,
                founded_year=company.founded_year,
                summary=company.summary,
                opportunity_score=company.opportunity_score,
                health_score=company.health_score,
                tags=company.tags,
            ),
            workflow=scan.workflow_state,
            platform_links=[
                PlatformLinkNode(
                    platform=link.platform,
                    label=link.label,
                    url=link.url,
                    source_kind=link.source_kind,
                    note=link.note,
                    signal_count=link.signal_count,
                    sentiment_score=link.sentiment_score,
                )
                for link in company.platform_links
            ],
            gaps=scan.gap_analysis,
            promo_ideas=scan.promo_ideas,
            signals=[
                SignalNode(
                    platform=signal.platform,
                    source_label=signal.source_label,
                    source_url=signal.source_url,
                    signal_type=signal.signal_type,
                    sentiment=signal.sentiment,
                    title=signal.title,
                    content=signal.content,
                    engagement_count=signal.engagement_count,
                    published_label=signal.published_label,
                )
                for signal in signals
            ],
            competitors=[
                CompetitorNode(
                    name=item.name,
                    domain=item.domain,
                    benchmark_score=item.benchmark_score,
                    strengths=item.strengths,
                )
                for item in competitors
            ],
            summary=scan.summary,
        )


schema = strawberry.Schema(query=Query)
