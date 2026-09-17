import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = 'C:/Users/hp/OneDrive/Desktop/BidSure';
const skillDir = 'C:/Users/hp/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.11809/skills/presentations';
const tmpDir = path.join(workspaceDir, '.codex-build');
const finalPath = path.join(workspaceDir, 'output/pptx/BidSure_Complete_Architecture_v4.pptx');
await fs.mkdir(tmpDir, { recursive: true });
await fs.mkdir(path.dirname(finalPath), { recursive: true });

const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(skillDir, 'container_tools/artifact_tool_utils.mjs')).href,
);
const family = resolvePresentationFont();
const W = 1280, H = 720;
const C = {
  navy: '#16324F', ink: '#1B2936', muted: '#52616B', light: '#F5F8FA', line: '#8EA1AC', white: '#FFFFFF',
  blue: '#DCECF7', blueLine: '#4B88B5', teal: '#E1F4EF', tealLine: '#2A9D8F',
  violet: '#F1EAF8', violetLine: '#73559B', gold: '#FFF2C7', goldLine: '#C9921E',
  rose: '#FBE7E8', roseLine: '#B65A5A', green: '#E7F3E8', greenLine: '#4B8F58', darkLine: '#45606E'
};

const pres = Presentation.create({ slideSize: { width: W, height: H } });

function addText(slide, text, x, y, w, h, size = 12, color = C.ink, bold = false) {
  const node = slide.shapes.add({ geometry: 'textbox', position: { left: x, top: y, width: w, height: h }, fill: 'none', line: { fill: 'none', width: 0 } });
  node.text = text;
  node.text.style = { typeface: family, fontSize: size, color, bold };
  return node;
}
function rect(slide, x, y, w, h, fill, stroke, rounded = true) {
  const spec = { geometry: rounded ? 'roundRect' : 'rect', position: { left: x, top: y, width: w, height: h }, fill, line: { style: 'solid', fill: stroke, width: 1.5 } };
  if (rounded) spec.borderRadius = 12;
  return slide.shapes.add(spec);
}
function card(slide, x, y, w, h, title, body, fill = C.white, stroke = C.line, fs = 11) {
  const node = rect(slide, x, y, w, h, fill, stroke);
  node.text = body ? `${title}\n${body}` : title;
  node.text.style = { typeface: family, fontSize: fs, color: C.ink };
  return node;
}
function zone(slide, x, y, w, h, title, fill, stroke) {
  const node = rect(slide, x, y, w, h, fill, stroke);
  node.text = title;
  node.text.style = { typeface: family, fontSize: 12, color: stroke, bold: true };
  return node;
}
function line(slide, x1, y1, x2, y2, color = C.line, width = 2, style = 'solid') {
  return slide.shapes.add({ geometry: 'line', position: { left: x1, top: y1, width: x2 - x1, height: y2 - y1 }, fill: 'none', line: { style, fill: color, width } });
}
function h(slide, x1, x2, y, color = C.line, width = 2, style = 'solid') { return line(slide, x1, y, x2, y, color, width, style); }
function v(slide, x, y1, y2, color = C.line, width = 2, style = 'solid') { return line(slide, x, y1, x, y2, color, width, style); }
function rightArrow(slide, x, y, color = C.navy) {
  const a = slide.shapes.add({ geometry: 'rightArrow', position: { left: x, top: y, width: 11, height: 11 }, fill: color, line: { fill: 'none', width: 0 } });
  return a;
}
function downArrow(slide, x, y, color = C.navy) {
  const a = slide.shapes.add({ geometry: 'downArrow', position: { left: x, top: y, width: 11, height: 11 }, fill: color, line: { fill: 'none', width: 0 } });
  return a;
}
function header(slide, title, subtitle, page) {
  addText(slide, 'BIDSURE', 42, 26, 120, 20, 15, C.navy, true);
  addText(slide, title, 42, 53, 880, 40, 29, C.ink, true);
  addText(slide, subtitle, 44, 98, 980, 18, 12, C.muted, false);
  h(slide, 42, 1238, 126, C.line, 1);
  addText(slide, `SIH26100 | Architecture set ${page} of 5`, 42, 687, 220, 14, 9, C.muted);
  addText(slide, 'Node.js + Express + TypeScript', 1008, 687, 230, 14, 9, C.muted);
}
function notes(slide, text) { slide.speakerNotes.textFrame.setText(text); }

