from __future__ import annotations

import re
from collections import deque
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
from slugify import slugify
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer


USER_AGENT = "MarketScan360Bot/1.0 (+https://localhost)"
sentiment_analyzer = SentimentIntensityAnalyzer()


def canonicalize_url(url: str) -> str:
    parsed = urlparse(url)
    scheme = parsed.scheme or "https"
    netloc = parsed.netloc.lower()
    path = parsed.path or "/"
    if path != "/":
        path = path.rstrip("/")
    return f"{scheme}://{netloc}{path}"


def normalize_query(query: str) -> dict[str, str]:
    raw = query.strip()
    if not raw:
        raise ValueError("Company or domain is required")
    if "://" not in raw and "." in raw and " " not in raw:
        raw = f"https://{raw}"
    if "://" in raw:
        parsed = urlparse(raw)
        domain = parsed.netloc.lower().replace("www.", "")
        name = domain.split(".")[0].replace("-", " ").replace("_", " ").title()
        return {"name": name, "domain": domain, "url": canonicalize_url(f"https://{domain}")}
    slug = slugify(raw)
    return {"name": raw.title(), "domain": f"{slug}.com", "url": f"https://{slug}.com"}


async def fetch_html(url: str) -> str:
    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=20.0,
        headers={"User-Agent": USER_AGENT},
    ) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.text


def extract_internal_links(base_url: str, soup: BeautifulSoup) -> list[dict[str, str]]:
    links: list[dict[str, str]] = []
    seen: set[str] = set()
    keywords = ("about", "pricing", "product", "products", "solutions", "features", "case", "customers", "blog", "contact")
    base_domain = urlparse(base_url).netloc

    for anchor in soup.find_all("a", href=True):
        href = canonicalize_url(urljoin(base_url, anchor["href"]))
        parsed = urlparse(href)
        if parsed.netloc != base_domain:
            continue
        if href in seen:
            continue
        text = anchor.get_text(" ", strip=True)
        path = parsed.path.lower()
        if not any(keyword in path or keyword in text.lower() for keyword in keywords):
            continue
        seen.add(href)
        links.append({"title": text or parsed.path.strip("/") or "Page", "url": href})
        if len(links) >= 24:
            break
    return links


def extract_social_links(base_url: str, soup: BeautifulSoup) -> list[dict[str, str]]:
    social_domains = {
        "linkedin.com": "linkedin",
        "instagram.com": "instagram",
        "twitter.com": "twitter",
        "x.com": "twitter",
        "youtube.com": "youtube",
        "facebook.com": "facebook",
        "tiktok.com": "tiktok",
    }
    items: list[dict[str, str]] = []
    seen: set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = canonicalize_url(urljoin(base_url, anchor["href"]))
        parsed = urlparse(href)
        host = parsed.netloc.lower().replace("www.", "")
        for domain, platform in social_domains.items():
            if domain in host and href not in seen:
                seen.add(href)
                items.append(
                    {
                        "platform": platform,
                        "label": anchor.get_text(" ", strip=True) or platform.title(),
                        "url": href,
                    }
                )
    return items


