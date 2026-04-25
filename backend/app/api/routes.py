from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.auth_service import get_user_by_token
from app.services.export_service import write_csv_export, write_json_export, write_pdf_report, write_report_file
from app.services.scan_service import (
    create_scan,
    get_active_scan,
    get_company_by_slug,
    get_competitors_for_scan,
    get_signals_for_scan,
    list_companies,
)


router = APIRouter()


async def require_user(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required")
    token = authorization.removeprefix("Bearer ").strip()
    user = await get_user_by_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    return {"id": str(user.id), "email": user.email}


async def build_workspace_payload(slug: str, db: AsyncSession) -> dict:
    company = await get_company_by_slug(db, slug)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    scan = await get_active_scan(db, company.id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    signals = await get_signals_for_scan(db, scan.id)
    competitors = await get_competitors_for_scan(db, scan.id)
    return {
        "company": {
            "name": company.name,
            "slug": company.slug,
            "domain": company.domain,
            "industry": company.industry,
            "headquarters": company.headquarters,
            "foundedYear": company.founded_year,
            "summary": company.summary,
            "opportunityScore": company.opportunity_score,
            "healthScore": company.health_score,
            "tags": company.tags,
            "products": company.products,
        },
        "workflow": scan.workflow_state,
        "summary": scan.summary,
        "platformLinks": [
            {
                "platform": link.platform,
                "label": link.label,
                "url": link.url,
                "sourceKind": link.source_kind,
                "note": link.note,
                "signalCount": link.signal_count,
                "sentimentScore": link.sentiment_score,
            }
            for link in company.platform_links
        ],
        "signals": [
            {
                "platform": item.platform,
                "sourceLabel": item.source_label,
                "sourceUrl": item.source_url,
                "signalType": item.signal_type,
                "sentiment": item.sentiment,
                "sentimentScore": item.sentiment_score,
                "authorHandle": item.author_handle,
                "title": item.title,
                "content": item.content,
                "engagementCount": item.engagement_count,
                "tags": item.tags,
                "publishedLabel": item.published_label,
            }
            for item in signals
        ],
        "gaps": scan.gap_analysis,
        "promoIdeas": scan.promo_ideas,
        "competitors": [
            {
                "name": row.name,
                "domain": row.domain,
                "benchmarkScore": row.benchmark_score,
                "strengths": row.strengths,
                "sourceType": getattr(row, "source_type", None),
            }
            for row in competitors
        ],
        "researchDetails": scan.summary.get("researchDetails", {}),
    }


@router.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/companies")
async def companies(_: dict = Depends(require_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    rows = await list_companies(db)
    return [
        {
            "name": row.name,
            "slug": row.slug,
            "domain": row.domain,
            "industry": row.industry,
            "headquarters": row.headquarters,
            "foundedYear": row.founded_year,
            "summary": row.summary,
            "opportunityScore": row.opportunity_score,
            "healthScore": row.health_score,
            "tags": row.tags,
            "products": row.products,
            "updatedAt": row.updated_at.isoformat(),
        }
        for row in rows
    ]


@router.get("/companies/{slug}/workspace")
async def company_workspace(slug: str, _: dict = Depends(require_user), db: AsyncSession = Depends(get_db)) -> dict:
    return await build_workspace_payload(slug, db)


@router.post("/scans")
async def trigger_scan(payload: dict, _: dict = Depends(require_user), db: AsyncSession = Depends(get_db)) -> dict:
    query = payload.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="query is required")
    try:
        return await create_scan(db, query=query)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Scan failed: {exc}") from exc


@router.post("/companies/{slug}/exports/json")
async def export_json(slug: str, _: dict = Depends(require_user), db: AsyncSession = Depends(get_db)) -> dict:
    workspace = await build_workspace_payload(slug, db)
    return write_json_export(slug, workspace)


@router.post("/companies/{slug}/exports/csv")
async def export_csv(slug: str, _: dict = Depends(require_user), db: AsyncSession = Depends(get_db)) -> dict:
    workspace = await build_workspace_payload(slug, db)
    return write_csv_export(slug, workspace["signals"])


@router.post("/companies/{slug}/exports/report")
async def export_report(slug: str, _: dict = Depends(require_user), db: AsyncSession = Depends(get_db)) -> dict:
    workspace = await build_workspace_payload(slug, db)
    return write_pdf_report(slug, workspace)


@router.post("/companies/{slug}/exports/report-html")
async def export_report_html(slug: str, _: dict = Depends(require_user), db: AsyncSession = Depends(get_db)) -> dict:
    workspace = await build_workspace_payload(slug, db)
    html = f"""
    <html>
      <head><title>{workspace['company']['name']} MarketScan Report</title></head>
      <body style="font-family:Arial,sans-serif;padding:40px;line-height:1.5;">
        <h1>{workspace['company']['name']} MarketScan 360 Report</h1>
        <p>{workspace['company']['summary']}</p>
        <h2>Top Gaps</h2>
        <ul>
          {''.join(f"<li>{gap['label']} - {gap['score']} ({gap['benchmark']})</li>" for gap in workspace['gaps'])}
        </ul>
        <h2>Platform Sources</h2>
        <ul>
          {''.join(f"<li><a href='{link['url']}'>{link['label']}</a> - {link['sourceKind']}</li>" for link in workspace['platformLinks'])}
        </ul>
      </body>
    </html>
    """
    return write_report_file(slug, html)
