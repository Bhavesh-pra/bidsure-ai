from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.colors import HexColor
from reportlab.pdfgen import canvas
from reportlab.platypus.flowables import HRFlowable
from pathlib import Path

OUT = Path('output/pdf/BidSure_Integrated_Bid_Compliance_Report.pdf')
OUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = HexColor('#17324D')
BLUE = HexColor('#2A6F97')
TEAL = HexColor('#2A9D8F')
GOLD = HexColor('#E9C46A')
LIGHT = HexColor('#F3F6F8')
MID = HexColor('#D9E2E8')
DARK = HexColor('#1E2B33')
MUTED = HexColor('#59666F')
RED = HexColor('#A33A3A')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle('CoverTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=27, leading=32, textColor=NAVY, alignment=TA_LEFT, spaceAfter=12))
styles.add(ParagraphStyle('CoverSub', parent=styles['Normal'], fontSize=13, leading=18, textColor=MUTED, spaceAfter=18))
styles.add(ParagraphStyle('H1x', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=NAVY, spaceBefore=14, spaceAfter=8, keepWithNext=True))
styles.add(ParagraphStyle('H2x', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=12.5, leading=16, textColor=BLUE, spaceBefore=10, spaceAfter=5, keepWithNext=True))
styles.add(ParagraphStyle('Bodyx', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.5, leading=14, textColor=DARK, spaceAfter=7))
styles.add(ParagraphStyle('Smallx', parent=styles['BodyText'], fontName='Helvetica', fontSize=8, leading=11, textColor=MUTED, spaceAfter=4))
styles.add(ParagraphStyle('Tablex', parent=styles['BodyText'], fontName='Helvetica', fontSize=7.8, leading=10.2, textColor=DARK))
styles.add(ParagraphStyle('TableHeadx', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=8, leading=10.2, textColor=colors.white))
styles.add(ParagraphStyle('KPI', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=16, leading=18, textColor=TEAL, alignment=TA_CENTER))
styles.add(ParagraphStyle('KPILabel', parent=styles['BodyText'], fontSize=7.4, leading=9, textColor=MUTED, alignment=TA_CENTER))
styles.add(ParagraphStyle('Quote', parent=styles['BodyText'], fontName='Helvetica-Oblique', fontSize=10.5, leading=15, textColor=NAVY, leftIndent=12, rightIndent=12, spaceBefore=6, spaceAfter=10))

def P(text, style='Bodyx'):
    return Paragraph(text, styles[style])

def bullets(items):
    return [P('&bull; ' + x, 'Bodyx') for x in items]

def table(data, widths, header=True, small=False):
    conv=[]
    for ri,row in enumerate(data):
        conv.append([P(str(c), 'TableHeadx' if header and ri==0 else ('Smallx' if small else 'Tablex')) for c in row])
    t=Table(conv, colWidths=widths, repeatRows=1 if header else 0, hAlign='LEFT')
    cmds=[('GRID',(0,0),(-1,-1),0.35,MID),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]
    if header:
        cmds += [('BACKGROUND',(0,0),(-1,0),NAVY),('TEXTCOLOR',(0,0),(-1,0),colors.white)]
        for r in range(1,len(data)):
            if r%2==0: cmds.append(('BACKGROUND',(0,r),(-1,r),LIGHT))
    t.setStyle(TableStyle(cmds))
    return t

def page_header_footer(canv, doc):
    canv.saveState()
    w,h=A4
    if doc.page>1:
        canv.setFillColor(NAVY); canv.rect(0,h-13*mm,w,13*mm,fill=1,stroke=0)
        canv.setFillColor(colors.white); canv.setFont('Helvetica-Bold',8); canv.drawString(18*mm,h-8.5*mm,'BIDSURE | SIH26100')
        canv.setFont('Helvetica',8); canv.drawRightString(w-18*mm,h-8.5*mm,'Integrated Bid Compliance Verification Platform')
    canv.setStrokeColor(MID); canv.setLineWidth(.5); canv.line(18*mm,13*mm,w-18*mm,13*mm)
    canv.setFillColor(MUTED); canv.setFont('Helvetica',7.5); canv.drawString(18*mm,8*mm,'Prepared 12 September 2026 | Research and solution report')
    canv.drawRightString(w-18*mm,8*mm,f'{doc.page}')
    canv.restoreState()

doc=SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=19*mm, bottomMargin=18*mm, title='BidSure Integrated Bid Compliance Verification Report', author='BidSure')
S=[]