// Slide 1 - System map
{
  const s = pres.slides.add(); s.background.fill = C.white;
  header(s, 'Complete BidSure System Architecture', 'Registration, authentication, evidence, verification, decision and audit operate as one controlled platform', 1);
  zone(s, 36, 150, 155, 490, 'USERS AND WORKSPACES', C.gold, C.goldLine);
  const bidder = card(s, 55, 218, 118, 55, 'Bidder portal', 'Registration and pre-check', C.white, C.goldLine, 10);
  const officer = card(s, 55, 330, 118, 55, 'Officer console', 'Tender review and decision', C.white, C.goldLine, 10);
  const admin = card(s, 55, 442, 118, 55, 'Admin console', 'Rules and source control', C.white, C.goldLine, 10);
  addText(s, 'Organisation profile, role and tender scope determine what each user can access.', 55, 535, 115, 58, 9, C.muted);

  zone(s, 215, 150, 710, 490, 'BIDSURE APPLICATION AND DATA PLATFORM', C.light, C.tealLine);
  addText(s, 'PUBLIC ENTRY', 238, 177, 110, 16, 10, C.blueLine, true);
  const identity = card(s, 240, 203, 135, 62, 'Registration and identity', 'OTP or SSO, organisation profile, RBAC', C.blue, C.blueLine, 10);
  const web = card(s, 400, 203, 125, 62, 'React frontend', 'Bidder and officer views', C.blue, C.blueLine, 10);
  const api = card(s, 550, 190, 160, 82, 'Express API gateway', 'Authentication, routing, policy and OpenAPI contracts', C.teal, C.tealLine, 11);
  const file = card(s, 735, 203, 155, 62, 'Document intake guard', 'Upload, scan, hash and queue', C.blue, C.blueLine, 10);

  addText(s, 'BUSINESS SERVICES', 238, 300, 130, 16, 10, C.tealLine, true);
  const tender = card(s, 240, 330, 125, 65, 'Tender management', 'Tender, clauses, corrigenda, requirements', C.white, C.tealLine, 10);
  const evidence = card(s, 385, 330, 125, 65, 'Evidence service', 'OCR fields, documents, confidence', C.white, C.tealLine, 10);
  const verification = card(s, 530, 330, 125, 65, 'Verification orchestrator', 'Adapter jobs, freshness and conflicts', C.white, C.tealLine, 10);
  const compliance = card(s, 675, 330, 125, 65, 'Compliance engine', 'Rules, findings, score and recommendation', C.gold, C.goldLine, 10);
  const decision = card(s, 820, 330, 75, 65, 'Decision', 'Officer action', C.gold, C.goldLine, 10);

  addText(s, 'CLOUD DATA SERVICES', 238, 430, 140, 16, 10, C.violetLine, true);
  const db = card(s, 240, 460, 125, 65, 'MongoDB', 'Cases, users, rules, findings', C.violet, C.violetLine, 10);
  const cloud = card(s, 385, 460, 125, 65, 'Cloud object storage', 'PDFs, images, versions, exports', C.violet, C.violetLine, 10);
  const queue = card(s, 530, 460, 125, 65, 'Redis and BullMQ', 'OCR, adapters, retries and schedules', C.violet, C.violetLine, 10);
  const audit = card(s, 675, 460, 125, 65, 'Audit store', 'Access, evidence, rule and decision events', C.violet, C.violetLine, 10);
  const rules = card(s, 820, 460, 75, 65, 'Rule registry', 'Versions', C.violet, C.violetLine, 10);

  zone(s, 950, 150, 292, 490, 'INTEGRATION CONTROL PLANE', C.violet, C.violetLine);
  const registry = card(s, 975, 205, 240, 58, 'Source registry and policy', 'Purpose, consent, credentials, rate and freshness rules', C.white, C.violetLine, 10);
  const adapters = card(s, 975, 295, 240, 65, 'Adapter gateway', 'Normalises every source into one verification contract', C.white, C.violetLine, 10);
  const mock = card(s, 975, 400, 110, 70, 'Mock platform', 'Synthetic bidder data and demo APIs', C.green, C.greenLine, 10);
  const live = card(s, 1105, 400, 110, 70, 'Approved sources', 'API Setu and provider APIs', C.white, C.violetLine, 10);
  addText(s, 'Demo and production use the same adapter contract. The source policy decides which one runs.', 980, 505, 230, 45, 9, C.muted);

  // Clean lanes
  h(s, 173, 240, 245, C.goldLine); rightArrow(s, 229, 240, C.goldLine);
  h(s, 173, 240, 357, C.goldLine); rightArrow(s, 229, 352, C.goldLine);
  h(s, 173, 240, 469, C.goldLine); rightArrow(s, 229, 464, C.goldLine);
  h(s, 375, 400, 234, C.blueLine); rightArrow(s, 391, 229, C.blueLine);
  h(s, 525, 550, 234, C.blueLine); rightArrow(s, 541, 229, C.blueLine);
  h(s, 710, 735, 234, C.tealLine); rightArrow(s, 726, 229, C.tealLine);
  v(s, 630, 272, 312, C.tealLine); h(s, 302, 857, 312, C.tealLine);
  [302,447,592,737,857].forEach(x=>{v(s,x,312,330,C.tealLine);downArrow(s,x-5,320,C.tealLine);});
  v(s, 592, 395, 442, C.violetLine); h(s, 302, 857, 442, C.violetLine);
  [302,447,592,737,857].forEach(x=>{v(s,x,442,460,C.violetLine);downArrow(s,x-5,451,C.violetLine);});
  h(s, 655, 975, 362, C.violetLine, 2, 'dashed'); rightArrow(s, 964, 357, C.violetLine);
  v(s, 1095, 263, 295, C.violetLine, 2, 'dashed'); downArrow(s,1090,283,C.violetLine);
  h(s, 1085, 1105, 435, C.violetLine, 2, 'dashed'); rightArrow(s,1095,430,C.violetLine);
  addText(s, 'source request', 785, 367, 86, 14, 9, C.violetLine, true);
  notes(s, 'Complete system architecture requested after team review. The slide shows registration, authentication, frontend, Express API routing, document intake, business services, cloud data services, mock platform, source adapters and approved production sources. The user and earlier project sources define the product requirements.');
}

