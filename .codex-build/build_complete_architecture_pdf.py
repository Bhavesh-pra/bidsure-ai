from pathlib import Path
from html import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle


ROOT = Path(r"C:\Users\hp\OneDrive\Desktop\BidSure")
OUT = ROOT / "output" / "pdf" / "BidSure_Complete_Architecture_Plan_v4.pdf"
DIAGRAMS = [ROOT / ".codex-build" / f"complete-architecture-{i}.png" for i in range(1, 6)]
PAGE_W, PAGE_H = 960, 540

NAVY = colors.HexColor("#1f2d3d")
INK = colors.HexColor("#29384a")
MUTED = colors.HexColor("#526477")
TEAL = colors.HexColor("#159d95")
TEAL_LIGHT = colors.HexColor("#e7f6f4")
BLUE = colors.HexColor("#4e90c7")
BLUE_LIGHT = colors.HexColor("#e8f2fb")
YELLOW = colors.HexColor("#d99408")
YELLOW_LIGHT = colors.HexColor("#fff4cc")
VIOLET = colors.HexColor("#7959aa")
VIOLET_LIGHT = colors.HexColor("#f1ebf8")
GREEN = colors.HexColor("#4f8b5e")
GREEN_LIGHT = colors.HexColor("#eaf5eb")
RED = colors.HexColor("#c45656")
RED_LIGHT = colors.HexColor("#fbeeee")
PANEL = colors.HexColor("#f5f7f9")
LINE = colors.HexColor("#c7d2dc")
WHITE = colors.white


def style(size=11, leading=None, color=INK, bold=False, align=TA_LEFT):
    return ParagraphStyle(
        name=f"s{size}{'b' if bold else ''}{align}",
        fontName="Helvetica-Bold" if bold else "Helvetica",
        fontSize=size,
        leading=leading or size * 1.23,
        textColor=color,
        alignment=align,
        spaceAfter=0,
        spaceBefore=0,
        allowWidows=1,
        allowOrphans=1,
    )


def para(c, text, x, top, width, text_style, height_limit=1000):
    safe = text if ("<" in text and ">" in text) else escape(text)
    p = Paragraph(safe.replace("\n", "<br/>"), text_style)
    _, h = p.wrap(width, height_limit)
    if h > height_limit + 0.1:
        raise ValueError(f"Text overflow: {text[:60]!r}")
    p.drawOn(c, x, top - h)
    return h


def header(c, section, title, subtitle):
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(42, 505, section.upper())
    c.setFont("Helvetica-Bold", 24)
    c.drawString(42, 470, title)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9.5)
    c.drawString(42, 449, subtitle)
    c.setStrokeColor(LINE)
    c.setLineWidth(1.1)
    c.line(42, 437, 918, 437)


def footer(c, page_no, label="SIH26100 | BidSure Complete Architecture Plan"):
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawString(42, 18, label)
    page_text = f"Page {page_no}"
    c.drawRightString(918, 18, page_text)


def card(c, x, top, w, h, title, body, fill=WHITE, stroke=TEAL, title_color=None, body_size=9.3):
    title_color = title_color or stroke
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(1.2)
    c.roundRect(x, top - h, w, h, 11, fill=1, stroke=1)
    para(c, title, x + 13, top - 13, w - 26, style(10, 12.3, title_color, True), h - 18)
    para(c, body, x + 13, top - 31, w - 26, style(body_size, body_size * 1.18, INK), h - 35)


def pill(c, x, y, w, text, fill, line_color, text_color):
    c.setFillColor(fill)
    c.setStrokeColor(line_color)
    c.roundRect(x, y, w, 20, 10, fill=1, stroke=1)
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(x + w / 2, y + 6.2, text)