# Cover
S += [Spacer(1,22*mm), P('BidSure', 'CoverTitle'), P('AI Powered Integrated Bid Compliance Verification Platform for GeM Procurement', 'CoverSub'), HRFlowable(width='100%', thickness=2, color=TEAL, spaceBefore=6, spaceAfter=16), P('Complete solution, research, architecture and implementation report', 'H2x'), Spacer(1,10*mm)]
S.append(table([['PROBLEM STATEMENT','OWNER CONTEXT','REPORT STATUS'],['SIH26100','Ministry of Petroleum & Natural Gas / MIC','Decision-ready design basis']], [48*mm,62*mm,55*mm]))
S += [Spacer(1,14*mm), P('Executive conclusion', 'H1x'), P('BidSure should be implemented as an evidence-first decision-support platform: tender clauses become versioned requirements, bidder submissions become structured evidence, authorised sources are queried through replaceable adapters, and a deterministic compliance engine produces explainable findings for the Procurement Officer. AI should extract and interpret; it should not silently decide qualification.', 'Quote'), P('This report consolidates the supplied project material with current official-source research. It is written for a hackathon MVP that can mature into a controlled government pilot without redesigning the core evidence and audit model.', 'Bodyx'), Spacer(1,16*mm), P('Prepared for the BidSure team', 'Smallx'), P('Team context: Sinister Cyphers | Smart India Hackathon 2026', 'Smallx'), PageBreak()]

# TOC / reader guide
S += [P('Report map', 'H1x'), P('The report is organized around the operating decisions that determine whether BidSure is trustworthy in procurement use.', 'Bodyx')]
S.append(table([['SECTION','WHAT IT ANSWERS'],['1. Problem and operating context','Why manual verification is costly and where BidSure creates value'],['2. Source classification','Which supplied documents are evidence, which are historical discussion, and which are not operative instructions'],['3. Research findings','What current official sources imply for integrations, privacy and rule governance'],['4. Product and workflow design','How an officer and a bidder would use the platform'],['5. Architecture and data model','How to build a modular, auditable system'],['6. Verification taxonomy and rules','What is checked, with what evidence, and how uncertainty is handled'],['7. Security, privacy and governance','How to make the system fit a government environment'],['8. MVP plan and evaluation','What to demo, how to measure it, and what not to claim'],['Appendices','Risk register, API contract examples, and references']], [52*mm,113*mm]))
S += [Spacer(1,10*mm), P('Design principles used throughout', 'H2x')]
S += bullets(['Officer authority is preserved: the product recommends, records and explains; it does not qualify or disqualify on its own.', 'Every result is reproducible from tender version, evidence snapshot, source response, rule version and officer action.', 'Unavailable, stale or conflicting data produces a visible state such as Pending Re-verification or Review Required, never a silent pass.', 'Real integrations are adapter contracts. Hackathon connectors use mock or sandbox data and are clearly labelled in the interface.', 'Sensitive bidder data is minimized, access-controlled, encrypted and retained only for a defined purpose and period.'])
S.append(PageBreak())