// Slide 2 - Workflow
{
  const s = pres.slides.add(); s.background.fill = C.white;
  header(s, 'Bid Processing and Verification Workflow', 'The platform keeps every stage visible so officers can understand what happened, why it happened and what requires action', 2);
  addText(s, 'Bidder path', 54, 164, 120, 18, 12, C.goldLine, true);
  addText(s, 'System path', 54, 354, 120, 18, 12, C.tealLine, true);
  addText(s, 'Officer path', 54, 550, 120, 18, 12, C.blueLine, true);

  const a1 = card(s, 170, 155, 150, 70, '1  Register and authenticate', 'OTP or SSO, organisation profile, user role', C.gold, C.goldLine, 11);
  const a2 = card(s, 365, 155, 150, 70, '2  Create tender workspace', 'Tender version, clauses, documents and corrigenda', C.gold, C.goldLine, 11);
  const a3 = card(s, 560, 155, 150, 70, '3  Submit bid package', 'Documents, declarations, certificates and metadata', C.gold, C.goldLine, 11);
  const a4 = card(s, 755, 155, 150, 70, '4  Pre-check status', 'Bidder sees missing or expired documents before submission', C.gold, C.goldLine, 11);
  h(s,320,365,190,C.goldLine);rightArrow(s,354,185,C.goldLine);h(s,515,560,190,C.goldLine);rightArrow(s,549,185,C.goldLine);h(s,710,755,190,C.goldLine);rightArrow(s,744,185,C.goldLine);

  const b1 = card(s, 170, 340, 150, 80, '5  Intake and evidence creation', 'Virus scan, file hash, OCR, document type, extracted fields', C.teal, C.tealLine, 11);
  const b2 = card(s, 365, 340, 150, 80, '6  Source verification', 'Mock or approved adapter returns normalised status and freshness', C.teal, C.tealLine, 11);
  const b3 = card(s, 560, 340, 150, 80, '7  Rule evaluation', 'Tender requirement plus evidence plus source result', C.teal, C.tealLine, 11);
  const b4 = card(s, 755, 340, 150, 80, '8  Risk and recommendation', 'Pass, fail, pending or review required with reasons', C.teal, C.tealLine, 11);
  h(s,320,365,380,C.tealLine);rightArrow(s,354,375,C.tealLine);h(s,515,560,380,C.tealLine);rightArrow(s,549,375,C.tealLine);h(s,710,755,380,C.tealLine);rightArrow(s,744,375,C.tealLine);
  v(s,635,225,320,C.tealLine,2,'dashed');downArrow(s,630,308,C.tealLine);

  const c1 = card(s, 365, 530, 160, 74, '9  Officer evidence review', 'Open source, document and rule evidence before deciding', C.blue, C.blueLine, 11);
  const c2 = card(s, 570, 530, 160, 74, '10  Officer action', 'Qualify, clarify, escalate or disqualify with reason', C.blue, C.blueLine, 11);
  const c3 = card(s, 775, 530, 160, 74, '11  Audit and report', 'Frozen decision input, event log and export', C.blue, C.blueLine, 11);
  h(s,525,570,567,C.blueLine);rightArrow(s,554,562,C.blueLine);h(s,730,775,567,C.blueLine);rightArrow(s,759,562,C.blueLine);
  v(s,830,420,510,C.blueLine,2,'dashed');downArrow(s,825,498,C.blueLine);

  zone(s, 965, 150, 270, 455, 'CONDITIONS AND EXCEPTIONS', C.light, C.darkLine);
  card(s, 990, 205, 220, 63, 'Low OCR confidence', 'Route to manual evidence correction. Do not evaluate uncertain values as a pass.', C.rose, C.roseLine, 10);
  card(s, 990, 295, 220, 63, 'Source unavailable or rate limited', 'Set Pending Re-verification. Retry under source policy.', C.violet, C.violetLine, 10);
  card(s, 990, 385, 220, 63, 'Mandatory requirement failed', 'Show the rule, linked evidence and permitted officer action.', C.rose, C.roseLine, 10);
  card(s, 990, 475, 220, 63, 'Data conflict', 'Set Review Required. Preserve both sources and their timestamps.', C.gold, C.goldLine, 10);
  notes(s, 'End-to-end workflow. Stage 1 to 4 describes user onboarding and submission. Stage 5 to 8 describes system processing and verification. Stage 9 to 11 describes the procurement officer review, decision and audit. Exception states prevent silent passes.');
}

