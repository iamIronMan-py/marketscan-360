from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from app.core.config import settings


def _ensure_directory(root: Path) -> Path:
    root.mkdir(parents=True, exist_ok=True)
    return root


def write_json_export(company_slug: str, payload: dict[str, Any]) -> dict[str, Any]:
    export_root = _ensure_directory(settings.export_root)
    file_path = export_root / f"{company_slug}_marketscan.json"
    file_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return _artifact(file_path, "json")


def write_csv_export(company_slug: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
    export_root = _ensure_directory(settings.export_root)
    file_path = export_root / f"{company_slug}_signals.csv"
    with file_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["platform", "source_label", "title", "sentiment", "engagement_count", "source_url"])
        writer.writeheader()
        writer.writerows(rows)
    return _artifact(file_path, "csv")


def write_report_file(company_slug: str, report_html: str) -> dict[str, Any]:
    report_root = _ensure_directory(settings.report_root)
    file_path = report_root / f"{company_slug}_report.html"
    file_path.write_text(report_html, encoding="utf-8")
    return _artifact(file_path, "html")


def write_pdf_report(company_slug: str, workspace: dict[str, Any]) -> dict[str, Any]:
    report_root = _ensure_directory(settings.report_root)
    file_path = report_root / f"{company_slug}_report.pdf"

    pdf = canvas.Canvas(str(file_path), pagesize=A4)
    width, height = A4
    y = height - 50

    def line(text: str, font: str = "Helvetica", size: int = 11, gap: int = 16):
        nonlocal y
        if y < 70:
            pdf.showPage()
            y = height - 50
        pdf.setFont(font, size)
        pdf.drawString(40, y, text[:110])
        y -= gap

    line(f"MarketScan 360 Report - {workspace['company']['name']}", "Helvetica-Bold", 18, 24)
    line(f"Domain: {workspace['company']['domain']}")
    line(f"Industry: {workspace['company']['industry']}")
    line(f"Summary: {workspace['company']['summary']}", gap=22)
    line("Top Gaps", "Helvetica-Bold", 14, 20)
    for gap in workspace["gaps"]:
        line(f"- {gap['label']}: {gap['score']} ({gap['benchmark']})")
    line("Promo Ideas", "Helvetica-Bold", 14, 20)
    for idea in workspace["promoIdeas"]:
        line(f"- {idea['title']}: {idea['rationale']}")
    line("Source Links", "Helvetica-Bold", 14, 20)
    for link in workspace["platformLinks"]:
        line(f"- {link['label']}: {link['url']}")

    pdf.save()
    return _artifact(file_path, "pdf")


def _artifact(path: Path, file_type: str) -> dict[str, Any]:
    stats = path.stat()
    return {
        "fileName": path.name,
        "filePath": str(path.resolve()),
        "fileType": file_type,
        "fileSize": stats.st_size,
    }