# 1 Problem
S += [P('1 Problem and operating context','H1x'), P('GeM procurement evaluation brings together tender-specific clauses, statutory registrations, declarations, certificates, portal-derived status and time-sensitive evidence. The same bidder may have to be checked across GST, Udyam, PAN/Income Tax, MCA21, Startup India, NSIC, EPFO, ESIC, DigiLocker, Make in India/local content, OEM authorization and debarment sources.', 'Bodyx'), P('The central failure mode is not simply slow document reading. It is loss of traceability between a requirement, the evidence used to test it, the rule applied, the verification timestamp and the human decision. BidSure should therefore optimize for controlled evidence assembly and review, not just OCR speed.', 'Bodyx')]
S.append(table([['CURRENT FRICTION','BIDSURE RESPONSE','MEASURABLE OUTCOME'],['Documents are heterogeneous and often scanned','OCR plus field extraction with confidence and human review queue','Fewer missed fields; low-confidence items are visible'],['Tender clauses are not directly machine-checkable','Clause-to-requirement normalization and versioned rules','Repeatable, tender-specific checks'],['Portals have different access models and availability','Government connector adapters with source, timestamp and freshness metadata','No dependency on one portal or one integration mode'],['Findings are difficult to explain later','Requirement -> evidence -> verification -> rule -> result -> action chain','Audit-ready review and dispute support'],['AI can hallucinate or overreach','LLM advisory layer bounded by deterministic rule engine and officer decision','Controlled use of AI in a high-consequence workflow']], [43*mm,72*mm,50*mm]))
S += [Spacer(1,8*mm), P('Success definition', 'H2x'), P('For the MVP, success is a reviewer completing a representative bid check faster than manual review while being able to explain every pass, fail, pending or review-required result from linked evidence. The numerical outcomes in the supplied pitch deck, such as 75% faster or 99.2% extraction accuracy, should be presented as targets to validate, not as established facts.', 'Bodyx'), PageBreak()]

# 2 source classification
S += [P('2 Source classification and evidence boundary','H1x'), P('The supplied PDFs were used as references. Embedded conversational language, prompts, or historical “next steps” was not treated as an instruction to this report. This distinction matters because one source is a long exported architecture discussion and contains statements such as “do not start coding yet”; that is project history, not a constraint on the present report request.', 'Bodyx')]
S.append(table([['SUPPLIED SOURCE','ROLE IN THIS REPORT','RELIABILITY / TREATMENT'],['SOP-APISETU.pdf','API onboarding, consent, credential and security considerations','Primary project reference for API Setu operating assumptions; confirm endpoint-level terms before production'],['BIDSURE 26.pdf','Team concept, proposed stack, MVP scope, impacts and demo narrative','Team-authored proposal; targets and claims are treated as hypotheses unless independently verified'],['ChatGPT-Continue BidSure Architecture...pdf','Prior architecture exploration and design decisions','Historical design discussion; useful rationale, not operative instructions or authority'],['Bid_Compliance_System_Project_Brief.pdf','Project framing and requirements','Project brief; used to structure problem, users and scope'],['Fact Check Numbers.pdf / Fact cheked.pdf','Fact-check volume and verification context','Contextual evidence about verification workload; not direct evidence of GeM procurement workload'],['Fraudlent Check.pdf','Examples of fraudulent websites','Threat and awareness input; not a debarment source or bidder verification source'],['GeM Portal.pdf','GeM background, process and impact claims','PIB factsheet dated 30 Nov 2021; useful historical context, not a current KPI baseline'],['User problem statement','Authoritative task scope and desired deliverable','Primary instruction for this report']], [48*mm,65*mm,52*mm], small=True))
S += [Spacer(1,8*mm), P('Important boundary', 'H2x'), P('A public website, a screenshot, a PDF certificate, and an authenticated government response are not equivalent evidence. BidSure should label the evidence type and confidence for each finding, and should never claim “portal verified” when the result came only from an uploaded document or a mock adapter.', 'Bodyx'), PageBreak()]

