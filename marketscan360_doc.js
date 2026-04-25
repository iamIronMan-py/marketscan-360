const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  ExternalHyperlink, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

const W = 9360;
const ACCENT = "6C5CE7";
const ACCENT2 = "00CEC9";
const DARK = "0D0F14";
const MID = "2D3250";
const LIGHT_BG = "F0F2F8";
const BORDER_COLOR = "DDE1EE";
const WHITE = "FFFFFF";
const MUTED = "7A8099";
const SUCCESS = "00B894";
const WARN = "FDCB6E";
const DANGER = "E17055";
const PURPLE_LIGHT = "EDE9FF";
const TEAL_LIGHT = "E0FAFA";

function border(c = BORDER_COLOR) {
  const b = { style: BorderStyle.SINGLE, size: 1, color: c };
  return { top: b, bottom: b, left: b, right: b };
}
function noBorder() {
  const b = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  return { top: b, bottom: b, left: b, right: b };
}
function cell(children, opts = {}) {
  return new TableCell({
    borders: opts.borders || border(),
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opts.span,
    children,
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, font: "Inter", size: 36, bold: true, color: DARK })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 340, after: 120 },
    children: [new TextRun({ text, font: "Inter", size: 26, bold: true, color: MID })]
  });
}
function h3(text) {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, font: "Inter", size: 22, bold: true, color: ACCENT })]
  });
}
function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: "Inter", size: 20, color: opts.color || "3D3D3D", bold: opts.bold, italics: opts.italic })]
  });
}
function mono(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 360 },
    children: [new TextRun({ text, font: "Courier New", size: 18, color: ACCENT })]
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Inter", size: 20, color: "3D3D3D" })]
  });
}
function subbullet(text) { return bullet(text, 1); }
function spacer(sz = 160) {
  return new Paragraph({ spacing: { before: sz, after: 0 }, children: [new TextRun("")] });
}
function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR } },
    children: [new TextRun("")]
  });
}
function labelPill(text, fill, color) {
  return new Table({
    width: { size: 1400, type: WidthType.DXA },
    rows: [new TableRow({ children: [cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, font: "Inter", size: 16, bold: true, color })] })], { fill, borders: noBorder() })] })],
  });
}
function accentBox(children) {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [new TableRow({ children: [cell(children, { fill: PURPLE_LIGHT, borders: border(ACCENT) })] })]
  });
}
function tealBox(children) {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [new TableRow({ children: [cell(children, { fill: TEAL_LIGHT, borders: border(ACCENT2) })] })]
  });
}
function infoRow(label, value) {
  return new TableRow({
    children: [
      cell([new Paragraph({ children: [new TextRun({ text: label, font: "Inter", size: 18, bold: true, color: MID })] })], { fill: LIGHT_BG, width: 2200 }),
      cell([new Paragraph({ children: [new TextRun({ text: value, font: "Inter", size: 18, color: "3D3D3D" })] })], { width: W - 2200 }),
    ]
  });
}
function sectionHeader(num, title, subtitle) {
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [new TableRow({
      children: [
        cell([
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: num, font: "Inter", size: 28, bold: true, color: WHITE })] }),
        ], { fill: ACCENT, borders: noBorder(), width: 800 }),
        cell([
          new Paragraph({ children: [new TextRun({ text: title, font: "Inter", size: 28, bold: true, color: WHITE })] }),
          new Paragraph({ children: [new TextRun({ text: subtitle, font: "Inter", size: 18, color: "CCCCff" })] }),
        ], { fill: MID, borders: noBorder(), width: W - 800 }),
      ]
    })]
  });
}
function featureRow(icon, name, desc, priority) {
  const pColor = priority === "Critical" ? DANGER : priority === "High" ? WARN : SUCCESS;
  return new TableRow({
    children: [
      cell([body(icon)], { fill: LIGHT_BG, width: 440 }),
      cell([body(name, { bold: true })], { width: 2000 }),
      cell([body(desc)], { width: 5120 }),
      cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: priority, font: "Inter", size: 16, bold: true, color: pColor })] })], { width: 1800 }),
    ]
  });
}
function techRow(layer, tech, why) {
  return new TableRow({
    children: [
      cell([body(layer, { bold: true, color: ACCENT })], { fill: PURPLE_LIGHT, width: 1800 }),
      cell([body(tech)], { width: 2800 }),
      cell([body(why)], { width: 4760 }),
    ]
  });
}
function apiRow(method, endpoint, desc, auth) {
  const mColor = method === "GET" ? SUCCESS : method === "POST" ? ACCENT : WARN;
  return new TableRow({
    children: [
      cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: method, font: "Courier New", size: 16, bold: true, color: mColor })] })], { fill: LIGHT_BG, width: 900 }),
      cell([new Paragraph({ children: [new TextRun({ text: endpoint, font: "Courier New", size: 17, color: ACCENT })] })], { width: 2800 }),
      cell([body(desc)], { width: 4060 }),
      cell([body(auth, { color: MUTED })], { width: 1600 }),
    ]
  });
}
function dbRow(col, type, desc) {
  return new TableRow({
    children: [
      cell([new Paragraph({ children: [new TextRun({ text: col, font: "Courier New", size: 17, bold: true, color: ACCENT })] })], { fill: LIGHT_BG, width: 1800 }),
      cell([new Paragraph({ children: [new TextRun({ text: type, font: "Courier New", size: 17, color: ACCENT2 })] })], { width: 1800 }),
      cell([body(desc)], { width: 5760 }),
    ]
  });
}
function tableHeader(...labels) {
  return new TableRow({
    tableHeader: true,
    children: labels.map(([lbl, w]) => cell([new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: lbl, font: "Inter", size: 18, bold: true, color: WHITE })] })], { fill: MID, width: w }))
  });
}