def arrow(c, x1, y1, x2, y2, color=TEAL, width=1.5, dash=None):
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(width)
    if dash:
        c.setDash(dash)
    c.line(x1, y1, x2, y2)
    import math
    angle = math.atan2(y2 - y1, x2 - x1)
    length = 8
    spread = 0.45
    p1 = (x2 - length * math.cos(angle - spread), y2 - length * math.sin(angle - spread))
    p2 = (x2 - length * math.cos(angle + spread), y2 - length * math.sin(angle + spread))
    path = c.beginPath()
    path.moveTo(x2, y2)
    path.lineTo(*p1)
    path.lineTo(*p2)
    path.close()
    c.drawPath(path, fill=1, stroke=0)
    c.restoreState()


def bullet_list(c, items, x, top, width, font_size=10.2, color=INK, bullet_color=TEAL, gap=8):
    cursor = top
    item_style = style(font_size, font_size * 1.25, color)
    for item in items:
        c.setFillColor(bullet_color)
        c.circle(x + 4, cursor - 6, 2.2, fill=1, stroke=0)
        h = para(c, item, x + 14, cursor, width - 14, item_style)
        cursor -= h + gap
    return cursor


def title_band(c, text, x, y, w, fill, text_color=WHITE):
    c.setFillColor(fill)
    c.roundRect(x, y, w, 24, 6, fill=1, stroke=0)
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 10, y + 7.5, text)


def draw_cover(c):
    c.setFillColor(WHITE)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    c.setFillColor(TEAL_LIGHT)
    c.circle(878, 468, 136, fill=1, stroke=0)
    c.setFillColor(VIOLET_LIGHT)
    c.circle(905, 84, 118, fill=1, stroke=0)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(52, 490, "BIDSURE | SIH26100")
    c.setFillColor(TEAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(52, 461, "AI-POWERED INTEGRATED BID COMPLIANCE VERIFICATION PLATFORM")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 35)
    c.drawString(52, 402, "Complete Architecture Plan")
    c.setFillColor(MUTED)
    para(c, "A practical Node.js, Express and TypeScript architecture for secure bidder registration, document intelligence, verification, mock platforms, approved provider integrations, cloud storage and officer-led decisions.", 52, 369, 690, style(15, 19, MUTED), 70)

    c.setStrokeColor(LINE)
    c.setLineWidth(1)
    c.line(52, 289, 908, 289)
    pill(c, 52, 254, 157, "REVISED SYSTEM VIEW", TEAL_LIGHT, TEAL, TEAL)
    pill(c, 222, 254, 162, "HUMAN-IN-THE-LOOP", BLUE_LIGHT, BLUE, BLUE)
    pill(c, 397, 254, 173, "MOCK TO PRODUCTION", GREEN_LIGHT, GREEN, GREEN)

    card(c, 52, 216, 248, 116, "1. System structure", "Clear public edge, private app services, private cloud data, business modules, routing and network boundaries.", TEAL_LIGHT, TEAL)
    card(c, 316, 216, 248, 116, "2. Working process", "Registration to decision is shown as a traceable flow, with exception conditions and an officer-controlled outcome.", BLUE_LIGHT, BLUE)
    card(c, 580, 216, 328, 116, "3. Integration reality", "Mock platforms make the SIH demo feasible now. Production sources are accessed only after provider approval, scope and credentials.", VIOLET_LIGHT, VIOLET)

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(52, 70, "Prepared for the BidSure SIH solution review")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 9)
    c.drawString(52, 50, "Architecture revision: complete system design, workflow, AI controls, integration model, cloud storage and operations")
    c.setFont("Helvetica", 7.4)
    c.drawRightString(908, 24, "Node.js + Express + TypeScript | September 2026")
    c.showPage()


def draw_diagram_page(c, image_path):
    c.drawImage(ImageReader(str(image_path)), 0, 0, PAGE_W, PAGE_H, mask="auto")
    c.showPage()