# 3 Research
S += [P('3 Research findings from current official sources','H1x'), P('Research was conducted against official government or platform documentation available on 12 September 2026. The findings below should shape the production boundary and the hackathon demo narrative.', 'Bodyx')]
S.append(table([['TOPIC','RESEARCH FINDING','DESIGN CONSEQUENCE'],['GeM and procurement rules','GeM GTC 4.0 describes GeM as the national public procurement portal and states that GTC may be supplemented by STC, domain-specific STC, SLA and bid-specific ATC. GFR Rule 149 governs procurement through GeM.','Tender-specific ATC/STC must be first-class inputs; never assume one universal checklist.'],['API Setu','API Setu documentation describes publisher registration, consumer subscription, provider approval, API credentials, logging and sandbox testing. Its SOP requires a valid use case, organizational documents and secure handling of keys.','Use an adapter registry, formal onboarding checklist, secret vault, rate-limit handling and source-level audit logs.'],['Consent and data use','API Setu terms and privacy material require consent for personal-data processing and place responsibility on the consumer for appropriate consent and data handling.','Consent/authority artifacts must be captured before sensitive lookups; purpose and retention must be explicit.'],['DPDP regime','MeitY lists the notified Digital Personal Data Protection Rules 2025 and an 18-month phased compliance timeline.','Add data inventory, purpose limitation, retention/deletion policy, access logs and breach playbook; do not label the system “DPDP compliant” without legal review.'],['Udyam','The official Udyam portal states registration is free, online and based on self-declaration; it provides a permanent number, online certificate and dynamic QR code. The portal also shows updated MSME thresholds effective 1 April 2025.','Rule versioning must include effective dates and enterprise classification criteria; QR/document and portal results should be cross-checked.'],['GST','Official GST help material directs users to the portal’s Search Taxpayer function for status checks and distinguishes active, cancelled and inactive states.','GST checks should model status and verification timestamp, not just “GSTIN exists”.']], [36*mm,71*mm,58*mm], small=True))
S += [Spacer(1,7*mm), P('Research implication', 'H2x'), P('The architecture should be integration-ready but not integration-dependent. For SIH, a sandbox/mock adapter with realistic response contracts is defensible when the UI clearly displays “Demo / Mock Source”. For a pilot, each adapter needs a source owner, legal basis, onboarding approval, credential owner, SLA/freshness policy, failure mode and evidence retention rule.', 'Bodyx'), PageBreak()]

# 4 product workflow
S += [P('4 Product and workflow design','H1x'), P('BidSure has two controlled experiences: a bidder pre-check that identifies fixable gaps before submission, and an officer review console that assembles authoritative evidence for the qualification decision.', 'Bodyx')]
S.append(table([['STAGE','SYSTEM ACTION','OFFICER / BIDDER EXPERIENCE','OUTPUT'],['1. Tender intake','Ingest tender, corrigenda and ATC/STC; create immutable TenderVersion','Officer confirms document set and effective version','Versioned tender package'],['2. Requirement extraction','AI proposes clauses; reviewer accepts/edits type, mandatory flag, evidence and rule','Reviewer sees source clause and extracted interpretation side by side','Requirement catalogue'],['3. Bid ingestion','Classify files, OCR scans, extract fields, detect duplicates and expiry','Bidder/officer sees missing files and extraction confidence','Structured bid evidence'],['4. Verification','Run document checks, portal adapters, cross-document identity and date checks','Each finding shows source, time, confidence and failure reason','Verification records'],['5. Compliance evaluation','Apply deterministic rules with tender-specific parameters','Dashboard shows Pass, Fail, Pending, Review Required and Not Applicable','Clause-level result set'],['6. Risk and recommendation','Aggregate severity, staleness, conflicts and unresolved mandatory gaps','Officer sees recommendation with supporting evidence and clarifying questions','Explainable recommendation'],['7. Decision and audit','Officer records qualify/disqualify/clarify/escalate with reason and signature','System locks decision inputs and preserves full history','Decision record and report']], [23*mm,62*mm,63*mm,17*mm], small=True))
S += [Spacer(1,9*mm), P('Recommended status model', 'H2x'), P('<b>Pass</b> means the configured rule was satisfied by acceptable evidence. <b>Fail</b> means a rule was not satisfied. <b>Pending</b> means the source or verification is unavailable or stale. <b>Review Required</b> means there is ambiguity, a conflict, low extraction confidence or a policy-sensitive exception. <b>Not Applicable</b> must be justified by the tender rule set. These states are preferable to a single green/red score.', 'Bodyx'), PageBreak()]