def parse_page(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.get_text(strip=True) if soup.title else ""
    meta = ""
    meta_tag = soup.find("meta", attrs={"name": "description"})
    if meta_tag and meta_tag.get("content"):
        meta = meta_tag["content"].strip()
    headings = [node.get_text(" ", strip=True) for node in soup.find_all(["h1", "h2", "h3"])[:15] if node.get_text(strip=True)]
    paragraphs = [node.get_text(" ", strip=True) for node in soup.find_all("p")[:20] if node.get_text(strip=True)]
    ctas = [node.get_text(" ", strip=True) for node in soup.find_all(["button", "a"])[:30] if node.get_text(strip=True)]
    return {
        "url": url,
        "title": title,
        "metaDescription": meta,
        "headings": headings,
        "paragraphs": paragraphs,
        "ctas": ctas[:8],
        "internalLinks": extract_internal_links(url, soup),
        "socialLinks": extract_social_links(url, soup),
    }


def page_display_title(page: dict) -> str:
    parsed = urlparse(page["url"])
    path = parsed.path.strip("/")
    if not path:
        return f"{page['title'] or parsed.netloc} [home]"
    short_path = path.replace("/", " / ")
    base = page["title"] or parsed.netloc
    return f"{base} [{short_path}]"


def classify_sentiment(text: str) -> tuple[str, float]:
    score = sentiment_analyzer.polarity_scores(text).get("compound", 0.0)
    if score >= 0.2:
        return "positive", score
    if score <= -0.2:
        return "negative", score
    return "mixed", score


def dedupe_links(items: list[dict]) -> list[dict]:
    deduped: list[dict] = []
    seen: set[str] = set()
    for item in items:
        key = canonicalize_url(item["url"])
        if key in seen:
            continue
        seen.add(key)
        item["url"] = key
        deduped.append(item)
    return deduped


async def collect_social_profile_snapshots(profiles: list[dict[str, str]]) -> list[dict]:
    snapshots: list[dict] = []
    for profile in profiles[:5]:
        try:
            html = await fetch_html(profile["url"])
        except Exception:
            continue
        soup = BeautifulSoup(html, "html.parser")
        title = soup.title.get_text(" ", strip=True) if soup.title else profile["label"]
        meta_tag = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        description = meta_tag.get("content", "").strip() if meta_tag and meta_tag.get("content") else ""
        snippet_nodes = [node.get_text(" ", strip=True) for node in soup.find_all(["h1", "h2", "span", "p"])[:40]]
        snippets = [item for item in snippet_nodes if item and len(item.split()) > 2][:10]
        combined = " ".join([description] + snippets).strip()
        sentiment, score = classify_sentiment(combined or title)
        snapshots.append(
            {
                "platform": profile["platform"],
                "url": profile["url"],
                "title": title,
                "description": description,
                "snippets": snippets,
                "sentiment": sentiment,
                "sentimentScore": round(score, 3),
            }
        )
    return snapshots


def infer_products(page_bundle: list[dict], company_name: str) -> list[dict]:
    candidates: list[str] = []
    for page in page_bundle:
        for heading in page["headings"]:
            if 2 <= len(heading.split()) <= 6 and company_name.lower() not in heading.lower():
                candidates.append(heading)
    deduped: list[str] = []
    seen: set[str] = set()
    for item in candidates:
        key = item.lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
        if len(deduped) >= 4:
            break
    if not deduped:
        deduped = [f"{company_name} Core Platform", f"{company_name} Services"]
    return [{"name": item, "category": "Website extracted", "angle": "Clarify offer and buyer outcome"} for item in deduped]


def analyze_site(company: dict, pages: list[dict]) -> dict:
    combined_text = " ".join(
        " ".join(page["headings"] + page["paragraphs"] + page["ctas"])
        for page in pages
    ).lower()

    has_pricing = "pricing" in combined_text
    has_demo = "demo" in combined_text or "book a demo" in combined_text
    has_customer_proof = any(word in combined_text for word in ["customer", "case study", "testimonial", "trusted by"])
    has_ai = "ai" in combined_text or "artificial intelligence" in combined_text
    has_integrations = any(word in combined_text for word in ["integration", "api", "connect", "workflow"])
    has_contact = any(word in combined_text for word in ["contact", "talk to sales", "book a call", "get in touch"])
    social_profiles = []
    for page in pages:
        social_profiles.extend(page.get("socialLinks", []))
    dedup_social = []
    seen_social = set()
    for item in social_profiles:
        if item["url"] in seen_social:
            continue
        seen_social.add(item["url"])
        dedup_social.append(item)

    opportunity_score = 50
    opportunity_score += 8 if has_demo else 0
    opportunity_score += 10 if has_customer_proof else -8
    opportunity_score += 8 if has_ai else 0
    opportunity_score += 6 if has_integrations else -4
    opportunity_score += 6 if has_pricing else -6
    opportunity_score = max(35, min(92, opportunity_score))

    health_score = 48
    health_score += 10 if len(pages) >= 3 else -6
    health_score += 10 if has_customer_proof else -10
    health_score += 8 if has_pricing else -6
    health_score += 6 if has_demo else -4
    health_score += 6 if has_contact else -3
    health_score = max(30, min(90, health_score))

    gaps = [
        {
            "label": "Messaging clarity",
            "score": 78 if len(pages[0]["headings"]) >= 3 else 52,
            "benchmark": "Website headline and solution articulation",
            "tone": "positive" if len(pages[0]["headings"]) >= 3 else "warning",
        },
        {
            "label": "Buyer proof",
            "score": 80 if has_customer_proof else 38,
            "benchmark": "Case studies, testimonials, trust banners",
            "tone": "positive" if has_customer_proof else "critical",
        },
        {
            "label": "Pricing transparency",
            "score": 82 if has_pricing else 34,
            "benchmark": "Pricing page or pricing cues",
            "tone": "positive" if has_pricing else "critical",
        },
        {
            "label": "AI positioning",
            "score": 74 if has_ai else 42,
            "benchmark": "Clear AI narrative in website copy",
            "tone": "positive" if has_ai else "warning",
        },
        {
            "label": "Contact conversion path",
            "score": 76 if has_contact else 39,
            "benchmark": "Visible contact/demo path",
            "tone": "positive" if has_contact else "warning",
        },
    ]

    promo_ideas = [
        {
            "title": "Proof-driven outbound angle",
            "priority": "critical" if not has_customer_proof else "high",
            "rationale": "Website trust signals are weak or underplayed. Agencies can pitch customer proof systems, case-study packaging, and landing-page conversion work.",
            "openingLine": f"We found a trust and proof gap in how {company['name']} presents itself publicly.",
        },
        {
            "title": "Positioning refinement sprint",
            "priority": "high",
            "rationale": "The current website can be used to sharpen buyer messaging, category language, and product discovery.",
            "openingLine": f"There is a clear chance to make {company['name']} easier to understand for prospects comparing alternatives.",
        },
    ]

    homepage_sentiment, homepage_sentiment_score = classify_sentiment(
        " ".join(pages[0]["headings"] + pages[0]["paragraphs"][:6]) or company["name"]
    )
    conversion_text = " ".join(
        text
        for page in pages[:4]
        for text in (page["ctas"] + page["headings"])
    )
    conversion_sentiment, conversion_sentiment_score = classify_sentiment(conversion_text or "conversion path")

    signals = [
        {
            "platform": "website",
            "source_label": "Homepage content",
            "source_url": company["url"],
            "signal_type": "site_page",
            "sentiment": homepage_sentiment,
            "sentiment_score": round(homepage_sentiment_score, 3),
            "author_handle": company["name"],
            "title": "Website messaging snapshot",
            "content": pages[0]["metaDescription"] or "Homepage copy reviewed for positioning, trust, and conversion signals.",
            "engagement_count": 0,
            "tags": ["website", "positioning", "messaging"],
            "published_label": "Current crawl",
        },
        {
            "platform": "website",
            "source_label": "Navigation and solution pages",
            "source_url": pages[1]["url"] if len(pages) > 1 else company["url"],
            "signal_type": "site_page",
            "sentiment": "negative" if not has_pricing else conversion_sentiment,
            "sentiment_score": -0.18 if not has_pricing else round(conversion_sentiment_score, 3),
            "author_handle": company["name"],
            "title": "Conversion friction review",
            "content": "Audit of pricing visibility, proof, and demo/contact paths based on the current website structure.",
            "engagement_count": 0,
            "tags": ["pricing", "demo", "conversion"],
            "published_label": "Current crawl",
        },
    ]
    if dedup_social:
        for item in dedup_social[:4]:
            signals.append(
                {
                    "platform": item["platform"],
                    "source_label": "Social profile found on website",
                    "source_url": item["url"],
                    "signal_type": "social_profile",
                    "sentiment": "neutral",
                    "sentiment_score": 0.0,
                    "author_handle": company["name"],
                    "title": f"{item['platform'].title()} profile linked",
                    "content": f"{item['platform'].title()} profile was found directly from the company website. Posts/comments still require platform-specific collectors.",
                    "engagement_count": 0,
                    "tags": [item["platform"], "profile"],
                    "published_label": "Current crawl",
                }
            )

    research_details = {
        "pages": [
            {
                "title": page_display_title(page),
                "url": page["url"],
                "metaDescription": page["metaDescription"],
                "headings": page["headings"][:6],
                "ctas": page["ctas"][:5],
                "socialLinks": page.get("socialLinks", [])[:5],
            }
            for page in pages
        ],
        "opportunities": [
            "Improve public proof and trust assets" if not has_customer_proof else "Lean into existing customer proof",
            "Clarify pricing and buyer journey" if not has_pricing else "Strengthen pricing differentiation",
            "Package AI narrative more clearly" if has_ai else "Introduce a stronger innovation narrative",
        ],
        "whatWeCanDo": [
            "Audit website messaging and rewrite positioning",
            "Build a client-ready competitive benchmark",
            "Turn discovered gaps into outreach-ready pitch angles",
            "Package the findings into a PDF R&D report",
        ],
        "companyIntel": {
            "homeUrl": company["url"],
            "pagesCrawled": len(pages),
            "hasPricing": has_pricing,
            "hasDemoPath": has_demo,
            "hasCustomerProof": has_customer_proof,
            "hasAiMessaging": has_ai,
            "hasIntegrationsMessaging": has_integrations,
            "socialProfilesFound": len(dedup_social),
        },
        "socialProfiles": dedup_social,
        "analysisMode": "website-crawl + heuristic scoring",
        "limitations": [
            "Instagram, LinkedIn, Reddit, and review comments are not yet scraped live.",
            "Competitor section uses benchmark placeholders until true competitor discovery is implemented.",
        ],
    }

    stats = [
        {"label": "Pages crawled", "value": str(len(pages)), "delta": "Internal links crawled live", "tone": "positive"},
        {"label": "Products inferred", "value": str(len(infer_products(pages, company["name"]))), "delta": "Extracted from page structure", "tone": "neutral"},
        {"label": "Proof coverage", "value": "Strong" if has_customer_proof else "Weak", "delta": "Trust signal presence on site", "tone": "positive" if has_customer_proof else "warning"},
        {"label": "Social links found", "value": str(len(dedup_social)), "delta": "Profiles discovered from the website", "tone": "positive" if dedup_social else "warning"},
    ]

    return {
        "summary": f"Website-first background R&D for {company['name']} based on live crawl results and heuristic scoring.",
        "opportunityScore": opportunity_score,
        "healthScore": health_score,
        "products": infer_products(pages, company["name"]),
        "gaps": gaps,
        "promoIdeas": promo_ideas,
        "signals": signals,
        "stats": stats,
        "researchDetails": research_details,
    }


def build_source_links(pages: list[dict], social_profiles: list[dict[str, str]]) -> list[dict]:
    items = []
    for page in pages[:10]:
        items.append(
            {
                "platform": "website",
                "label": page_display_title(page),
                "url": page["url"],
                "source_kind": "scraped-page",
                "note": "Internal page crawled directly from the company website.",
                "signal_count": len(page["headings"]),
                "sentiment_score": 0.0,
            }
        )
    for profile in social_profiles:
        items.append(
            {
                "platform": profile["platform"],
                "label": f"Website-linked {profile['platform'].title()} profile",
                "url": profile["url"],
                "source_kind": "website-linked-profile",
                "note": "Profile URL discovered directly from the company website.",
                "signal_count": 0,
                "sentiment_score": 0.0,
            }
        )
    return dedupe_links(items)


def build_competitors(company_name: str, category_hint: str) -> list[dict]:
    base = slugify(company_name)
    return [
        {"name": "Mock Benchmark A", "domain": f"{base}-benchmark-a.example", "benchmark_score": 78, "strengths": ["proof", "positioning", category_hint], "source_type": "mock-benchmark"},
        {"name": "Mock Benchmark B", "domain": f"{base}-benchmark-b.example", "benchmark_score": 72, "strengths": ["pricing clarity", "social proof"], "source_type": "mock-benchmark"},
    ]


async def crawl_site(root_url: str) -> list[dict]:
    pages: list[dict] = []
    visited: set[str] = set()
    queue = deque([canonicalize_url(root_url)])

    while queue and len(pages) < 10:
        current = queue.popleft()
        current = canonicalize_url(current)
        if current in visited:
            continue
        visited.add(current)
        try:
            html = await fetch_html(current)
        except Exception:
            continue
        page = parse_page(current, html)
        pages.append(page)
        for link in page["internalLinks"]:
            if link["url"] not in visited and len(queue) < 30:
                queue.append(link["url"])
    return pages


async def run_research_scan(query: str) -> dict:
    company = normalize_query(query)
    pages = await crawl_site(company["url"])
    if not pages:
        raise ValueError("Could not fetch the company website")

    analysis = analyze_site(company, pages)
    social_profile_snapshots = await collect_social_profile_snapshots(analysis["researchDetails"]["socialProfiles"])
    for snapshot in social_profile_snapshots:
        analysis["signals"].append(
            {
                "platform": snapshot["platform"],
                "source_label": "Public profile snapshot",
                "source_url": snapshot["url"],
                "signal_type": "social_profile_page",
                "sentiment": snapshot["sentiment"],
                "sentiment_score": snapshot["sentimentScore"],
                "author_handle": company["name"],
                "title": f"{snapshot['platform'].title()} public profile analysis",
                "content": snapshot["description"] or "Public profile page fetched for sentiment and profile-context analysis.",
                "engagement_count": 0,
                "tags": [snapshot["platform"], "public-profile", "sentiment"],
                "published_label": "Current crawl",
            }
        )
    analysis["researchDetails"]["profileSnapshots"] = social_profile_snapshots
    platform_links = build_source_links(pages, analysis["researchDetails"]["socialProfiles"])
    return {
        "company": {
            "name": company["name"],
            "slug": slugify(company["name"]),
            "domain": company["domain"],
            "industry": "Website-derived B2B research",
            "headquarters": "Pending deeper enrichment",
            "founded_year": 0,
            "summary": analysis["summary"],
            "opportunity_score": analysis["opportunityScore"],
            "health_score": analysis["healthScore"],
            "tags": ["Live crawl", "Website-first", "Background R&D"],
            "products": analysis["products"],
        },
        "platform_links": platform_links,
        "workflow": [
            {"id": "company-intel", "label": "Company intel", "status": "done"},
            {"id": "web-social-crawl", "label": "Website crawl", "status": "done"},
            {"id": "review-aggregation", "label": "External source queue", "status": "active"},
            {"id": "gap-analysis", "label": "Gap analysis", "status": "done"},
            {"id": "competitor-bench", "label": "Competitor bench", "status": "active"},
            {"id": "promo-generation", "label": "Promo generation", "status": "done"},
            {"id": "pdf-report", "label": "PDF report", "status": "idle"},
        ],
        "signals": analysis["signals"],
        "gaps": analysis["gaps"],
        "promo_ideas": analysis["promoIdeas"],
        "competitors": build_competitors(company["name"], "website benchmark"),
        "stats": analysis["stats"],
        "hashtags": [f"#{slugify(company['name']).replace('-', '')}", "#websiteresearch", "#rnd"],
        "research_details": analysis["researchDetails"],
    }