// Slide 3 - AI
{
  const s = pres.slides.add(); s.background.fill = C.white;
  header(s, 'AI and Document Intelligence Architecture', 'AI structures evidence and produces explanations. Rules and officers control the compliance outcome', 3);
  zone(s, 42, 150, 220, 470, 'UNTRUSTED INPUTS', C.gold, C.goldLine);
  card(s, 68, 210, 168, 58, 'Tender documents', 'ATC, STC, corrigenda and requirement clauses', C.white, C.goldLine, 10);
  card(s, 68, 300, 168, 58, 'Bidder documents', 'Certificates, declarations, authorisations and financial evidence', C.white, C.goldLine, 10);
  card(s, 68, 390, 168, 58, 'Source responses', 'Mock and provider responses in source-specific formats', C.white, C.goldLine, 10);
  addText(s, 'Documents can contain misleading text. BidSure treats every uploaded document as data, never as instructions.', 68, 500, 168, 54, 9, C.muted);

  zone(s, 290, 150, 620, 470, 'CONTROLLED AI AND EVIDENCE PIPELINE', C.light, C.tealLine);
  const guard = card(s, 320, 205, 125, 70, 'File guard', 'Type and size checks, virus scan, hash, object storage', C.teal, C.tealLine, 10);
  const ocr = card(s, 475, 205, 125, 70, 'OCR worker', 'Page text, bounding boxes and confidence', C.teal, C.tealLine, 10);
  const classify = card(s, 630, 205, 125, 70, 'Classifier', 'Document type and issuer pattern', C.teal, C.tealLine, 10);
  const extract = card(s, 785, 205, 95, 70, 'LLM extraction', 'Schema-only output', C.teal, C.tealLine, 10);
  h(s,445,475,240,C.tealLine);rightArrow(s,464,235,C.tealLine);h(s,600,630,240,C.tealLine);rightArrow(s,619,235,C.tealLine);h(s,755,785,240,C.tealLine);rightArrow(s,774,235,C.tealLine);
  const validate = card(s, 395, 350, 160, 76, 'Evidence validator', 'Schema validation, confidence thresholds, entity matching and duplicate detection', C.blue, C.blueLine, 10);
  const facts = card(s, 590, 350, 145, 76, 'Evidence graph', 'Requirement, field, page, source and confidence links', C.blue, C.blueLine, 10);
  const rule = card(s, 770, 350, 110, 76, 'Rule engine', 'Deterministic policy evaluation', C.gold, C.goldLine, 10);
  v(s,833,275,330,C.tealLine);downArrow(s,828,318,C.tealLine);h(s,555,590,388,C.blueLine);rightArrow(s,579,383,C.blueLine);h(s,735,770,388,C.goldLine);rightArrow(s,759,383,C.goldLine);
  const explain = card(s, 495, 480, 150, 70, 'AI explanation layer', 'Plain-language finding summary and clarification questions', C.violet, C.violetLine, 10);
  const officer = card(s, 680, 480, 150, 70, 'Officer review', 'Evidence-linked action and reason capture', C.gold, C.goldLine, 10);
  h(s,645,680,515,C.violetLine);rightArrow(s,669,510,C.violetLine);
  v(s,715,426,468,C.goldLine,2,'dashed');downArrow(s,710,456,C.goldLine);

  zone(s, 940, 150, 295, 470, 'MODEL SAFETY BOUNDARY', C.violet, C.violetLine);
  card(s, 970, 205, 235, 55, 'No direct source access', 'The model cannot call government APIs or use credentials.', C.white, C.violetLine, 10);
  card(s, 970, 290, 235, 55, 'Prompt isolation', 'Document text remains quoted input; system policy stays outside the document.', C.white, C.violetLine, 10);
  card(s, 970, 375, 235, 55, 'Data minimisation', 'Redact or use approved local inference before sending sensitive content to a model.', C.white, C.violetLine, 10);
  card(s, 970, 460, 235, 55, 'Reproducibility', 'Store model/version, prompt template, schema result and reviewer correction.', C.white, C.violetLine, 10);
  notes(s, 'AI architecture. The model processes approved, controlled data and returns only schema-constrained candidates. A deterministic validator and rule engine control compliance outcomes. The officer has final authority. The safety boundary addresses prompt injection, raw data leakage and unsafe automated action.');
}