# 5 architecture
S += [P('5 Target architecture','H1x'), P('The recommended design is a modular monolith for the MVP: one Node.js/Express backend with strong internal module boundaries, React/Vite frontend, MongoDB for case and evidence metadata, and object storage for documents. This keeps the two-day build realistic while preserving seams for future separation.', 'Bodyx')]
S.append(table([['LAYER','RESPONSIBILITY','MVP TECHNOLOGY'],['Experience','Bidder pre-check, officer dashboard, evidence viewer, report export','React, Vite, TypeScript, Tailwind/shadcn'],['API and access','Authentication, RBAC, request validation, case APIs','Node.js, Express, REST/JSON, JWT or institutional SSO adapter'],['Application services','Tender, bid, document, verification, scoring, decision and audit workflows','Node.js/TypeScript service modules'],['AI/document layer','OCR, document classification, field extraction and clause interpretation','Node.js document workers; Tesseract/Document AI; LLM behind provider adapter'],['Compliance core','Requirement schema, deterministic rules, statuses, severity and score calculation','TypeScript rule engine with versioned rules'],['Government adapters','GST, Udyam, MCA21, DigiLocker and later connectors','Adapter interface; mock/sandbox first'],['Persistence','Case metadata, evidence, source responses, rule versions and audit events','MongoDB + MinIO/S3-compatible object storage'],['Operations','Jobs, retries, rate limits, monitoring and secrets','BullMQ/Redis or background worker; structured logs; secret manager']], [34*mm,75*mm,56*mm], small=True))
S += [Spacer(1,8*mm), P('End-to-end evidence chain', 'H2x'), P('<b>TenderVersion -> Requirement -> BidDocument -> ExtractedEvidence -> Verification -> ComplianceRule -> Finding -> RiskAssessment -> Recommendation -> OfficerDecision -> AuditEvent</b>', 'Quote'), P('The most important architectural decision is that the dashboard should be a view over this chain, not a separate manually assembled summary. Every number, colour and recommendation on the screen must be traceable to stored records.', 'Bodyx')]
S.append(PageBreak())

# 6 data model and API
S += [P('6 Core data model and contracts','H1x'), P('The following entities are the minimum shared contract between team members. IDs should be stable, globally unique and included in every downstream record.', 'Bodyx')]
S.append(table([['ENTITY','KEY FIELDS','CONTROL'],['TenderVersion','tender_id, version, source_uri, published_at, corrigenda, checksum, status','Immutable after activation; superseded versions remain queryable'],['Requirement','requirement_id, clause_ref, type, text, mandatory, evidence_types, parameters, rule_version','Human approval required before production evaluation'],['BidDocument','document_id, bid_id, type, object_uri, sha256, submitted_at, issuer, expiry_date','Original preserved; derived text is separate'],['ExtractedEvidence','evidence_id, document_id, field, value, page, bounding_box, confidence, method','Every field carries provenance and confidence'],['Verification','verification_id, subject, adapter, source, requested_at, completed_at, status, raw_ref, normalized_result, freshness','Raw response retained or hashed according to policy'],['Finding','finding_id, requirement_id, severity, status, reason, evidence_refs, rule_version','No finding without evidence or explicit unavailable reason'],['OfficerDecision','decision_id, case_id, outcome, reason, actor, signed_at, input_snapshot_hash','Final human action; immutable after signing'],['AuditEvent','event_id, actor, action, entity, timestamp, before_hash, after_hash, correlation_id','Append-only and queryable']], [33*mm,78*mm,54*mm], small=True))
S += [Spacer(1,8*mm), P('Example shared JSON contract', 'H2x')]
S.append(table([['REQUIREMENT OBJECT','EVIDENCE OBJECT'],['{<br/>  "requirement_id": "REQ-GST-001",<br/>  "type": "GST_REGISTRATION",<br/>  "mandatory": true,<br/>  "operator": "STATUS_EQUALS",<br/>  "expected": "ACTIVE",<br/>  "effective_from": "2026-01-01",<br/>  "source_clause": "ATC 4.2"<br/>}','{<br/>  "evidence_id": "EV-8821",<br/>  "field": "gst_status",<br/>  "value": "ACTIVE",<br/>  "source": "GST_SEARCH_TAXPAYER",<br/>  "verified_at": "2026-09-12T09:15:00Z",<br/>  "fresh_until": "2026-09-19T09:15:00Z",<br/>  "confidence": 0.99<br/>}']], [84*mm,81*mm]))
S.append(PageBreak())