const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 280 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 800, hanging: 280 } } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 280 } } } },
      ]},
    ]
  },
  styles: {
    default: { document: { run: { font: "Inter", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 36, bold: true, font: "Inter", color: DARK }, paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Inter", color: MID }, paragraph: { spacing: { before: 340, after: 120 }, outlineLevel: 1 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 }
      }
    },
    headers: {
      default: new Header({
        children: [new Table({
          width: { size: W, type: WidthType.DXA },
          rows: [new TableRow({ children: [
            cell([new Paragraph({ children: [new TextRun({ text: "MarketScan 360  —  Codex Implementation Master", font: "Inter", size: 16, color: MUTED })] })], { borders: noBorder(), width: 7000 }),
            cell([new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Confidential  |  v1.0  |  2026", font: "Inter", size: 16, color: MUTED })] })], { borders: noBorder(), width: 2360 }),
          ]})]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Table({
          width: { size: W, type: WidthType.DXA },
          rows: [new TableRow({ children: [
            cell([new Paragraph({ children: [new TextRun({ text: "B2B Sales Intelligence Platform  |  React + FastAPI + PostgreSQL + Claude AI", font: "Inter", size: 16, color: MUTED })] })], { borders: noBorder(), width: 7000 }),
            cell([new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Page ", font: "Inter", size: 16, color: MUTED }), new PageNumber()] })], { borders: noBorder(), width: 2360 }),
          ]})]
        })]
      })
    },
    children: [

      // ─────────────────────────────────────────────
      // COVER PAGE
      // ─────────────────────────────────────────────
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [new TableRow({ children: [cell([
          spacer(600),
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "M3", font: "Inter", size: 80, bold: true, color: WHITE })] }),
        ], { fill: ACCENT, borders: noBorder() })] })]
      }),
      spacer(200),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 }, children: [new TextRun({ text: "MarketScan 360", font: "Inter", size: 64, bold: true, color: DARK })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 40 }, children: [new TextRun({ text: "Codex Implementation Master Document", font: "Inter", size: 28, color: MUTED })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }, children: [new TextRun({ text: "AI-Powered B2B Sales Intelligence Platform", font: "Inter", size: 22, bold: true, color: ACCENT2 })] }),
      divider(),
      spacer(120),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          infoRow("Stack", "React 18  |  FastAPI (Python 3.12)  |  PostgreSQL 16  |  Claude AI (Free Tier)"),
          infoRow("Architecture", "Monorepo  |  REST API  |  WebSocket live feed  |  Local PDF export"),
          infoRow("Version", "1.0  —  April 2026"),
          infoRow("Prepared for", "Codex AI Development Agent"),
          infoRow("Document scope", "10 sections  |  Full frontend + backend + DB + AI pipeline"),
        ]
      }),
      spacer(200),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [new TableRow({ children: [
          cell([
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "React + Vite", font: "Inter", size: 18, bold: true, color: ACCENT })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Frontend", font: "Inter", size: 16, color: MUTED })] }),
          ], { fill: PURPLE_LIGHT, borders: border(ACCENT), width: 2340 }),
          cell([
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "FastAPI", font: "Inter", size: 18, bold: true, color: ACCENT2 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Backend", font: "Inter", size: 16, color: MUTED })] }),
          ], { fill: TEAL_LIGHT, borders: border(ACCENT2), width: 2340 }),
          cell([
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PostgreSQL", font: "Inter", size: 18, bold: true, color: "185FA5" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Database", font: "Inter", size: 16, color: MUTED })] }),
          ], { fill: "E6F1FB", borders: border("185FA5"), width: 2340 }),
          cell([
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Claude AI", font: "Inter", size: 18, bold: true, color: DANGER })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Intelligence", font: "Inter", size: 16, color: MUTED })] }),
          ], { fill: "FFF0EE", borders: border(DANGER), width: 2340 }),
        ]})]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────────────
      // SEC 1 — PRODUCT VISION
      // ─────────────────────────────────────────────
      sectionHeader("01", "Product Vision & Feature Map", "What MarketScan 360 does and why it exists"),
      spacer(160),
      h2("1.1  What is MarketScan 360?"),
      body("MarketScan 360 is a full-stack B2B sales intelligence platform built for agencies, freelancers, and growth consultants who need to pitch clients with data, not guesses. You give it a company name or domain. It crawls their website, scrapes every major social and review platform, aggregates sentiment and signals, identifies product gaps against competitors, and produces a client-ready PDF pitch report — all in one automated flow."),
      spacer(80),
      h2("1.2  Core Feature Map"),
      spacer(80),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Icon", 440], ["Feature", 2000], ["Description", 5120], ["Priority", 1800]),
          featureRow("🔍", "Company Intel Scraper", "Extracts company overview, founding year, industry, headcount, tech stack, funding from website + LinkedIn.", "Critical"),
          featureRow("🌐", "Web Crawler", "Full sitemap crawl — homepage, about, blog, pricing, changelog, careers — for messaging and product cues.", "Critical"),
          featureRow("📡", "Social Media Aggregator", "Twitter/X, LinkedIn, Reddit, Instagram, YouTube — posts, comments, hashtags, engagement metrics.", "Critical"),
          featureRow("⭐", "Review Aggregator", "G2, Capterra, Trustradius, AppSumo, Product Hunt — star ratings, themes, NPS proxy, verbatim quotes.", "Critical"),
          featureRow("🧠", "AI Need Analysis", "Claude AI synthesizes all signals into a structured needs assessment: what the company is struggling with.", "Critical"),
          featureRow("📊", "Product Gap Detector", "Scores the target vs 5 competitor benchmarks across 10 dimensions. Visual radar chart.", "High"),
          featureRow("🏆", "Competitor Benchmarker", "Auto-discovers and compares top 5 competitors by feature set, pricing, sentiment, and messaging.", "High"),
          featureRow("💡", "Promo Angle Generator", "Claude generates 3–5 tailored pitch angles specific to the target company's gaps.", "High"),
          featureRow("📄", "PDF Report Engine", "Client-ready branded report saved locally — company overview, signals, gaps, pitches, competitor grid.", "Critical"),
          featureRow("💾", "Local Save System", "Save reports as PDF, JSON, or CSV to user's local machine. No cloud required.", "High"),
          featureRow("🔴", "Live Signal Feed", "WebSocket-based real-time feed showing new signals as they arrive during a scan.", "Medium"),
          featureRow("🌙", "Dark / Light Mode", "Full theme toggle persisted in localStorage. Unique typography and color system.", "High"),
        ]
      }),
      spacer(80),
      h2("1.3  Target Users"),
      bullet("Freelance growth consultants pitching new clients"),
      bullet("Digital agencies building outbound sales pipelines"),
      bullet("B2B SaaS companies doing competitive research"),
      bullet("Marketing strategists building data-backed proposals"),
      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────────────
      // SEC 2 — DESIGN SYSTEM
      // ─────────────────────────────────────────────
      sectionHeader("02", "UI Design System & Theme Specification", "Unique typography, color tokens, spacing, and component rules"),
      spacer(160),
      h2("2.1  Design Philosophy"),
      body("The UI must feel unlike any SaaS tool the user has seen before. No Tailwind default aesthetics, no Bootstrap grids, no generic card patterns. The inspiration is a cross between a dark Bloomberg terminal, a cyberpunk data console, and editorial magazine typography. Every element is intentional."),
      spacer(80),
      accentBox([
        new Paragraph({ children: [new TextRun({ text: "Design Pillars:", font: "Inter", size: 20, bold: true, color: ACCENT })] }),
        bullet("Obsidian dark theme as default — deep blacks, not navy blues"),
        bullet("Geometric sans-serif for data. Condensed display font for headings"),
        bullet("Monospace readouts for all numbers and live metrics"),
        bullet("Micro-borders — 1px max, never thick cards"),
        bullet("Color used only for meaning — not decoration"),
        bullet("Motion only where it adds information — scan pulse, live dot flicker"),
      ]),
      spacer(120),
      h2("2.2  Typography Stack"),
      spacer(80),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Role", 1800], ["Font", 2200], ["Weight / Size", 2200], ["Usage", 3160]),
          new TableRow({ children: [
            cell([body("Display / Hero", { bold: true, color: ACCENT })], { fill: PURPLE_LIGHT, width: 1800 }),
            cell([new Paragraph({ children: [new TextRun({ text: "Space Grotesk", font: "Courier New", size: 18, color: DARK })] })], { width: 2200 }),
            cell([body("700 / 48–72px")], { width: 2200 }),
            cell([body("Page titles, company names in hero cards, scan headings")], { width: 3160 }),
          ]}),
          new TableRow({ children: [
            cell([body("UI Labels / Nav", { bold: true, color: ACCENT })], { fill: PURPLE_LIGHT, width: 1800 }),
            cell([new Paragraph({ children: [new TextRun({ text: "DM Sans", font: "Courier New", size: 18, color: DARK })] })], { width: 2200 }),
            cell([body("400/500 / 11–14px")], { width: 2200 }),
            cell([body("Sidebar items, table headers, badges, nav labels, tooltips")], { width: 3160 }),
          ]}),
          new TableRow({ children: [
            cell([body("Body / Descriptions", { bold: true, color: ACCENT })], { fill: PURPLE_LIGHT, width: 1800 }),
            cell([new Paragraph({ children: [new TextRun({ text: "Inter", font: "Courier New", size: 18, color: DARK })] })], { width: 2200 }),
            cell([body("400 / 13–15px")], { width: 2200 }),
            cell([body("Signal feed text, report body, descriptions, panel content")], { width: 3160 }),
          ]}),
          new TableRow({ children: [
            cell([body("Metrics / Numbers", { bold: true, color: ACCENT })], { fill: PURPLE_LIGHT, width: 1800 }),
            cell([new Paragraph({ children: [new TextRun({ text: "JetBrains Mono", font: "Courier New", size: 18, color: DARK })] })], { width: 2200 }),
            cell([body("500 / 18–32px")], { width: 2200 }),
            cell([body("Score rings, stat numbers, API response readouts, timestamps")], { width: 3160 }),
          ]}),
          new TableRow({ children: [
            cell([body("Section Labels", { bold: true, color: ACCENT })], { fill: PURPLE_LIGHT, width: 1800 }),
            cell([new Paragraph({ children: [new TextRun({ text: "DM Mono", font: "Courier New", size: 18, color: DARK })] })], { width: 2200 }),
            cell([body("500 / 9–10px UPPERCASE")], { width: 2200 }),
            cell([body("Sidebar section dividers, overline labels, status indicators")], { width: 3160 }),
          ]}),
        ]
      }),
      spacer(120),
      h2("2.3  Color Token System"),
      body("All colors are CSS custom properties defined in a global tokens file. Never use raw hex values in components."),
      spacer(80),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Token", 2400], ["Dark Mode", 1800], ["Light Mode", 1800], ["Usage", 3360]),
          new TableRow({ children: [cell([body("--ms-bg", { bold: true })], { fill: LIGHT_BG, width: 2400 }), cell([new Paragraph({ children: [new TextRun({ text: "#0D0F14", font: "Courier New", size: 18, color: "888888" })] })], { fill: "0D0F14", width: 1800 }), cell([new Paragraph({ children: [new TextRun({ text: "#F0F2F8", font: "Courier New", size: 18 })] })], { fill: LIGHT_BG, width: 1800 }), cell([body("App root background")], { width: 3360 })]}),
          new TableRow({ children: [cell([body("--ms-surface", { bold: true })], { fill: LIGHT_BG, width: 2400 }), cell([new Paragraph({ children: [new TextRun({ text: "#13161E", font: "Courier New", size: 18, color: "888888" })] })], { fill: "13161E", width: 1800 }), cell([new Paragraph({ children: [new TextRun({ text: "#FFFFFF", font: "Courier New", size: 18 })] })], { fill: WHITE, width: 1800 }), cell([body("Sidebar, topbar, panel backgrounds")], { width: 3360 })]}),
          new TableRow({ children: [cell([body("--ms-card", { bold: true })], { fill: LIGHT_BG, width: 2400 }), cell([new Paragraph({ children: [new TextRun({ text: "#1A1E28", font: "Courier New", size: 18, color: "888888" })] })], { fill: "1A1E28", width: 1800 }), cell([new Paragraph({ children: [new TextRun({ text: "#F7F8FC", font: "Courier New", size: 18 })] })], { fill: "F7F8FC", width: 1800 }), cell([body("Elevated cards, platform tiles, signal items")], { width: 3360 })]}),
          new TableRow({ children: [cell([body("--ms-accent", { bold: true })], { fill: LIGHT_BG, width: 2400 }), cell([new Paragraph({ children: [new TextRun({ text: "#7C6FF7", font: "Courier New", size: 18, color: "7C6FF7" })] })], { fill: PURPLE_LIGHT, width: 1800 }), cell([new Paragraph({ children: [new TextRun({ text: "#534AB7", font: "Courier New", size: 18, color: ACCENT })] })], { fill: "EEEDFE", width: 1800 }), cell([body("Primary CTA, active nav, score rings, links, badges")], { width: 3360 })]}),
          new TableRow({ children: [cell([body("--ms-accent2", { bold: true })], { fill: LIGHT_BG, width: 2400 }), cell([new Paragraph({ children: [new TextRun({ text: "#1DD9A0", font: "Courier New", size: 18, color: "1DD9A0" })] })], { fill: "082E22", width: 1800 }), cell([new Paragraph({ children: [new TextRun({ text: "#0F8A63", font: "Courier New", size: 18, color: "0F8A63" })] })], { fill: TEAL_LIGHT, width: 1800 }), cell([body("Success states, positive sentiment, complete badges")], { width: 3360 })]}),
          new TableRow({ children: [cell([body("--ms-warn", { bold: true })], { fill: LIGHT_BG, width: 2400 }), cell([new Paragraph({ children: [new TextRun({ text: "#F5A623", font: "Courier New", size: 18, color: "F5A623" })] })], { fill: "2E1E00", width: 1800 }), cell([new Paragraph({ children: [new TextRun({ text: "#B87A10", font: "Courier New", size: 18, color: "B87A10" })] })], { fill: "FFF8E7", width: 1800 }), cell([body("Scanning/pending states, medium gap scores, caution")], { width: 3360 })]}),
          new TableRow({ children: [cell([body("--ms-neg", { bold: true })], { fill: LIGHT_BG, width: 2400 }), cell([new Paragraph({ children: [new TextRun({ text: "#F0614A", font: "Courier New", size: 18, color: "F0614A" })] })], { fill: "2E0B00", width: 1800 }), cell([new Paragraph({ children: [new TextRun({ text: "#C0392B", font: "Courier New", size: 18, color: "C0392B" })] })], { fill: "FFF0EE", width: 1800 }), cell([body("Negative sentiment, critical gaps, error states")], { width: 3360 })]}),
        ]
      }),
      spacer(120),
      h2("2.4  Spacing Scale"),
      body("All spacing uses a base-4 scale. No arbitrary values. Every gap, padding, and margin is a multiple of 4px."),
      spacer(60),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Token", 2200], ["Value", 1800], ["Usage", 5360]),
          new TableRow({ children: [cell([body("--space-1")], { fill: LIGHT_BG, width: 2200 }), cell([body("4px")], { width: 1800 }), cell([body("Icon internal padding, micro gaps between inline elements")], { width: 5360 })]}),
          new TableRow({ children: [cell([body("--space-2")], { fill: LIGHT_BG, width: 2200 }), cell([body("8px")], { width: 1800 }), cell([body("Gap between badge and label, inside pills")], { width: 5360 })]}),
          new TableRow({ children: [cell([body("--space-3")], { fill: LIGHT_BG, width: 2200 }), cell([body("12px")], { width: 1800 }), cell([body("Between list items, inside compact cards")], { width: 5360 })]}),
          new TableRow({ children: [cell([body("--space-4")], { fill: LIGHT_BG, width: 2200 }), cell([body("16px")], { width: 1800 }), cell([body("Standard card padding, sidebar item padding")], { width: 5360 })]}),
          new TableRow({ children: [cell([body("--space-6")], { fill: LIGHT_BG, width: 2200 }), cell([body("24px")], { width: 1800 }), cell([body("Section gap, panel internal padding, topbar height")], { width: 5360 })]}),
          new TableRow({ children: [cell([body("--space-8")], { fill: LIGHT_BG, width: 2200 }), cell([body("32px")], { width: 1800 }), cell([body("Between major sections, page padding")], { width: 5360 })]}),
        ]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────────────
      // SEC 3 — FRONTEND ARCHITECTURE
      // ─────────────────────────────────────────────
      sectionHeader("03", "Frontend Architecture", "React component tree, routing, state management, theme engine"),
      spacer(160),
      h2("3.1  Tech Stack — Frontend"),
      spacer(80),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Layer", 1800], ["Technology", 2800], ["Rationale", 4760]),
          techRow("Bundler", "Vite 5 + React 18", "Fast HMR, ESM-native, first-class TypeScript. No CRA."),
          techRow("Language", "TypeScript 5.4", "Full type safety for API responses, store state, component props."),
          techRow("Routing", "React Router v6", "Nested routes for sidebar layout. File-based organisation."),
          techRow("State", "Zustand 4", "Minimal boilerplate global store for scan state, theme, active company."),
          techRow("Data fetch", "TanStack Query v5", "Server state caching, background refetch, optimistic updates."),
          techRow("Styling", "CSS Modules + tokens", "No Tailwind. Pure CSS with custom property tokens. Unique output."),
          techRow("Charts", "Recharts + D3", "Radar charts for gaps, bar charts for sentiment, line for history."),
          techRow("PDF export", "jsPDF + html2canvas", "Captures the report view DOM and saves locally — no server needed."),
          techRow("WebSocket", "native WS / socket.io", "Live signal feed during active scan. Auto-reconnect."),
          techRow("Icons", "Phosphor Icons", "Consistent, beautiful, not Heroicons/Lucide which look generic."),
        ]
      }),
      spacer(120),
      h2("3.2  Directory Structure"),
      spacer(60),
      tealBox([
        mono("marketscan360/"),
        mono("├── frontend/"),
        mono("│   ├── src/"),
        mono("│   │   ├── assets/fonts/          # Space Grotesk, DM Sans, JetBrains Mono"),
        mono("│   │   ├── styles/"),
        mono("│   │   │   ├── tokens.css         # All CSS custom properties (dark + light)"),
        mono("│   │   │   ├── reset.css          # Minimal opinionated reset"),
        mono("│   │   │   └── typography.css     # Font-face declarations + scale"),
        mono("│   │   ├── components/"),
        mono("│   │   │   ├── layout/            # AppShell, Iconbar, Sidebar, Topbar"),
        mono("│   │   │   ├── ui/                # Button, Badge, Pill, Input, Card, Divider"),
        mono("│   │   │   ├── charts/            # GapRadar, SentimentBar, ScoreRing"),
        mono("│   │   │   ├── platform/          # PlatformCard, SignalItem, HashtagCloud"),
        mono("│   │   │   └── scan/              # WorkflowStrip, ScanInput, CompanyHero"),
        mono("│   │   ├── pages/"),
        mono("│   │   │   ├── Dashboard.tsx"),
        mono("│   │   │   ├── NewScan.tsx"),
        mono("│   │   │   ├── Companies.tsx"),
        mono("│   │   │   ├── SocialIntel.tsx"),
        mono("│   │   │   ├── ProductGaps.tsx"),
        mono("│   │   │   ├── Competitors.tsx"),
        mono("│   │   │   ├── PromoIdeas.tsx"),
        mono("│   │   │   ├── Reports.tsx"),
        mono("│   │   │   └── Exports.tsx"),
        mono("│   │   ├── store/"),
        mono("│   │   │   ├── scanStore.ts       # Active scan state, workflow step"),
        mono("│   │   │   ├── themeStore.ts      # dark | light, persisted"),
        mono("│   │   │   └── companyStore.ts    # Selected company, list, filter"),
        mono("│   │   ├── hooks/"),
        mono("│   │   │   ├── useScan.ts         # Trigger + poll scan lifecycle"),
        mono("│   │   │   ├── useSignalFeed.ts   # WebSocket live signal hook"),
        mono("│   │   │   └── usePDFExport.ts    # jsPDF capture + local save"),
        mono("│   │   ├── api/                   # TanStack Query endpoints + types"),
        mono("│   │   └── utils/                 # formatters, sentiment helpers"),
      ]),
      spacer(120),
      h2("3.3  Page-by-Page Component Spec"),
      spacer(80),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Page", 1800], ["Key Components", 3800], ["Data Source", 3760]),
          new TableRow({ children: [cell([body("Dashboard", { bold: true })], { fill: PURPLE_LIGHT, width: 1800 }), cell([body("WorkflowStrip, CompanyHero, StatRow, PlatformGrid, SignalFeed, GapBars, PitchAngles, SaveBar")], { width: 3800 }), cell([body("GET /api/scan/{id}/summary — full aggregated scan result")], { width: 3760 })]}),
          new TableRow({ children: [cell([body("New Scan", { bold: true })], { fill: PURPLE_LIGHT, width: 1800 }), cell([body("ScanWizard (3-step: Target → Config → Launch), BulkImport, DomainValidator")], { width: 3800 }), cell([body("POST /api/scan/start — triggers background scan job")], { width: 3760 })]}),
          new TableRow({ children: [cell([body("Companies", { bold: true })], { fill: PURPLE_LIGHT, width: 1800 }), cell([body("CompanyTable, FilterBar (industry/status/score), SortControls, StatusBadge, QuickView drawer")], { width: 3800 }), cell([body("GET /api/companies — paginated + filtered list")], { width: 3760 })]}),
          new TableRow({ children: [cell([body("Social Intel", { bold: true })], { fill: PURPLE_LIGHT, width: 1800 }), cell([body("PlatformGrid (9 cards), SignalTimeline, HashtagCloud, SentimentDonut, EngagementHeatmap")], { width: 3800 }), cell([body("GET /api/signals/{company_id} — all platform signals")], { width: 3760 })]}),
          new TableRow({ children: [cell([body("Product Gaps", { bold: true })], { fill: PURPLE_LIGHT, width: 1800 }), cell([body("GapRadar (D3 radar chart), DimensionList, CompetitorBenchmarkTable, GapCard with source quotes")], { width: 3800 }), cell([body("GET /api/gaps/{company_id} — AI-scored gap analysis")], { width: 3760 })]}),
          new TableRow({ children: [cell([body("Competitor Map", { bold: true })], { fill: PURPLE_LIGHT, width: 1800 }), cell([body("CompetitorGrid (5 cards), FeatureMatrix, SentimentComparison, MessagingDiff highlighted text")], { width: 3800 }), cell([body("GET /api/competitors/{company_id} — auto-discovered competitors")], { width: 3760 })]}),
          new TableRow({ children: [cell([body("Promo Ideas", { bold: true })], { fill: PURPLE_LIGHT, width: 1800 }), cell([body("PitchAngleCards (priority-coloured), EmailDraftButton, LinkedInPostButton, one-click copy")], { width: 3800 }), cell([body("GET /api/promo/{company_id} — Claude-generated pitch angles")], { width: 3760 })]}),
          new TableRow({ children: [cell([body("Reports", { bold: true })], { fill: PURPLE_LIGHT, width: 1800 }), cell([body("ReportPreview (full paginated PDF view), DownloadBar, BrandingConfig, TemplateSelector")], { width: 3800 }), cell([body("GET /api/report/{company_id} — assembled report data")], { width: 3760 })]}),
          new TableRow({ children: [cell([body("Exports", { bold: true })], { fill: PURPLE_LIGHT, width: 1800 }), cell([body("ExportCard per company — PDF / JSON / CSV download. BatchExport for multiple. LocalSaveConfirm")], { width: 3800 }), cell([body("Local generation only — no API call needed for export")], { width: 3760 })]}),
        ]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────────────
      // SEC 4 — UI COMPONENTS SPEC
      // ─────────────────────────────────────────────
      sectionHeader("04", "UI Component Library Spec", "Every reusable component, its props, variants, and CSS rules"),
      spacer(160),
      h2("4.1  Global tokens.css — The Theme File"),
      body("This is the single source of truth for ALL visual tokens. Components must only reference these variables — never hardcode hex values."),
      spacer(80),
      tealBox([
        new Paragraph({ children: [new TextRun({ text: "tokens.css  (dark theme default, .light class overrides)", font: "Courier New", size: 16, bold: true, color: ACCENT2 })] }),
        spacer(40),
        mono(":root {"),
        mono("  /* Backgrounds */"),
        mono("  --ms-bg:       #0D0F14;   --ms-surface:  #13161E;   --ms-card:   #1A1E28;"),
        mono("  --ms-border:   #252A37;   --ms-dim:      #3D4358;"),
        mono("  /* Text */"),
        mono("  --ms-text:     #F0F2F8;   --ms-muted:    #7A8099;   --ms-hint:   #3D4358;"),
        mono("  /* Brand */"),
        mono("  --ms-accent:   #7C6FF7;   --ms-accent2:  #1DD9A0;   --ms-accent3:#F5A623;"),
        mono("  /* Semantic */"),
        mono("  --ms-pos:      #1DD9A0;   --ms-warn:     #F5A623;   --ms-neg:    #F0614A;"),
        mono("  /* Typography */"),
        mono("  --font-display: 'Space Grotesk', sans-serif;"),
        mono("  --font-ui:      'DM Sans', sans-serif;"),
        mono("  --font-body:    'Inter', sans-serif;"),
        mono("  --font-mono:    'JetBrains Mono', monospace;"),
        mono("  /* Spacing */"),
        mono("  --sp-1:2px; --sp-2:4px; --sp-3:8px; --sp-4:12px; --sp-5:16px; --sp-6:20px; --sp-8:24px; --sp-10:32px;"),
        mono("  /* Radius */"),
        mono("  --r-sm:4px; --r-md:8px; --r-lg:12px; --r-xl:16px; --r-full:9999px;"),
        mono("}"),
        mono(".light {"),
        mono("  --ms-bg:#F0F2F8; --ms-surface:#FFF; --ms-card:#F7F8FC; --ms-border:#DDE1EE;"),
        mono("  --ms-text:#0D0F14; --ms-muted:#5A6180; --ms-accent:#534AB7; --ms-accent2:#0F8A63;"),
        mono("  --ms-neg:#C0392B; --ms-pos:#0A6644; --ms-warn:#7A5200;"),
        mono("}"),
      ]),
      spacer(120),
      h2("4.2  Core Component Catalogue"),
      spacer(60),
      h3("AppShell"),
      body("Root layout wrapper. CSS grid: 56px icon bar | 200px sidebar | 1fr main. Height: 100dvh. No scroll on shell itself — each panel scrolls independently."),
      spacer(40),
      h3("Iconbar"),
      body("56px wide, full height. Background: var(--ms-surface). Logo block (M3 monogram, 32x32, --ms-accent bg, 8px radius). Icon buttons: 36x36, 8px radius. Active state: --ms-accent bg, white icon. Hover: --ms-card bg. Bottom section: theme toggle + settings."),
      spacer(40),
      h3("Sidebar"),
      body("200px wide. Sections separated by DM Mono 9px UPPERCASE label in --ms-dim. Nav items: 36px tall, 14px left padding. Active: 2px left border in --ms-accent, light accent tint bg. Company mini-rows show avatar (22x22, 5px radius, brand color), name, status, score."),
      spacer(40),
      h3("WorkflowStrip"),
      body("Full-width horizontal strip. 7 equal-width steps. Each step: step number in DM Mono 9px, step name in DM Mono 10px. Completed steps: teal left tint + teal dot indicator. Active: accent tint + pulsing accent dot (CSS keyframe animation). Future: --ms-dim color."),
      spacer(40),
      h3("PlatformCard"),
      body("Inside a 2-column grid. Each card: --ms-card bg, 1px --ms-border, 9px radius, 12px padding. Top row: 8px colored dot + platform name (DM Sans 11px 600) + signal count right-aligned. Sentiment bar: 3px tall, full-width, colored fill percentage. Stats row: 2 micro-stats in DM Mono 9px. Deep-link: DM Sans 9px --ms-accent, cursor pointer. Hover: border-color transitions to --ms-accent."),
      spacer(40),
      h3("SignalItem"),
      body("Three-column grid: platform pill | content | sentiment + time. Platform pill: 9px bold white text, platform brand color background, 20px radius. Content: title in DM Sans 11px 500, body in Inter 11px --ms-muted, meta in DM Mono 9px --ms-dim with inline platform link. Right: sentiment badge (colored bg, 9px bold) + relative timestamp in DM Mono 9px."),
      spacer(40),
      h3("ScoreRing"),
      body("SVG circle ring. Outer: 58x58 SVG. Background circle: --ms-border stroke. Foreground: --ms-accent stroke, stroke-dasharray computed from score percentage, stroke-linecap round, rotate(-90deg). Center: JetBrains Mono 18px 700 in --ms-accent. Label below: DM Mono 9px 500 --ms-muted uppercase."),
      spacer(40),
      h3("GapBar"),
      body("Each gap: label (DM Sans 11px, 110px fixed width, --ms-muted) | track (flex:1, 5px height, --ms-border bg, filled portion colored by score: red<45, amber<65, teal>=65) | score (JetBrains Mono 11px 600, colored) | vs label (DM Mono 9px --ms-dim)."),
      spacer(40),
      h3("HashtagCloud"),
      body("Flex-wrap row. Each hashtag: DM Mono 9px, 2px 7px padding, --ms-accent/10 background, --ms-accent color, 20px radius, 1px --ms-accent/20 border. Hover: --ms-accent/20 bg. Cursor: pointer."),
      spacer(40),
      h3("SaveBar"),
      body("Full-width bottom strip. --ms-card bg, 1px top border --ms-border, 12px 16px padding. Left: document icon + filename in DM Sans 11px --ms-muted, bold name in --ms-text. Right: three buttons — Save JSON, Save CSV (ghost style: --ms-card bg, --ms-border border), Download PDF (--ms-accent bg, white text)."),
      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────────────
      // SEC 5 — BACKEND ARCHITECTURE
      // ─────────────────────────────────────────────
      sectionHeader("05", "Backend Architecture", "FastAPI service design, task queues, scraper modules, AI pipeline"),
      spacer(160),
      h2("5.1  Tech Stack — Backend"),
      spacer(80),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Layer", 1800], ["Technology", 2800], ["Rationale", 4760]),
          techRow("Framework", "FastAPI 0.111 + Python 3.12", "Async-first, auto OpenAPI docs, pydantic validation, fast."),
          techRow("Task Queue", "Celery + Redis", "Background scan jobs — crawling takes 2-10 mins, can't block HTTP."),
          techRow("HTTP Scraping", "httpx + BeautifulSoup4", "Async HTTP, parses HTML for web crawling and public page scraping."),
          techRow("Browser Scraping", "Playwright (headless)", "For JS-rendered pages: LinkedIn posts, G2 reviews, dynamic sites."),
          techRow("AI", "Anthropic Claude API", "claude-haiku-4-5 for analysis (cheapest, free tier friendly)."),
          techRow("PDF", "WeasyPrint", "HTML-to-PDF on backend for server-side report generation option."),
          techRow("DB ORM", "SQLAlchemy 2.0 + asyncpg", "Async Postgres driver, declarative models, Alembic migrations."),
          techRow("WebSocket", "FastAPI WebSocket", "Real-time signal streaming to frontend during active scan."),
          techRow("Cache", "Redis", "Rate limit tracking, scan job status, session cache."),
          techRow("Auth", "JWT (python-jose)", "Simple bearer token auth — single user or team workspace."),
        ]
      }),
      spacer(120),
      h2("5.2  Backend Directory Structure"),
      spacer(60),
      tealBox([
        mono("backend/"),
        mono("├── app/"),
        mono("│   ├── main.py                # FastAPI app, CORS, router mounts, WS endpoint"),
        mono("│   ├── config.py              # Settings (Pydantic BaseSettings, .env)"),
        mono("│   ├── database.py            # Async engine, session factory"),
        mono("│   ├── models/                # SQLAlchemy ORM models"),
        mono("│   │   ├── company.py"),
        mono("│   │   ├── scan.py"),
        mono("│   │   ├── signal.py"),
        mono("│   │   ├── gap.py"),
        mono("│   │   └── report.py"),
        mono("│   ├── schemas/               # Pydantic request/response schemas"),
        mono("│   ├── routers/"),
        mono("│   │   ├── scan.py            # POST /scan/start, GET /scan/{id}"),
        mono("│   │   ├── companies.py       # CRUD for company records"),
        mono("│   │   ├── signals.py         # GET signals by company / platform"),
        mono("│   │   ├── gaps.py            # Gap analysis endpoints"),
        mono("│   │   ├── competitors.py     # Competitor discovery + bench"),
        mono("│   │   ├── promo.py           # Pitch angle generation"),
        mono("│   │   └── reports.py         # Report assembly + PDF"),
        mono("│   ├── services/"),
        mono("│   │   ├── crawler.py         # Website + sitemap crawler"),
        mono("│   │   ├── social/"),
        mono("│   │   │   ├── twitter.py     # Twitter/X scraper (nitter fallback)"),
        mono("│   │   │   ├── linkedin.py    # LinkedIn public page scraper"),
        mono("│   │   │   ├── reddit.py      # Reddit JSON API"),
        mono("│   │   │   ├── g2.py          # G2 review scraper"),
        mono("│   │   │   ├── capterra.py    # Capterra scraper"),
        mono("│   │   │   ├── trustradius.py"),
        mono("│   │   │   ├── youtube.py     # YouTube Data API v3"),
        mono("│   │   │   └── instagram.py   # Instagram public profile"),
        mono("│   │   ├── ai_pipeline.py     # Claude prompt chains + response parsing"),
        mono("│   │   ├── gap_scorer.py      # Competitor comparison + gap scoring"),
        mono("│   │   └── report_builder.py  # Assembles final report JSON"),
        mono("│   ├── tasks/"),
        mono("│   │   └── scan_tasks.py      # Celery task: full scan orchestration"),
        mono("│   └── utils/"),
        mono("│       ├── rate_limiter.py    # Per-platform rate limits"),
        mono("│       └── sentiment.py       # Vader + Claude hybrid sentiment"),
        mono("├── alembic/                   # DB migrations"),
        mono("├── tests/"),
        mono("└── requirements.txt"),
      ]),
      spacer(120),
      h2("5.3  Scan Orchestration — Task Flow"),
      spacer(80),
      accentBox([
        new Paragraph({ children: [new TextRun({ text: "Full scan pipeline (Celery task: run_full_scan)", font: "Courier New", size: 17, bold: true, color: ACCENT })] }),
        spacer(60),
        bullet("Step 1 — Company Intel: crawl homepage, LinkedIn /about, Crunchbase public page → extract name, industry, HQ, headcount, tech stack, funding"),
        bullet("Step 2 — Web Crawl: sitemap.xml → crawl all product, pricing, blog, changelog pages → extract messaging, features, product names, CTAs"),
        bullet("Step 3 — Social Aggregation: run all platform scrapers in parallel (asyncio.gather) → store raw signals with source URL, timestamp, platform"),
        bullet("Step 4 — Review Aggregation: G2, Capterra, Trustradius, AppSumo → extract star rating, review text, date, verified status"),
        bullet("Step 5 — Sentiment Analysis: VADER quick pass on all signals → flag for Claude deep analysis on low-confidence items"),
        bullet("Step 6 — AI Need Analysis: batch send top 50 signals to Claude → structured JSON output: pain points, desires, missing features"),
        bullet("Step 7 — Competitor Discovery: Claude identifies top 5 competitors from web signals → trigger mini-scan on each"),
        bullet("Step 8 — Gap Scoring: score target vs each competitor on 10 dimensions → store gap matrix in DB"),
        bullet("Step 9 — Promo Generation: Claude receives gap matrix + company context → generates 3–5 pitch angles with priority"),
        bullet("Step 10 — Report Assembly: combine all outputs into structured report JSON → trigger PDF build → save to /reports/"),
      ]),
      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────────────
      // SEC 6 — API REFERENCE
      // ─────────────────────────────────────────────
      sectionHeader("06", "REST API Reference", "All endpoints, methods, auth, request/response schemas"),
      spacer(160),
      h2("6.1  Base URL & Auth"),
      body("Base URL: http://localhost:8000/api/v1"),
      body("Authentication: Bearer JWT token in Authorization header for all write endpoints."),
      spacer(80),
      h2("6.2  Scan Endpoints"),
      spacer(60),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Method", 900], ["Endpoint", 2800], ["Description", 4060], ["Auth", 1600]),
          apiRow("POST", "/scan/start", "Trigger a full scan for a company. Body: {domain, name, industry?}. Returns scan_id.", "Required"),
          apiRow("GET", "/scan/{scan_id}", "Get scan status + progress (0–100). Includes current step and ETA.", "Required"),
          apiRow("GET", "/scan/{scan_id}/summary", "Full aggregated scan result with all sub-data embedded.", "Required"),
          apiRow("DELETE", "/scan/{scan_id}", "Cancel an in-progress scan and clean up partial data.", "Required"),
          apiRow("GET", "/scan/active", "List all currently running scans with step and % progress.", "Required"),
        ]
      }),
      spacer(80),
      h2("6.3  Company Endpoints"),
      spacer(60),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Method", 900], ["Endpoint", 2800], ["Description", 4060], ["Auth", 1600]),
          apiRow("GET", "/companies", "Paginated list. Query: ?page=1&limit=20&status=&industry=&sort=score", "Required"),
          apiRow("GET", "/companies/{id}", "Full company record with latest scan summary.", "Required"),
          apiRow("POST", "/companies/bulk", "Bulk create from CSV or JSON list. Returns job_id for async processing.", "Required"),
          apiRow("DELETE", "/companies/{id}", "Delete company + all associated scan data, signals, reports.", "Required"),
        ]
      }),
      spacer(80),
      h2("6.4  Signal & Intelligence Endpoints"),
      spacer(60),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Method", 900], ["Endpoint", 2800], ["Description", 4060], ["Auth", 1600]),
          apiRow("GET", "/signals/{company_id}", "All signals. Query: ?platform=twitter&sentiment=neg&from=&to=", "Required"),
          apiRow("GET", "/signals/{company_id}/platforms", "Aggregated stats per platform: count, sentiment %, top hashtags.", "Required"),
          apiRow("GET", "/gaps/{company_id}", "Gap analysis: 10-dimension scores vs competitor benchmarks.", "Required"),
          apiRow("GET", "/competitors/{company_id}", "Auto-discovered competitors with mini-intel and feature matrix.", "Required"),
          apiRow("GET", "/promo/{company_id}", "Claude-generated pitch angles with priority and rationale.", "Required"),
          apiRow("POST", "/promo/{company_id}/regenerate", "Force regenerate pitch angles with optional custom context.", "Required"),
        ]
      }),
      spacer(80),
      h2("6.5  Report & Export Endpoints"),
      spacer(60),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Method", 900], ["Endpoint", 2800], ["Description", 4060], ["Auth", 1600]),
          apiRow("GET", "/report/{company_id}", "Full report JSON — all sections assembled and ready for rendering.", "Required"),
          apiRow("POST", "/report/{company_id}/pdf", "Server-side PDF build using WeasyPrint. Returns file stream.", "Required"),
          apiRow("GET", "/report/{company_id}/json", "Export raw scan data as structured JSON for local save.", "Required"),
          apiRow("GET", "/report/{company_id}/csv", "Export signals as CSV: platform, text, sentiment, date, URL.", "Required"),
          apiRow("WS", "/ws/scan/{scan_id}", "WebSocket: streams live signals + step updates during active scan.", "Token query"),
        ]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────────────
      // SEC 7 — DATABASE SCHEMA
      // ─────────────────────────────────────────────
      sectionHeader("07", "Database Schema", "PostgreSQL table definitions, relationships, indexes"),
      spacer(160),
      h2("7.1  Entity Relationship Overview"),
      bullet("companies  1 ── ∞  scans"),
      bullet("scans      1 ── ∞  signals"),
      bullet("companies  1 ── ∞  competitors  (via company_competitors join)"),
      bullet("scans      1 ── 1  gap_analyses"),
      bullet("scans      1 ── 1  reports"),
      spacer(120),
      h2("7.2  companies"),
      spacer(60),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Column", 1800], ["Type", 1800], ["Description", 5760]),
          dbRow("id", "UUID PK", "Auto-generated UUID primary key"),
          dbRow("name", "VARCHAR(255)", "Company display name"),
          dbRow("domain", "VARCHAR(255) UNIQUE", "Root domain without protocol — e.g. freshworks.com"),
          dbRow("industry", "VARCHAR(100)", "Auto-detected or user-provided industry tag"),
          dbRow("hq_location", "VARCHAR(200)", "City, Country from LinkedIn or website"),
          dbRow("founded_year", "INTEGER", "Founding year extracted from public sources"),
          dbRow("employee_count", "VARCHAR(50)", "Range string: '1001-5000' from LinkedIn"),
          dbRow("tech_stack", "JSONB", "Array of detected technologies from BuiltWith-style analysis"),
          dbRow("tags", "TEXT[]", "Free-form tags: ['SaaS', 'CRM', 'SMB']"),
          dbRow("opportunity_score", "INTEGER", "0–100 AI-computed score — how pitch-worthy the company is"),
          dbRow("created_at", "TIMESTAMPTZ", "Record creation timestamp"),
          dbRow("updated_at", "TIMESTAMPTZ", "Last updated — auto-managed by trigger"),
        ]
      }),
      spacer(80),
      h2("7.3  scans"),
      spacer(60),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Column", 1800], ["Type", 1800], ["Description", 5760]),
          dbRow("id", "UUID PK", "Scan job identifier — used in WebSocket path"),
          dbRow("company_id", "UUID FK", "References companies.id — CASCADE DELETE"),
          dbRow("status", "VARCHAR(20)", "queued | running | complete | failed"),
          dbRow("current_step", "INTEGER", "1–10 matching pipeline step numbers"),
          dbRow("progress_pct", "INTEGER", "0–100 progress for UI workflow strip"),
          dbRow("started_at", "TIMESTAMPTZ", "When Celery task was picked up"),
          dbRow("completed_at", "TIMESTAMPTZ", "When all steps finished"),
          dbRow("error_message", "TEXT", "If status=failed, full Python traceback"),
          dbRow("config", "JSONB", "Scan config: which platforms, depth, date range"),
        ]
      }),
      spacer(80),
      h2("7.4  signals"),
      spacer(60),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Column", 1800], ["Type", 1800], ["Description", 5760]),
          dbRow("id", "UUID PK", "Signal record identifier"),
          dbRow("scan_id", "UUID FK", "References scans.id — CASCADE DELETE"),
          dbRow("company_id", "UUID FK", "Denormalized for fast queries without join"),
          dbRow("platform", "VARCHAR(50)", "twitter|linkedin|reddit|g2|capterra|trustradius|youtube|instagram|producthunt"),
          dbRow("signal_type", "VARCHAR(30)", "post|comment|review|thread|hashtag|mention"),
          dbRow("content", "TEXT", "Raw text of the signal"),
          dbRow("author_handle", "VARCHAR(200)", "Username / handle of original poster"),
          dbRow("source_url", "TEXT", "Direct deep link to original post/comment/review"),
          dbRow("hashtags", "TEXT[]", "Extracted hashtags from content"),
          dbRow("engagement_count", "INTEGER", "Likes + shares + comments + upvotes combined"),
          dbRow("sentiment", "VARCHAR(10)", "positive|negative|neutral — from analysis"),
          dbRow("sentiment_score", "FLOAT", "−1.0 to 1.0 compound sentiment score"),
          dbRow("is_ai_analysed", "BOOLEAN", "Whether Claude has processed this signal"),
          dbRow("ai_tags", "TEXT[]", "Themes Claude extracted: ['onboarding', 'mobile', 'pricing']"),
          dbRow("published_at", "TIMESTAMPTZ", "Original publish time of the signal"),
          dbRow("collected_at", "TIMESTAMPTZ", "When our scraper captured it"),
        ]
      }),
      spacer(80),
      h2("7.5  gap_analyses"),
      spacer(60),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Column", 1800], ["Type", 1800], ["Description", 5760]),
          dbRow("id", "UUID PK", "Gap analysis record"),
          dbRow("scan_id", "UUID FK UNIQUE", "One per scan — 1:1 relationship"),
          dbRow("company_id", "UUID FK", "Denormalized reference"),
          dbRow("dimensions", "JSONB", "Object: { mobile_ux: {score:38, vs:{hubspot:72}}, ... }"),
          dbRow("top_gaps", "JSONB", "Ordered array of top 5 gaps with AI explanation"),
          dbRow("competitor_ids", "UUID[]", "References to competitor company records"),
          dbRow("generated_at", "TIMESTAMPTZ", "When Claude produced this analysis"),
        ]
      }),
      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────────────
      // SEC 8 — AI PIPELINE
      // ─────────────────────────────────────────────
      sectionHeader("08", "AI Pipeline — Claude Integration", "Free-tier optimised prompt chains, batching strategy, response parsing"),
      spacer(160),
      h2("8.1  Free-Tier Strategy"),
      body("All Claude calls use claude-haiku-4-5-20251001 — the fastest and cheapest model. The pipeline is designed to stay within free tier limits through smart batching, caching, and deduplication."),
      spacer(80),
      accentBox([
        new Paragraph({ children: [new TextRun({ text: "Free-tier safeguards:", font: "Inter", size: 20, bold: true, color: ACCENT })] }),
        bullet("Never call Claude on raw scraped text — always pre-process + truncate to < 800 tokens per signal"),
        bullet("Cache Claude responses in Redis for 7 days — re-use if same domain is re-scanned"),
        bullet("Run VADER sentiment first — only send signals with low-confidence VADER scores to Claude"),
        bullet("Batch signals: send max 20 per API call in a structured JSON array"),
        bullet("Rate limit: max 3 Claude calls per scan. Need analysis + competitor ID + pitch angles"),
        bullet("Store all Claude outputs in DB — never re-call for same data"),
      ]),
      spacer(120),
      h2("8.2  Prompt Chain Design"),
      spacer(80),
      h3("Chain 1 — Need Analysis"),
      body("Input: Top 30 signals (content + platform + sentiment). Output: structured JSON with pain points, feature desires, and emotional themes."),
      spacer(60),
      tealBox([
        new Paragraph({ children: [new TextRun({ text: "System prompt:", font: "Courier New", size: 16, bold: true, color: ACCENT2 })] }),
        mono("You are a B2B market intelligence analyst. You receive scraped signals"),
        mono("(reviews, social posts, comments) about a company from multiple platforms."),
        mono("Analyse them and output ONLY valid JSON — no markdown, no preamble."),
        spacer(40),
        new Paragraph({ children: [new TextRun({ text: "User prompt:", font: "Courier New", size: 16, bold: true, color: ACCENT2 })] }),
        mono("Company: {name} | Industry: {industry}"),
        mono("Signals: {json_array_of_signals}"),
        mono("Output JSON schema:"),
        mono("{ pain_points: [{theme, severity(1-10), signal_count, example_quote}],"),
        mono("  feature_desires: [{feature, priority(high|med|low), mentioned_by}],"),
        mono("  emotional_themes: [{theme, sentiment, frequency}],"),
        mono("  opportunity_score: 0-100,"),
        mono("  summary: string (max 80 words) }"),
      ]),
      spacer(80),
      h3("Chain 2 — Competitor Identification"),
      body("Input: Company name, industry, product description from website crawl. Output: 5 competitor names and domains."),
      spacer(60),
      h3("Chain 3 — Pitch Angle Generation"),
      body("Input: Gap matrix (10 dimensions + competitor scores) + need analysis JSON + company context. Output: 3–5 pitch angles with priority, rationale, and suggested opening line for outreach."),
      spacer(60),
      tealBox([
        new Paragraph({ children: [new TextRun({ text: "Output schema for Chain 3:", font: "Courier New", size: 16, bold: true, color: ACCENT2 })] }),
        mono("{ pitch_angles: ["),
        mono("    { title: string,"),
        mono("      priority: 'critical'|'high'|'medium',"),
        mono("      gap_dimension: string,"),
        mono("      rationale: string (max 60 words),"),
        mono("      evidence: [source_url, source_url],"),
        mono("      opening_line: string (first sentence of outreach email)"),
        mono("    }"),
        mono("  ] }"),
      ]),
      spacer(120),
      h2("8.3  Sentiment Pipeline"),
      bullet("Step 1: Run VADER on all signals. Compound score < 0.1 threshold = uncertain."),
      bullet("Step 2: Batch uncertain signals (max 20) → Claude single call for re-classification."),
      bullet("Step 3: Store final sentiment label + score in signals table."),
      bullet("Step 4: Aggregate per-platform: count pos/neg/neutral → UI sentiment bar fill %."),
      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────────────
      // SEC 9 — SCRAPER MODULES
      // ─────────────────────────────────────────────
      sectionHeader("09", "Web Crawler & Social Scraper Modules", "Platform-by-platform implementation notes and rate limits"),
      spacer(160),
      h2("9.1  Web Crawler (crawler.py)"),
      bullet("Fetch sitemap.xml or robots.txt to discover URLs"),
      bullet("Async httpx — crawl up to 50 pages per domain"),
      bullet("Extract: meta title/description, H1-H3 headings, pricing page detected, feature list items, CTA button text, blog post titles"),
      bullet("Store as structured JSON: { url, page_type, headings[], features[], ctas[], word_count }"),
      spacer(80),
      h2("9.2  Social Platform Scrapers"),
      spacer(60),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [
          tableHeader(["Platform", 1400], ["Method", 2200], ["Data Collected", 3560], ["Rate Limit", 2200]),
          new TableRow({ children: [cell([body("Twitter / X", { bold: true })], { fill: "E8F4FF", width: 1400 }), cell([body("Nitter instance scraping (no API key needed)")], { width: 2200 }), cell([body("Posts, replies, hashtags, retweet count, likes, author handle")], { width: 3560 }), cell([body("30 req/min, rotate Nitter instances")], { width: 2200 })]}),
          new TableRow({ children: [cell([body("LinkedIn", { bold: true })], { fill: "E8F4FF", width: 1400 }), cell([body("Playwright headless — public company page only")], { width: 2200 }), cell([body("Recent posts, comments, reaction count, job posts, follower count")], { width: 3560 }), cell([body("5 pages/scan, 3s delay between requests")], { width: 2200 })]}),
          new TableRow({ children: [cell([body("Reddit", { bold: true })], { fill: "E8F4FF", width: 1400 }), cell([body("Reddit public JSON API (/search.json)")], { width: 2200 }), cell([body("Thread title, body, subreddit, upvotes, comment count, top comments")], { width: 3560 }), cell([body("Free API — 60 req/min, no key needed")], { width: 2200 })]}),
          new TableRow({ children: [cell([body("G2", { bold: true })], { fill: "E8F4FF", width: 1400 }), cell([body("httpx + BeautifulSoup — public review pages")], { width: 2200 }), cell([body("Star rating, review title + body, date, verified badge, use-case tag")], { width: 3560 }), cell([body("Paginate 5 pages, 2s delay, respect robots.txt")], { width: 2200 })]}),
          new TableRow({ children: [cell([body("Capterra", { bold: true })], { fill: "E8F4FF", width: 1400 }), cell([body("httpx + BS4 — public review listing page")], { width: 2200 }), cell([body("Rating, pros/cons text, date, reviewer industry, would recommend %")], { width: 3560 }), cell([body("3 pages max, 2s delay")], { width: 2200 })]}),
          new TableRow({ children: [cell([body("Trustradius", { bold: true })], { fill: "E8F4FF", width: 1400 }), cell([body("httpx + BS4 — public product page")], { width: 2200 }), cell([body("Score, review body, reviewer title, company size, use case")], { width: 3560 }), cell([body("2 pages max, 2s delay")], { width: 2200 })]}),
          new TableRow({ children: [cell([body("YouTube", { bold: true })], { fill: "E8F4FF", width: 1400 }), cell([body("YouTube Data API v3 (free quota: 10K units/day)")], { width: 2200 }), cell([body("Video titles + descriptions + comment samples for brand name search")], { width: 3560 }), cell([body("50 videos, 10 comments each — ~600 units")], { width: 2200 })]}),
          new TableRow({ children: [cell([body("Instagram", { bold: true })], { fill: "E8F4FF", width: 1400 }), cell([body("Playwright — public profile page only")], { width: 2200 }), cell([body("Post count, follower count, recent post captions, hashtags visible in DOM")], { width: 3560 }), cell([body("1 page only, no login, 5s delay")], { width: 2200 })]}),
          new TableRow({ children: [cell([body("Product Hunt", { bold: true })], { fill: "E8F4FF", width: 1400 }), cell([body("httpx + BS4 — public product page")], { width: 2200 }), cell([body("Upvotes, launch comments, feature requests mentioned, hunter notes")], { width: 3560 }), cell([body("1 page, 1s delay")], { width: 2200 })]}),
        ]
      }),
      spacer(120),
      h2("9.3  Rate Limiting & Ethical Scraping Rules"),
      bullet("All scrapers respect robots.txt — check and cache disallow rules before crawling"),
      bullet("User-Agent rotation — maintain a pool of 10 realistic browser UA strings"),
      bullet("Per-platform delay configuration in config.py — never hammer a single domain"),
      bullet("Exponential backoff on 429 / 503 responses — max 3 retries per URL"),
      bullet("Store raw HTML + scraped timestamp — do not re-scrape if data < 24 hours old"),
      bullet("No login required for any platform — all scraping is public-only content"),
      new Paragraph({ children: [new PageBreak()] }),

      // ─────────────────────────────────────────────
      // SEC 10 — IMPLEMENTATION PLAN
      // ─────────────────────────────────────────────
      sectionHeader("10", "Codex Implementation Plan", "Sprint-by-sprint build order for the AI agent"),
      spacer(160),
      h2("10.1  Monorepo Setup (Day 1)"),
      bullet("Create root marketscan360/ directory with frontend/ and backend/ subdirectories"),
      bullet("Frontend: npm create vite@latest frontend -- --template react-ts"),
      bullet("Install: react-router-dom, zustand, @tanstack/react-query, recharts, jspdf, html2canvas, phosphor-react"),
      bullet("Backend: python -m venv venv, pip install fastapi uvicorn sqlalchemy asyncpg alembic celery redis httpx beautifulsoup4 playwright anthropic python-jose vadersentiment weasyprint"),
      bullet("Create .env files for both — add ANTHROPIC_API_KEY, DATABASE_URL, REDIS_URL"),
      bullet("Create docker-compose.yml for PostgreSQL 16 + Redis 7"),
      spacer(120),
      h2("10.2  Sprint 1 — Foundation (Days 2–4)"),
      bullet("Backend: Create all SQLAlchemy models, run alembic init + first migration"),
      bullet("Backend: Build FastAPI app skeleton — all routers mounted, health check endpoint"),
      bullet("Frontend: Implement tokens.css with full dark/light token set"),
      bullet("Frontend: Build AppShell (3-column grid), Iconbar, Sidebar with all nav items"),
      bullet("Frontend: Implement themeStore + theme toggle — must persist to localStorage"),
      bullet("Frontend: Create all 9 page files as empty shells with correct routing"),
      spacer(80),
      h2("10.3  Sprint 2 — Scan Core (Days 5–8)"),
      bullet("Backend: Implement crawler.py — async httpx sitemap fetch + page extract"),
      bullet("Backend: Implement Reddit scraper (easiest — public JSON API, no auth)"),
      bullet("Backend: Implement G2 + Capterra scrapers with Playwright"),
      bullet("Backend: Create Celery scan_tasks.py — orchestrate Steps 1–4"),
      bullet("Backend: WebSocket endpoint — broadcast signal events as they arrive"),
      bullet("Frontend: Build WorkflowStrip component with step states"),
      bullet("Frontend: Build useSignalFeed hook — connect WS, append to Zustand store"),
      bullet("Frontend: Build SignalItem + PlatformCard components"),
      spacer(80),
      h2("10.4  Sprint 3 — AI + Intelligence (Days 9–12)"),
      bullet("Backend: Implement ai_pipeline.py — all 3 Claude prompt chains"),
      bullet("Backend: Implement VADER + Claude hybrid sentiment in sentiment.py"),
      bullet("Backend: Build gap_scorer.py — 10-dimension scoring algorithm"),
      bullet("Backend: Complete all intelligence endpoints: /gaps, /competitors, /promo"),
      bullet("Frontend: Build GapBar + ScoreRing components"),
      bullet("Frontend: Build PitchAngleCard component with priority colour coding"),
      bullet("Frontend: Wire Dashboard page to GET /scan/{id}/summary"),
      spacer(80),
      h2("10.5  Sprint 4 — Reports + Export (Days 13–15)"),
      bullet("Backend: Build report_builder.py — JSON assembly from all scan sub-data"),
      bullet("Backend: WeasyPrint PDF generation from HTML template"),
      bullet("Frontend: Build Reports page — full paginated report preview"),
      bullet("Frontend: Build usePDFExport hook — html2canvas capture + jsPDF local save"),
      bullet("Frontend: Build Exports page — per-company download buttons (PDF, JSON, CSV)"),
      bullet("Frontend: Implement local JSON + CSV save using Blob + anchor click pattern"),
      bullet("Frontend: Build SaveBar component and wire to all export buttons"),
      spacer(80),
      h2("10.6  Sprint 5 — Polish + All Pages (Days 16–18)"),
      bullet("Frontend: Complete all remaining pages: SocialIntel, Companies, Competitors, PromoIdeas"),
      bullet("Frontend: Implement HashtagCloud, SentimentDonut, EngagementHeatmap for SocialIntel"),
      bullet("Frontend: Build CompanyTable with filter/sort on Companies page"),
      bullet("Frontend: Implement QuickView drawer component for Company detail"),
      bullet("Frontend: Add loading skeleton components for all data-fetching states"),
      bullet("Frontend: Add empty state illustrations for pages with no data"),
      bullet("Final: End-to-end test with 5 real companies — verify full pipeline produces PDF"),
      spacer(120),
      new Table({
        width: { size: W, type: WidthType.DXA },
        rows: [new TableRow({ children: [cell([
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Build sequence for Codex:", font: "Inter", size: 20, bold: true, color: DARK })] }),
          new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 }, children: [new TextRun({ text: "tokens.css  →  AppShell  →  DB models  →  Crawler  →  Scrapers  →  AI pipeline  →  API endpoints  →  UI components  →  Pages  →  PDF export", font: "Inter", size: 18, color: MID })] }),
        ], { fill: LIGHT_BG, borders: border(ACCENT) })] })]
      }),
      spacer(80),
      body("Always implement in this order: backend models → API endpoint → frontend hook → UI component → page integration. Never build a UI component before its API contract is defined.", { color: MUTED, italic: true }),

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/home/claude/MarketScan360_Implementation_Master.docx', buffer);
  console.log('DONE');
});