// Slide 4 - integrations
{
  const s = pres.slides.add(); s.background.fill = C.white;
  header(s, 'Integration and Mock Platform Architecture', 'The same adapter contract supports SIH demo data today and approved government data sources later', 4);
  zone(s, 42, 155, 355, 450, 'BIDSURE VERIFICATION CONTROL', C.light, C.tealLine);
  const policy = card(s, 72, 215, 135, 68, 'Source policy', 'Purpose, consent, role, freshness and retention', C.teal, C.tealLine, 10);
  const registry = card(s, 232, 215, 135, 68, 'Source registry', 'Version, owner, endpoint and credential reference', C.teal, C.tealLine, 10);
  const adapter = card(s, 120, 335, 200, 78, 'Adapter orchestrator', 'Queue, retries, rate limits, circuit breaker and normalised result', C.blue, C.blueLine, 11);
  const contract = card(s, 120, 465, 200, 72, 'Common verification contract', 'Subject, purpose, status, evidence, freshness, response hash and audit ID', C.gold, C.goldLine, 10);
  v(s,220,283,325,C.tealLine);downArrow(s,215,313,C.tealLine);v(s,220,413,455,C.goldLine);downArrow(s,215,443,C.goldLine);

  zone(s, 430, 155, 365, 450, 'SIH DEMO ENVIRONMENT', C.green, C.greenLine);
  const mockData = card(s, 458, 210, 135, 65, 'Synthetic bidder data', 'Good, bad, expired and conflicting cases', C.white, C.greenLine, 10);
  const mockApi = card(s, 625, 210, 135, 65, 'Mock API server', 'Same JSON shape as production adapter', C.white, C.greenLine, 10);
  const mockGst = card(s, 458, 330, 135, 60, 'Mock GST and Udyam', 'Status and identity examples', C.white, C.greenLine, 10);
  const mockDocs = card(s, 625, 330, 135, 60, 'Mock DigiLocker and MCA', 'Document and entity examples', C.white, C.greenLine, 10);
  const mockFail = card(s, 540, 455, 135, 60, 'Failure simulator', 'Timeout, rate limit and schema change', C.white, C.greenLine, 10);
  v(s,610,275,320,C.greenLine);h(s,525,695,320,C.greenLine);v(s,525,320,330,C.greenLine);downArrow(s,520,318,C.greenLine);v(s,695,320,330,C.greenLine);downArrow(s,690,318,C.greenLine);v(s,610,390,445,C.greenLine);downArrow(s,605,433,C.greenLine);

  zone(s, 825, 155, 410, 450, 'PRODUCTION INTEGRATION PATH', C.violet, C.violetLine);
  const apisetu = card(s, 855, 205, 160, 65, 'API Setu / provider onboarding', 'Approved application, credentials and subscriptions', C.white, C.violetLine, 10);
  const egress = card(s, 1045, 205, 160, 65, 'Egress controls', 'Allowlist, TLS or mTLS, rate policy', C.white, C.violetLine, 10);
  const publicApis = card(s, 855, 330, 160, 65, 'Approved APIs', 'GSTN, Udyam, MCA21 and other authorised services', C.white, C.violetLine, 10);
  const docProof = card(s, 1045, 330, 160, 65, 'Controlled evidence path', 'Document proof when no approved API exists', C.white, C.violetLine, 10);
  const sourceAudit = card(s, 950, 455, 160, 60, 'Source audit record', 'Request, response hash, timestamp and policy decision', C.white, C.violetLine, 10);
  v(s,935,270,320,C.violetLine);downArrow(s,930,308,C.violetLine);v(s,1125,270,320,C.violetLine);downArrow(s,1120,308,C.violetLine);h(s,935,1125,425,C.violetLine);v(s,1030,425,445,C.violetLine);downArrow(s,1025,433,C.violetLine);

  h(s,320,458,375,C.greenLine,2,'dashed');rightArrow(s,447,370,C.greenLine); addText(s, 'demo mode', 345, 354, 85, 14, 9, C.greenLine, true);
  h(s,320,855,425,C.violetLine,2,'dashed');rightArrow(s,844,420,C.violetLine); addText(s, 'approved production route', 525, 405, 160, 14, 9, C.violetLine, true);
  notes(s, 'Integration architecture. The adapter orchestrator always uses the same common verification contract. During SIH, a mock platform returns synthetic data and controlled failures. Production uses API Setu or individually approved provider paths under source policy, consent and credential controls.');
}