# 7 verification taxonomy
S += [P('7 Verification taxonomy and scoring','H1x'), P('Do not start with one universal score. Start with clause-level results and a transparent aggregation policy. A score can summarize review effort, but it must not hide a failed mandatory requirement or treat unavailable data as a pass.', 'Bodyx')]
S.append(table([['DOMAIN','EXAMPLES OF CHECKS','EVIDENCE AND FAILURE MODES'],['Identity and legal entity','Legal name, PAN, GSTIN, CIN, registered address, signatory','Mismatch across certificate, portal and declaration; OCR ambiguity'],['Statutory registrations','GST active status, Udyam number/classification, EPFO/ESIC where applicable','Inactive, expired, not applicable, source unavailable'],['Tender eligibility','Experience, turnover, solvency, technical capacity, EMD/exemption, declarations','Missing document, wrong period, insufficient amount, clause ambiguity'],['Policy preference','MSE/startup/NSIC eligibility, local content, Make in India, OEM authorization','Certificate not matching bidder/entity/product; self-declaration without support'],['Integrity and exclusions','Blacklisting/debarment, conflict, land-border declaration, fraud indicators','False positive risk; source authority and effective dates matter'],['Document integrity','Tampering indicators, duplicate use, metadata anomalies, QR/checksum validation','Signals are leads for review, not conclusive fraud findings']], [36*mm,70*mm,59*mm], small=True))
S += [Spacer(1,8*mm), P('Scoring proposal', 'H2x'), P('Use a 0-100 “verification readiness” score only as a secondary summary. Example: 50 points for mandatory requirement satisfaction, 25 for evidence quality/freshness, 15 for cross-source consistency and 10 for unresolved risk. Apply hard gates: a failed mandatory requirement, a confirmed debarment, or an unresolved identity conflict must force Review Required or Fail regardless of the numeric score. Weight and thresholds belong to the tender rule set and must be visible to the officer.', 'Bodyx')]
S.append(table([['RISK LEVEL','TRIGGER','SYSTEM ACTION'],['Low','All mandatory rules pass; evidence current; no material conflicts','Recommend Pass; officer confirms'],['Medium','Non-mandatory gap, minor staleness or low-confidence field','Recommend Clarify; show fix or confirmation'],['High','Mandatory gap, material mismatch, source conflict or suspicious document signal','Recommend Review Required; route to senior review'],['Critical','Confirmed debarment/blacklisting or identity/fraud concern supported by authoritative evidence','Block automatic recommendation; require officer/legal process']], [32*mm,80*mm,53*mm]))
S.append(PageBreak())