def draw_boundaries(c, page_no):
    header(c, "Architecture guide", "Service Responsibilities and Network Boundaries", "This page explains exactly what connects to what, through which route, and under which control.")
    title_band(c, "PUBLIC EDGE", 44, 386, 204, BLUE)
    title_band(c, "PRIVATE APPLICATION ZONE", 274, 386, 285, TEAL)
    title_band(c, "PRIVATE DATA AND INTEGRATION ZONE", 585, 386, 331, VIOLET)

    card(c, 44, 360, 204, 110, "Browser clients", "Bidder Portal, Officer Console and Admin Console communicate only over HTTPS through DNS, TLS, WAF and the load balancer.", BLUE_LIGHT, BLUE)
    card(c, 274, 360, 136, 110, "API gateway", "Express API validates identity, role, tenant and input schema before routing an allowed command.", TEAL_LIGHT, TEAL, body_size=8.7)
    card(c, 423, 360, 136, 110, "Workers", "BullMQ jobs run OCR, adapters and report work away from the browser request path.", TEAL_LIGHT, TEAL, body_size=8.7)
    card(c, 585, 360, 150, 110, "Cloud data", "MongoDB metadata, object storage documents, Redis queues and audit retention use private service identities.", VIOLET_LIGHT, VIOLET, body_size=8.7)
    card(c, 748, 360, 168, 110, "Integration egress", "Only the adapter gateway can call a source. The source policy supplies purpose, scope, rate and freshness rules.", VIOLET_LIGHT, VIOLET, body_size=8.7)
    arrow(c, 248, 305, 274, 305, BLUE)
    arrow(c, 410, 305, 423, 305, TEAL)
    arrow(c, 559, 305, 585, 305, VIOLET)
    arrow(c, 735, 305, 748, 305, VIOLET)

    c.setFillColor(PANEL)
    c.setStrokeColor(LINE)
    c.roundRect(44, 92, 872, 160, 12, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(62, 226, "Connection rules that remove ambiguity")
    bullet_list(c, [
        "Client to API: a bearer token or approved SSO session is required. The API authorizes the user against organisation and role before accessing a tender, bid or report.",
        "API to service/data: authenticated private route or queue event only. No browser connects directly to MongoDB, Redis, workers, cloud storage or external sources.",
        "Document upload: API issues a short-lived, single-purpose upload instruction. The document guard hashes and scans the file before evidence processing begins.",
        "Worker to source: adapter contract includes subject, purpose, permitted claims, source policy, idempotency key and timeout. It cannot bypass egress controls.",
        "AI to outcome: AI produces structured candidate evidence and plain-language explanations. Deterministic rules and the Procurement Officer control the final result."
    ], 62, 204, 820, 9.6, INK, TEAL, 5)
    footer(c, page_no)
    c.showPage()


def draw_routes(c, page_no):
    header(c, "Operational workflow", "Routes, Events, Conditions and Decision State", "Route names are a proposed API contract: easy to demo, easy to test, and separate from external provider contracts.")
    c.setFillColor(PANEL)
    c.setStrokeColor(LINE)
    c.roundRect(42, 96, 520, 304, 12, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, 376, "Proposed application routes and events")

    rows = [
        ("POST /v1/auth/register", "Creates user and organisation profile after OTP or SSO proof."),
        ("POST /v1/tenders", "Creates tender workspace, clauses, criteria and version."),
        ("POST /v1/bids/{id}/documents", "Creates a guarded upload instruction and records file metadata."),
        ("POST /v1/bids/{id}/verification-runs", "Queues a verification run after a permitted user action."),
        ("worker: verification.requested", "Fetches source evidence through the adapter gateway; retries only within policy."),
        ("GET /v1/verification-runs/{id}", "Returns status, evidence links, score, risk and readable explanation."),
        ("POST /v1/decisions", "Only an authorised officer can qualify, clarify, escalate or disqualify with a reason.")
    ]
    y = 347
    for route, meaning in rows:
        c.setFillColor(WHITE)
        c.setStrokeColor(LINE)
        c.roundRect(60, y - 33, 484, 30, 5, fill=1, stroke=1)
        c.setFillColor(TEAL if ("worker" not in route) else VIOLET)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(70, y - 14, route)
        c.setFillColor(INK)
        c.setFont("Helvetica", 8.1)
        c.drawString(242, y - 14, meaning)
        y -= 38

    card(c, 590, 400, 326, 83, "Low OCR confidence", "Do not treat unverified extracted values as pass. Create a manual-evidence task and retain the original file and confidence score.", RED_LIGHT, RED, body_size=8.8)
    card(c, 590, 303, 326, 83, "Source unavailable or rate limited", "Return Pending Re-verification. Worker uses bounded retry, exponential backoff and circuit breaker according to source policy.", VIOLET_LIGHT, VIOLET, body_size=8.8)
    card(c, 590, 206, 326, 83, "Conflicting or mandatory-fail evidence", "Store both source records and timestamps. Mark the condition and expose it to an officer with linked evidence; never silently overwrite.", YELLOW_LIGHT, YELLOW, body_size=8.8)
    card(c, 590, 109, 326, 83, "Final decision", "The score and recommendation are advisory. The Procurement Officer records the action, reason, actor and time in the audit log.", BLUE_LIGHT, BLUE, body_size=8.8)
    footer(c, page_no)
    c.showPage()


def draw_ai_detail(c, page_no):
    header(c, "AI design", "AI and Document Intelligence: A Controlled Evidence Pipeline", "The model assists evidence extraction and explanation; it is not a remote super-user and it is not the final decision maker.")
    stages = [
        ("1. File guard", "Type, size, virus, hash and upload isolation.", BLUE_LIGHT, BLUE),
        ("2. OCR", "Page text, boxes and confidence captured.", TEAL_LIGHT, TEAL),
        ("3. Classify", "Document type, issuer pattern and relevance.", TEAL_LIGHT, TEAL),
        ("4. Extract", "Schema-only fields with page and bounding-box evidence.", VIOLET_LIGHT, VIOLET),
        ("5. Validate", "Format, checksum, duplicate and cross-source checks.", BLUE_LIGHT, BLUE),
        ("6. Rules", "Deterministic tender and policy evaluation.", YELLOW_LIGHT, YELLOW),
        ("7. Explain", "Plain-language rationale and review questions.", VIOLET_LIGHT, VIOLET),
        ("8. Officer", "Evidence-linked decision and reason capture.", BLUE_LIGHT, BLUE),
    ]
    x_positions = [42, 157, 272, 387, 502, 617, 732, 847]
    for idx, ((title, body, fill, line), x) in enumerate(zip(stages, x_positions)):
        card(c, x, 382, 94 if idx not in (0, 7) else 88, 126, title, body, fill, line, body_size=7.8)
        if idx < len(stages) - 1:
            next_x = x_positions[idx + 1]
            arrow(c, x + (88 if idx in (0, 7) else 94), 319, next_x, 319, TEAL if idx < 5 else VIOLET, 1.15)

    c.setFillColor(PANEL)
    c.setStrokeColor(LINE)
    c.roundRect(42, 102, 522, 146, 12, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, 222, "What is stored as evidence")
    bullet_list(c, [
        "Original document pointer, SHA-256 hash, page number, OCR text and confidence - kept separately from the user-facing summary.",
        "Extracted field value, expected schema, source, timestamp, validation result and linked tender clause.",
        "Model or OCR engine version, prompt template ID, extraction schema version and reviewer correction for reproducibility.",
        "Rule result, reason and source-evidence links. Any score can be explained without trusting the model alone."
    ], 60, 202, 480, 9.2, INK, TEAL, 3)

    c.setFillColor(VIOLET_LIGHT)
    c.setStrokeColor(VIOLET)
    c.roundRect(590, 102, 326, 146, 12, fill=1, stroke=1)
    c.setFillColor(VIOLET)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(608, 222, "Model safety controls")
    bullet_list(c, [
        "No direct credentials or network access from the model.",
        "Documents are untrusted input; prompt instructions inside them are ignored.",
        "Use minimised, redacted content where an approved model requires it.",
        "Schema validation rejects unexpected output; human review resolves material ambiguity."
    ], 608, 202, 286, 9.2, INK, VIOLET, 3)
    footer(c, page_no)
    c.showPage()


def draw_integrations(c, page_no):
    header(c, "Integration strategy", "Ten Plus Platforms Without Ten Plus Fragile Implementations", "A source registry and common adapter contract make a controlled mock demo possible now and a governed production path possible later.")
    card(c, 42, 397, 252, 126, "Source registry", "One record per source: owner, purpose, legal or consent basis, required scope, permitted claims, freshness, rate limit, retention, credential reference and test status.", TEAL_LIGHT, TEAL, body_size=9)
    card(c, 318, 397, 252, 126, "Common verification contract", "subject, requested_claims, purpose_ref, authority_ref, idempotency_key, deadline, correlation_id. Each adapter returns normalised status, evidence pointer, freshness and error code.", BLUE_LIGHT, BLUE, body_size=8.8)
    card(c, 594, 397, 322, 126, "Platform coverage", "Udyam/MSME, GST, PAN/Income Tax, MCA, EPFO/ESIC, Startup India, NSIC, DigiLocker, OEM authorisation, Make in India/local content, blacklist/debarment and GeM-specific checks.", VIOLET_LIGHT, VIOLET, body_size=8.8)

    arrow(c, 294, 334, 318, 334, TEAL)
    arrow(c, 570, 334, 594, 334, BLUE)

    card(c, 42, 236, 419, 118, "SIH mock-platform environment", "Use a separate Express mock API server with synthetic bidders, documents and verification records. Expose stable JSON responses matching the common contract. Add a failure simulator for timeout, rate limit, malformed response, expired registration and conflict cases.", GREEN_LIGHT, GREEN, body_size=9.2)
    card(c, 497, 236, 419, 118, "Production provider path", "For each source, complete provider onboarding, validate the approved use case, acquire scope-limited credentials, use an allowlisted egress route, run contract tests and activate gradually. No web scraping or shared keys.", VIOLET_LIGHT, VIOLET, body_size=9.2)

    c.setFillColor(PANEL)
    c.setStrokeColor(LINE)
    c.roundRect(42, 50, 874, 77, 12, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, 108, "Recommended onboarding sequence")
    sequence = ["1. Identify source and purpose", "2. Provider review / subscription", "3. Store credential reference", "4. Sandbox contract test", "5. Canary and monitoring", "6. Audit and renewal"]
    x = 60
    for i, item in enumerate(sequence):
        w = 128 if i not in (1, 4) else 142
        pill(c, x, 66, w, item, WHITE, TEAL if i < 3 else VIOLET, TEAL if i < 3 else VIOLET)
        if i < len(sequence) - 1:
            arrow(c, x + w, 76, x + w + 12, 76, TEAL if i < 3 else VIOLET, 1.1)
        x += w + 14
    footer(c, page_no)
    c.showPage()


def draw_stack(c, page_no):
    header(c, "Implementation plan", "Recommended Node.js, Express and TypeScript Stack", "The SIH build should stay understandable: a modular monolith plus worker process first, with clean interfaces for later scale-out.")
    columns = [(42, "Experience", BLUE, BLUE_LIGHT, [
        ("React + Vite + TypeScript", "Bidder, officer and admin consoles."),
        ("TanStack Query", "Server-state caching and polling of verification runs."),
        ("React Hook Form + Zod", "Typed client forms and validation.")]),
        (336, "Application", TEAL, TEAL_LIGHT, [
        ("Node.js LTS + Express + TypeScript", "REST API, routing and modules."),
        ("Zod + OpenAPI", "Shared request/response schemas and clear API docs."),
        ("jose + argon2 + helmet", "Token verification, password protection and secure HTTP defaults."),
        ("Multer + file-type + Sharp", "Guarded uploads, type verification and image preparation.")]),
        (630, "Data, jobs and operations", VIOLET, VIOLET_LIGHT, [
        ("MongoDB + Mongoose", "Tender, bid, finding, rule and audit metadata."),
        ("S3-compatible storage + AWS SDK v3", "Original documents, evidence exports and immutable versions."),
        ("Redis + BullMQ", "OCR, adapters, retries and scheduled re-checks."),
        ("Pino + OpenTelemetry", "Structured logs, traces and observability."),
    ])]
    for x, title, line, fill, items in columns:
        c.setFillColor(fill)
        c.setStrokeColor(line)
        c.roundRect(x, 103, 270, 295, 12, fill=1, stroke=1)
        c.setFillColor(line)
        c.setFont("Helvetica-Bold", 13)
        c.drawString(x + 18, 373, title)
        y = 345
        for name, description in items:
            c.setFillColor(WHITE)
            c.setStrokeColor(line)
            c.roundRect(x + 16, y - 50, 238, 45, 7, fill=1, stroke=1)
            para(c, name, x + 27, y - 13, 215, style(9.3, 11.2, line, True), 15)
            para(c, description, x + 27, y - 28, 215, style(8.2, 9.9, INK), 21)
            y -= 60
    c.setFillColor(PANEL)
    c.setStrokeColor(LINE)
    c.roundRect(42, 57, 858, 36, 10, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 8.4)
    c.drawString(58, 77, "Deployment baseline:")
    c.setFont("Helvetica", 8.4)
    c.drawString(157, 77, "Docker and Docker Compose for the demo; managed containers or a private Kubernetes platform for a pilot; CI validates schemas, tests and container images before deployment.")
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7.7)
    c.drawString(42, 37, "Pin package versions in the lockfile and run dependency, licence and security review before connecting to a real provider.")
    footer(c, page_no)
    c.showPage()


