from __future__ import annotations

import hashlib
from urllib.parse import urlparse

from slugify import slugify


def _score(seed: str, start: int, spread: int) -> int:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    return start + (int(digest[:8], 16) % spread)


def _normalize(query: str) -> tuple[str, str]:
    raw = query.strip()
    if not raw:
        raw = "Example Company"
    if "://" not in raw and "." in raw and " " not in raw:
        raw = f"https://{raw}"
    if "://" in raw:
        parsed = urlparse(raw)
        domain = parsed.netloc.lower().replace("www.", "")
        company_name = domain.split(".")[0].replace("-", " ").replace("_", " ").title()
        return company_name, domain
    return raw.title(), f"{slugify(raw)}.com"


def build_seed(query: str) -> dict:
    company_name, domain = _normalize(query)
    slug = slugify(company_name)
    opportunity = _score(f"{slug}-opportunity", 58, 33)
    health = _score(f"{slug}-health", 44, 29)
    signal_total = _score(f"{slug}-signals", 240, 1800)
    industry = "B2B SaaS / Market Research"
    headquarters = "Global / Remote-first"

    platforms = [
        ("linkedin", "LinkedIn company page", f"https://www.linkedin.com/search/results/companies/?keywords={company_name}", "official"),
        ("reddit", "Reddit search", f"https://www.reddit.com/search/?q={company_name}", "community"),
        ("twitter", "Twitter / X search", f"https://twitter.com/search?q={company_name}", "public-search"),
        ("g2", "G2 category/review search", f"https://www.g2.com/search?query={company_name}", "review"),
        ("capterra", "Capterra search", f"https://www.capterra.com/search/?query={company_name}", "review"),
        ("trustradius", "TrustRadius search", f"https://www.trustradius.com/search?q={company_name}", "review"),
    ]

    platform_links = []
    for index, (platform, label, url, source_kind) in enumerate(platforms, start=1):
        count = _score(f"{slug}-{platform}", 8 * index, 110)
        sentiment_base = ((_score(f"{slug}-{platform}-sent", 0, 200) - 100) / 100)
        platform_links.append(
            {
                "platform": platform,
                "label": label,
                "url": url,
                "source_kind": source_kind,
                "note": f"{company_name} source trail collected from {label.lower()} for background R&D.",
                "signal_count": count,
                "sentiment_score": round(sentiment_base, 2),
            }
        )

    signals = [
        {
            "platform": "linkedin",
            "source_label": "LinkedIn public activity",
            "source_url": platform_links[0]["url"],
            "signal_type": "post",
            "sentiment": "positive" if opportunity > 72 else "mixed",
            "sentiment_score": 0.36,
            "author_handle": company_name,
            "title": f"{company_name} positioning signals",
            "content": f"Public positioning suggests {company_name} is leaning into growth, expansion, and clearer product storytelling.",
            "engagement_count": _score(f"{slug}-engagement-1", 40, 800),
            "tags": ["positioning", "growth", slug],
            "published_label": "1d ago",
        },
        {
            "platform": "reddit",
            "source_label": "Community feedback threads",
            "source_url": platform_links[1]["url"],
            "signal_type": "thread",
            "sentiment": "negative" if health < 60 else "mixed",
            "sentiment_score": -0.34,
            "author_handle": f"u/{slug}-watch",
            "title": f"Customer friction around {company_name}",
            "content": f"Users are comparing {company_name} against category alternatives and calling out friction in onboarding, reporting, or support responsiveness.",
            "engagement_count": _score(f"{slug}-engagement-2", 20, 640),
            "tags": ["feedback", "reviews", "community"],
            "published_label": "7h ago",
        },
        {
            "platform": "g2",
            "source_label": "Review platform summaries",
            "source_url": platform_links[3]["url"],
            "signal_type": "review",
            "sentiment": "mixed",
            "sentiment_score": 0.04,
            "author_handle": "Verified reviewer",
            "title": f"{company_name} review cluster",
            "content": f"Review language shows that {company_name} has promise, but gaps remain around proof, workflow depth, or perceived ROI versus competitors.",
            "engagement_count": _score(f"{slug}-engagement-3", 12, 260),
            "tags": ["reviews", "roi", "comparison"],
            "published_label": "3d ago",
        },
    ]

    gaps = [
        {"label": "Messaging clarity", "score": _score(f"{slug}-gap1", 35, 45), "benchmark": "vs top competitor set", "tone": "warning"},
        {"label": "Review trust", "score": _score(f"{slug}-gap2", 28, 44), "benchmark": "vs review leaders", "tone": "critical"},
        {"label": "Social proof", "score": _score(f"{slug}-gap3", 40, 38), "benchmark": "vs category average", "tone": "warning"},
        {"label": "Feature narrative", "score": _score(f"{slug}-gap4", 46, 32), "benchmark": "vs benchmark SaaS", "tone": "positive"},
    ]

    promo_ideas = [
        {
            "title": f"{company_name} review trust rebuild",
            "priority": "high",
            "rationale": f"Review and forum sources imply that {company_name} needs stronger proof and customer language to convert evaluation-stage visitors.",
            "opening_line": f"We found a trust gap around how {company_name} is being discussed in public review channels.",
        },
        {
            "title": f"{company_name} competitive repositioning sprint",
            "priority": "critical" if opportunity > 74 else "high",
            "rationale": f"Public messaging leaves room for a sharper angle against alternatives in the same space.",
            "opening_line": f"There is a clear chance to reposition {company_name} against better-known rivals using evidence already visible in public channels.",
        },
    ]

    competitors = [
        {"name": f"{company_name} Alternative One", "domain": f"{slug}-alt-one.com", "benchmark_score": _score(f"{slug}-comp1", 62, 23), "strengths": ["positioning", "reviews"]},
        {"name": f"{company_name} Alternative Two", "domain": f"{slug}-alt-two.com", "benchmark_score": _score(f"{slug}-comp2", 66, 20), "strengths": ["social proof", "clarity"]},
        {"name": f"{company_name} Alternative Three", "domain": f"{slug}-alt-three.com", "benchmark_score": _score(f"{slug}-comp3", 70, 16), "strengths": ["category authority", "distribution"]},
    ]

    workflow = [
        {"id": "company-intel", "label": "Company intel", "status": "done"},
        {"id": "web-social-crawl", "label": "Web + social crawl", "status": "done"},
        {"id": "review-aggregation", "label": "Review aggregation", "status": "done"},
        {"id": "gap-analysis", "label": "Gap analysis", "status": "done"},
        {"id": "competitor-bench", "label": "Competitor bench", "status": "done"},
        {"id": "promo-generation", "label": "Promo generation", "status": "active"},
        {"id": "pdf-report", "label": "Report export", "status": "idle"},
    ]

    return {
        "company": {
            "name": company_name,
            "slug": slug,
            "domain": domain,
            "industry": industry,
            "headquarters": headquarters,
            "founded_year": 2018,
            "summary": f"Background R&D workspace for {company_name}, combining platform signals, comment provenance, competitor patterns, and AI-assisted scoring.",
            "opportunity_score": opportunity,
            "health_score": health,
            "tags": [industry.split("/")[0].strip(), "Research", "AI scoring", "Source-tracked"],
            "products": [
                {"name": f"{company_name} Core Platform", "category": "Primary offer", "angle": "Clarify market fit and buyer proof"},
                {"name": f"{company_name} Growth Narrative", "category": "Messaging", "angle": "Strengthen positioning against alternatives"},
            ],
        },
        "platform_links": platform_links,
        "workflow": workflow,
        "signals": signals,
        "gaps": gaps,
        "promo_ideas": promo_ideas,
        "competitors": competitors,
        "stats": [
            {"label": "Signals collected", "value": f"{signal_total}", "delta": "Auto-built from public-source templates", "tone": "positive"},
            {"label": "Review confidence", "value": f"{_score(f'{slug}-review', 54, 22)}%", "delta": "Confidence from source coverage", "tone": "neutral"},
            {"label": "Platforms mapped", "value": str(len(platform_links)), "delta": "Source links included", "tone": "positive"},
            {"label": "R&D opportunities", "value": str(len(promo_ideas)), "delta": "Ready for deeper research", "tone": "warning"},
        ],
        "hashtags": [f"#{slug.replace('-', '')}", "#marketresearch", "#customerfeedback", "#competitorintel"],
    }