# 8 security
S += [P('8 Security, privacy and governance','H1x'), P('BidSure processes PAN, GST, financial, employment and identity-linked data. Security is therefore part of the product design, not a later deployment task.', 'Bodyx')]
S.append(table([['CONTROL AREA','REQUIRED DESIGN','MVP EVIDENCE'],['Access control','Separate bidder, procurement officer, reviewer, auditor and administrator roles; least privilege; MFA/SSO seam','RBAC middleware and role test cases'],['Data minimization','Store only fields required for the tender rule; mask PAN/Aadhaar-like identifiers in UI; avoid sending raw documents to external models by default','Data inventory and masking utilities'],['Consent and authority','Capture bidder consent/authority basis, purpose, actor, timestamp and scope before sensitive lookups','Consent record linked to verification job'],['Encryption and secrets','TLS in transit; encrypted object storage; secrets outside code; rotate adapter credentials','Environment/secrets checklist; no keys in repository'],['Model governance','Prompt/version registry, model output stored as advisory evidence, confidence thresholds, human review for low confidence','Replayable extraction record and test set'],['Auditability','Append-only event trail with case, user, source, rule and before/after hash','Audit query and export'],['Retention and deletion','Policy by document type and legal purpose; deletion workflow with hold exceptions','Retention configuration and delete test'],['Incident handling','Source outage, credential leak, data breach, model error and false-positive escalation paths','Runbook and visible incident status']], [35*mm,87*mm,43*mm], small=True))
S += [Spacer(1,9*mm), P('Security boundary for the demo', 'H2x'), P('Use synthetic bidder data and mock/sandbox responses. Label every source in the UI. Do not scrape portals, bypass authentication or imply access to authenticated government records. The demo should prove the data model and decision controls; production access would require formal onboarding, provider approval, security review and operational ownership.', 'Bodyx'), PageBreak()]

# 9 MVP plan
S += [P('9 MVP scope and delivery plan','H1x'), P('The best SIH MVP is narrow, end-to-end and demonstrable. It should complete one representative tender case with several positive, negative and ambiguous findings.', 'Bodyx')]
S.append(table([['SPRINT','SCOPE','DONE WHEN'],['Day 1: foundation','React shell, Node.js/Express API, case/tender/bid schemas, object storage, role model, audit event helper','A case can be created and all artifacts have stable IDs'],['Day 2: intelligence','PDF/image ingestion, OCR, classification, extraction, requirement editor','Reviewer can inspect and correct extracted fields and requirements'],['Day 3: verification','Mock GST/Udyam/DigiLocker adapters, cross-document checks, deterministic rule engine','A sample bid produces clause-level statuses with evidence links'],['Day 4: decision console','Score/risk summary, finding filters, clarification workflow, officer decision and export','Officer can make and sign a decision with reason'],['Hardening','Failure simulations, stale source, low OCR confidence, conflicting names, duplicate document, audit replay','Demo shows safe handling of edge cases and no silent passes']], [31*mm,86*mm,48*mm], small=True))
S += [Spacer(1,8*mm), P('Demo scenario set', 'H2x')]
S += bullets(['Pass case: active GST, matching Udyam, valid authorization and all mandatory declarations.', 'Clarify case: OCR confidence below threshold, expired certificate and one missing exemption document.', 'Conflict case: legal name differs across GST, Udyam and uploaded certificate.', 'Unavailable-source case: adapter timeout returns Pending Re-verification, not Pass.', 'Integrity case: duplicate certificate hash and suspicious metadata create a review finding, not an automatic fraud conclusion.'])
S.append(PageBreak())

# 10 evaluation / risk
S += [P('10 Evaluation, impact and limitations','H1x'), P('Impact should be measured with a controlled benchmark rather than asserted. Compare BidSure against a fixed manual-review protocol on the same anonymized tender packets.', 'Bodyx')]
S.append(table([['MEASURE','METHOD','TARGET FOR MVP VALIDATION'],['Extraction precision/recall','Field-level comparison against a reviewed ground-truth set','>= 95% on selected high-value fields; report by document type'],['Requirement extraction acceptance','Reviewer accepted vs corrected AI proposals','>= 85% accepted without semantic correction'],['Finding correctness','True positive, false positive and false negative counts by rule','100% of mandatory-rule outcomes reviewed; minimize false negatives'],['Review time','Median time from case open to officer-ready recommendation','Demonstrate material reduction on benchmark set; do not generalize from one case'],['Traceability completeness','Sample every finding and follow evidence links to source and rule version','100% of findings have provenance or explicit unavailable reason'],['Resilience','Inject source timeout, stale response, OCR failure and duplicate inputs','No silent Pass; correct status and audit event for every scenario']], [43*mm,78*mm,44*mm], small=True))
S += [Spacer(1,8*mm), P('Known limitations', 'H2x')]
S += bullets(['A mock adapter demonstrates interface readiness, not production verification authority.', 'OCR and LLM extraction accuracy varies by document quality, language and layout.', 'A fraud signal is not a legal finding; procurement, vigilance and legal workflows remain human-led.', 'Compliance rules change. A rule registry with effective dates and owner approval is mandatory for any pilot.', 'The final qualification/disqualification decision remains with the Procurement Officer, as required by the problem statement.'])
S.append(PageBreak())