def draw_security_storage(c, page_no):
    header(c, "Security and privacy", "Cloud Storage, Data Protection and Operational Controls", "Public access ends at the edge. Evidence, credentials, workers and databases remain in private routes with least-privilege service identities.")
    cards = [
        (42, 390, "1. Upload and evidence", "Short-lived upload instruction, file guard, hash, versioned cloud object storage and evidence pointer rather than unrestricted downloads.", BLUE_LIGHT, BLUE),
        (336, 390, "2. Access and isolation", "Organisation-aware RBAC, ownership checks, privacy-aware fields and private routes. Browser users do not receive database or provider credentials.", TEAL_LIGHT, TEAL),
        (630, 390, "3. Secrets and egress", "Secret manager / KMS holds source credentials. Adapter egress is allowlisted, scoped, rate limited and monitored.", VIOLET_LIGHT, VIOLET),
        (42, 250, "4. Auditability", "Append-only event records contain actor, action, route, policy, source, evidence hash, decision and time. Sensitive values are minimised in logs.", YELLOW_LIGHT, YELLOW),
        (336, 250, "5. Retention and deletion", "Rules specify evidence retention, expiry and authorised export. Operational deletion follows review and produces a corresponding audit event.", RED_LIGHT, RED),
        (630, 250, "6. Recovery and resilience", "Encrypted backups, restore tests, queue retry policy, circuit breakers and an incident-alert path preserve availability without hiding failure.", GREEN_LIGHT, GREEN),
    ]
    for x, top, title, body, fill, line in cards:
        card(c, x, top, 252, 118 if top == 390 else 95, title, body, fill, line, body_size=9)
    c.setFillColor(PANEL)
    c.setStrokeColor(LINE)
    c.roundRect(42, 38, 874, 98, 12, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, 114, "Privacy-by-design decisions")
    bullet_list(c, [
        "Collect only claims necessary for the tender criterion and preserve the source policy and authority reference alongside every request.",
        "Keep original files in private cloud object storage. Use short-lived, authorized evidence links for review rather than public URLs.",
        "Treat provider credentials as non-exportable secrets. Use scoped client credentials or consent-bound flows where the provider requires them.",
        "Do not send an entire tender packet to a model by default. Redact or minimise sensitive content and preserve a reproducible extraction record."
    ], 60, 100, 828, 9.2, INK, TEAL, 3)
    footer(c, page_no)
    c.showPage()