// Slide 5 - Cloud
{
  const s = pres.slides.add(); s.background.fill = C.white;
  header(s, 'Cloud Storage, Operations and Security Architecture', 'Cloud storage, worker isolation, secrets, monitoring and recovery support the application without exposing source credentials or evidence', 5);
  zone(s, 42, 150, 210, 460, 'PUBLIC EDGE', C.blue, C.blueLine);
  card(s, 72, 215, 150, 58, 'DNS and TLS', 'HTTPS certificates and domain routing', C.white, C.blueLine, 10);
  card(s, 72, 310, 150, 58, 'WAF and rate limits', 'Threat filtering and request quotas', C.white, C.blueLine, 10);
  card(s, 72, 405, 150, 58, 'Load balancer', 'Routes to frontend and API', C.white, C.blueLine, 10);
  v(s,147,273,300,C.blueLine);downArrow(s,142,288,C.blueLine);v(s,147,368,395,C.blueLine);downArrow(s,142,383,C.blueLine);

  zone(s, 285, 150, 480, 460, 'PRIVATE APPLICATION ZONE', C.light, C.tealLine);
  const frontend = card(s, 315, 210, 125, 60, 'Frontend service', 'React static assets and user session', C.white, C.tealLine, 10);
  const api = card(s, 465, 210, 125, 60, 'Express API', 'Routes, RBAC, policy and cases', C.teal, C.tealLine, 10);
  const worker = card(s, 615, 210, 120, 60, 'Worker service', 'OCR, adapters and reports', C.teal, C.tealLine, 10);
  const monitoring = card(s, 390, 350, 130, 65, 'Monitoring', 'Metrics, traces, alerts and dashboards', C.white, C.tealLine, 10);
  const secrets = card(s, 545, 350, 130, 65, 'Secrets and KMS', 'Credentials, encryption keys and rotation', C.white, C.tealLine, 10);
  h(s,440,465,240,C.tealLine);rightArrow(s,454,235,C.tealLine);h(s,590,615,240,C.tealLine);rightArrow(s,604,235,C.tealLine);v(s,527,270,335,C.tealLine,2,'dashed');downArrow(s,522,323,C.tealLine);v(s,675,270,335,C.tealLine,2,'dashed');downArrow(s,670,323,C.tealLine);

  zone(s, 795, 150, 440, 460, 'PRIVATE CLOUD DATA ZONE', C.violet, C.violetLine);
  const mongo = card(s, 825, 210, 120, 65, 'Managed MongoDB', 'Encrypted metadata and records', C.white, C.violetLine, 10);
  const storage = card(s, 970, 210, 120, 65, 'Cloud object storage', 'Encrypted files, versions and backups', C.white, C.violetLine, 10);
  const redis = card(s, 1115, 210, 90, 65, 'Redis', 'Jobs and cache', C.white, C.violetLine, 10);
  const audit = card(s, 825, 350, 120, 65, 'Audit retention', 'Append-only events and exports', C.white, C.violetLine, 10);
  const backup = card(s, 970, 350, 120, 65, 'Backup vault', 'Encrypted snapshots and restore tests', C.white, C.violetLine, 10);
  const egress = card(s, 1115, 350, 90, 65, 'Egress', 'Approved APIs', C.white, C.violetLine, 10);
  h(s,885,1115,300,C.violetLine);v(s,885,300,340,C.violetLine);downArrow(s,880,328,C.violetLine);v(s,1030,300,340,C.violetLine);downArrow(s,1025,328,C.violetLine);v(s,1160,275,340,C.violetLine);downArrow(s,1155,328,C.violetLine);

  h(s,222,315,435,C.blueLine);rightArrow(s,304,430,C.blueLine); h(s,735,825,240,C.violetLine);rightArrow(s,814,235,C.violetLine);
  h(s,735,1115,260,C.violetLine,2,'dashed');rightArrow(s,1104,255,C.violetLine);
  addText(s, 'application reads and writes through private service identities', 700, 280, 300, 15, 9, C.violetLine, true);
  addText(s, 'No database, object storage, worker or credential service is public.', 320, 505, 730, 20, 13, C.navy, true);
  addText(s, 'Security operations: least-privilege service identities, private network routes, encryption at rest and in transit, short-lived credentials, restore tests and alerting.', 320, 540, 760, 32, 10, C.muted);
  notes(s, 'Cloud and operations architecture. The application has a public edge, private application zone and private cloud data zone. Cloud object storage is explicitly included for original documents, versions, exports and backups. Database, storage, workers and secrets are not publicly accessible.');
}

const candidate = path.join(tmpDir, 'BidSure_Complete_Architecture_candidate.pptx');
await (await PresentationFile.exportPptx(pres)).save(candidate);
for (let i = 0; i < pres.slides.items.length; i++) {
  const png = await pres.export({ slide: pres.slides.items[i], format: 'png', scale: 1 });
  await fs.writeFile(path.join(tmpDir, `complete-architecture-${i+1}.png`), new Uint8Array(await png.arrayBuffer()));
}
const result = await finalizePresentation({
  workspaceDir,
  candidatePath: candidate,
  finalPath,
  pythonExecutable: 'C:/Users/hp/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  integrityValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-heading-fit'],
  requirements: { explicitTotalSlideCount: 5, requiredNativeTableOwnerSlides: [], requiredNativeChartOwnerSlides: [] },
  fontPolicy: { basis: 'design', families: [family] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(tmpDir, 'BidSure_Complete_Architecture_validation.json'),
});
console.log(JSON.stringify(result, null, 2));