# Appendix risk register
S += [P('Appendix A Risk register','H1x')]
S.append(table([['RISK','LIKELIHOOD / IMPACT','MITIGATION','OWNER'],['Government API access not approved','High / High','Mock/sandbox adapters; formal onboarding plan; source capability registry','Platform lead'],['Stale or unavailable source','Medium / High','Freshness windows, explicit Pending state, retry/backoff and officer escalation','Verification lead'],['LLM misreads clause','Medium / High','Source-cited extraction, reviewer approval and deterministic rule execution','Tender intelligence lead'],['OCR misreads identifier','Medium / High','Confidence threshold, field validation and manual review queue','Document intelligence lead'],['False positive fraud signal','Medium / High','Use signal language, preserve evidence, require human/vigilance review','Risk lead'],['Sensitive-data leakage','Low / Critical','Synthetic demo data, minimization, masking, encryption, RBAC and logging','Security lead'],['Rule change after evaluation begins','Medium / High','Rule and tender versioning; freeze active evaluation snapshot','Product owner'],['Dashboard score hides hard failure','Medium / High','Hard gates and clause-level status visible above aggregate score','Compliance lead']], [42*mm,30*mm,77*mm,20*mm], small=True))
S.append(PageBreak())

# Appendix B refs
S += [P('Appendix B Research references','H1x'), P('The following official sources informed the research sections and should be re-checked before any production integration or legal claim.', 'Bodyx')]
refs=[
('GeM General Terms and Conditions 4.0, Version 1.7','https://assets-bg.gem.gov.in/resources/upload/shared_doc/gtc/general-te-1675401798.pdf'),
('Department of Expenditure, General Financial Rules 2017','https://doe.gov.in/files/inline-documents/GFR2017.pdf'),
('API Setu overview and integration flow','https://docs.apisetu.gov.in/document-central/explore-apisetu/Overview.html'),
('API Setu Terms of Use','https://docs.apisetu.gov.in/document-central/terms-of-use/'),
('API Setu official SOP supplied in source set','https://cdn.apisetu.gov.in/portal/assets/SOP-APISETU.pdf'),
('MeitY Digital Personal Data Protection Rules 2025','https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025'),
('Udyam Registration official portal','https://udyamregistration.gov.in/'),
('GST official taxpayer status guidance','https://tutorial.gst.gov.in/offlineutilities/gsterrorandresolution/gstissuesandsuggestedsolutions.pdf'),
('PIB GeM factsheet supplied in source set','https://pib.gov.in/Pressreleaseshare.aspx?PRID=1776721'),
]
for name,url in refs:
    S.append(P(f'<b>{name}</b><br/><font color="#2A6F97">{url}</font>', 'Smallx'))
S += [Spacer(1,8*mm), P('Appendix C Recommended next decisions','H1x')]
S += bullets(['Freeze the MVP tender scenario and rule catalogue before coding.', 'Assign one owner for rule versioning and one owner for source/adapters.', 'Define the exact mock response contract for GST, Udyam and DigiLocker before frontend work.', 'Prepare an anonymized ground-truth document pack and edge-case scripts.', 'Use the officer decision and audit export as the final demo moment.'])
S.append(Spacer(1,12*mm)); S.append(P('End of report', 'Smallx'))

doc.build(S, onFirstPage=page_header_footer, onLaterPages=page_header_footer)
print(OUT)