def draw_rollout_references(c, page_no):
    header(c, "Delivery roadmap", "SIH Demo Scope, Pilot Path and Research Anchors", "Build a convincing, auditable demo without pretending that public-source access is automatically available.")
    card(c, 42, 397, 269, 100, "Phase 1 - SIH demo", "React user flows, Express API, authentication, tender rules, object storage, evidence ledger, BullMQ worker and mock Udyam/GST/DigiLocker/MCA source adapters. Demonstrate normal, low-confidence, timeout and conflict cases.", TEAL_LIGHT, TEAL, body_size=8.35)
    card(c, 345, 397, 269, 100, "Phase 2 - integration hardening", "Formal source inventory, provider onboarding, security review, contract tests, scoped secret references, egress allowlist, monitoring and review of retention rules.", BLUE_LIGHT, BLUE, body_size=8.35)
    card(c, 648, 397, 269, 100, "Phase 3 - pilot", "Limited tender category, selected approved sources, officer usability testing, false-positive review, performance/load tests, audit review and controlled rollout.", VIOLET_LIGHT, VIOLET, body_size=8.35)

    c.setFillColor(PANEL)
    c.setStrokeColor(LINE)
    c.roundRect(42, 45, 874, 235, 12, fill=1, stroke=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, 255, "Official research anchors used for this architecture")
    refs = [
        ("API Setu overview and SOP", "API Setu describes a consumer-registration, subscription and provider-approval model. This supports an approved-source registry rather than unrestricted portal access.", "https://docs.apisetu.gov.in/document-central/explore-apisetu/Overview.html"),
        ("API Setu permitted access", "API credentials must be used as assigned and access must use documented means. This supports scoped secrets, an egress gateway and no scraping.", "https://docs.apisetu.gov.in/document-central/terms-of-use/Permitted%20Access.html"),
        ("DigiLocker partner integration", "Partner documentation describes formal onboarding and API configuration; EntityLocker materials describe OAuth authorization and a registered redirect URI. This supports consent or authority references and callback controls.", "https://www.digilocker.gov.in/web/partners/issuers"),
    ]
    y = 229
    for label, explanation, url in refs:
        c.setFillColor(TEAL)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(60, y, label)
        para(c, explanation, 220, y + 4, 670, style(8.3, 10, INK), 28)
        c.setFillColor(MUTED)
        c.setFont("Helvetica", 7.4)
        c.drawString(220, y - 24, url)
        c.linkURL(url, (220, y - 28, 895, y - 12), relative=0)
        y -= 54
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(60, 69, "Important:")
    c.setFillColor(INK)
    c.setFont("Helvetica", 8.5)
    c.drawString(116, 69, "This plan does not claim production access to any provider. Each integration requires its own approved use case, agreement, credentials, scope and test path.")
    footer(c, page_no)
    c.showPage()


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    missing = [str(path) for path in DIAGRAMS if not path.exists()]
    if missing:
        raise FileNotFoundError("Missing diagram previews: " + ", ".join(missing))
    c = canvas.Canvas(str(OUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    c.setTitle("BidSure Complete Architecture Plan v4")
    c.setAuthor("BidSure Team")
    c.setSubject("SIH26100 architecture plan")
    draw_cover(c)
    for diagram in DIAGRAMS:
        draw_diagram_page(c, diagram)
    draw_boundaries(c, 7)
    draw_routes(c, 8)
    draw_ai_detail(c, 9)
    draw_integrations(c, 10)
    draw_stack(c, 11)
    draw_security_storage(c, 12)
    draw_rollout_references(c, 13)
    c.save()
    print(OUT)


if __name__ == "__main__":
    build()
