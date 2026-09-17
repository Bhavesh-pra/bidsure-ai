import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir='C:/Users/hp/OneDrive/Desktop/BidSure';
const skillDir='C:/Users/hp/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.11809/skills/presentations';
const tmpDir=path.join(workspaceDir,'.codex-build');
const finalPath=path.join(workspaceDir,'output/pptx/BidSure_Architecture_Diagram_Clean_v3.pptx');
await fs.mkdir(tmpDir,{recursive:true}); await fs.mkdir(path.dirname(finalPath),{recursive:true});
const {resolvePresentationFont,finalizePresentation}=await import(pathToFileURL(path.join(skillDir,'container_tools/artifact_tool_utils.mjs')).href);
const family=resolvePresentationFont();
const W=1280,H=720;
const C={ink:'#182530',navy:'#16324F',muted:'#52616B',line:'#8EA1AC',blue:'#DCECF7',blueLine:'#4B88B5',teal:'#E2F4EF',tealLine:'#2A9D8F',violet:'#F0EAF8',violetLine:'#73559B',gold:'#FFF2C7',goldLine:'#C9921E',white:'#FFFFFF',bg:'#FBFCFD'};
const p=Presentation.create({slideSize:{width:W,height:H}}); const s=p.slides.add(); s.background.fill=C.white;
function shape(geometry,x,y,w,h,fill,stroke){const cfg={geometry,position:{left:x,top:y,width:w,height:h},fill,line:{style:'solid',fill:stroke,width:1.5}};if(geometry==='roundRect')cfg.borderRadius=12;return s.shapes.add(cfg);}
function text(txt,x,y,w,h,size=12,color=C.ink,bold=false){const o=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});o.text=txt;o.text.style={typeface:family,fontSize:size,color,bold};return o;}
function card(x,y,w,h,title,body,fill,stroke,fs=11){const o=shape('roundRect',x,y,w,h,fill,stroke);o.text=body?`${title}\n${body}`:title;o.text.style={typeface:family,fontSize:fs,color:C.ink};return o;}
function zone(x,y,w,h,title,fill,stroke){const o=shape('roundRect',x,y,w,h,fill,stroke);o.text=title;o.text.style={typeface:family,fontSize:12,color:stroke,bold:true};return o;}
function line(x1,y1,x2,y2,color=C.line,width=2,style='solid'){return s.shapes.add({geometry:'line',position:{left:x1,top:y1,width:x2-x1,height:y2-y1},fill:'none',line:{style,fill:color,width}});}
function hline(x1,x2,y,color=C.line,width=2,style='solid'){return line(x1,y,x2,y,color,width,style)}
function vline(x,y1,y2,color=C.line,width=2,style='solid'){return line(x,y1,x,y2,color,width,style)}
function arrowRight(x,y,color=C.navy){const a=shape('rightArrow',x,y,10,10,color,color);a.line={fill:'none',width:0};return a;}
function arrowDown(x,y,color=C.navy){const a=shape('downArrow',x,y,10,10,color,color);a.line={fill:'none',width:0};return a;}

// Header
text('BIDSURE',42,25,130,22,16,C.navy,true); text('SECURE SYSTEM ARCHITECTURE',42,53,600,38,30,C.ink,true); text('SIH26100 | Node.js + Express | Controlled verification broker',44,96,600,18,12,C.muted);
text('Structure first. Routes second. Evidence always.',840,54,390,24,13,C.violetLine,true);

// Main zones
zone(35,135,145,455,'CLIENTS',C.gold,C.goldLine);
zone(205,135,720,455,'BIDSURE PRIVATE NETWORK',C.bg,C.tealLine);
zone(950,135,295,455,'AUTHORISED EXTERNAL SOURCES',C.violet,C.violetLine);

// Clients
const bidder=card(52,205,110,62,'Bidder','Pre-check',C.white,C.goldLine); const officer=card(52,315,110,62,'Officer','Review console',C.white,C.goldLine); const auditor=card(52,425,110,62,'Auditor','Read-only export',C.white,C.goldLine);
text('All clients use HTTPS. No external portal credentials reach the browser.',48,505,120,62,9,C.muted);

// Edge row
text('PUBLIC EDGE',230,166,120,18,10,C.blueLine,true);
const waf=card(235,190,125,58,'WAF /\nrate limit','Ingress policy',C.blue,C.blueLine,10);
const web=card(405,190,125,58,'React + Vite','Frontend',C.blue,C.blueLine,10);
const api=card(575,180,180,78,'Express API','Node.js + TypeScript\nREST / JSON | OIDC',C.teal,C.tealLine,11);
const egress=card(790,190,105,58,'Egress\ngateway','Allowlisted routes',C.white,C.tealLine,10);

// Core services
text('CONTROL PLANE',230,282,150,18,10,C.tealLine,true);
const cases=card(235,320,140,64,'Tender + case','Versions, clauses',C.white,C.tealLine,10);
const docs=card(405,320,140,64,'Document + evidence','OCR, hashes, fields',C.white,C.tealLine,10);
const verify=card(575,320,140,64,'Verification','Adapters, freshness',C.white,C.tealLine,10);
const rules=card(745,320,140,64,'Rules + decision','Score, review, audit',C.gold,C.goldLine,10);

// Data services
text('DATA PLANE',230,418,150,18,10,C.violetLine,true);
const db=card(235,455,140,64,'MongoDB','Case metadata',C.violet,C.violetLine,10);
const obj=card(405,455,140,64,'Object storage','Documents, hashes',C.violet,C.violetLine,10);
const queue=card(575,455,140,64,'Redis + BullMQ','Async jobs',C.violet,C.violetLine,10);
const audit=card(745,455,140,64,'Audit store','Append-only events',C.violet,C.violetLine,10);

// External sources
const apiSetu=card(980,190,235,52,'API Setu / approved APIs','Provider onboarding + consent',C.white,C.violetLine,10);
const tax=card(980,275,110,54,'GSTN / PAN','Status + identity',C.white,C.violetLine,9);
const msme=card(1105,275,110,54,'Udyam / NSIC','MSE evidence',C.white,C.violetLine,9);
const corp=card(980,365,110,54,'MCA21 / DPIIT','Entity + startup',C.white,C.violetLine,9);
const docsExt=card(1105,365,110,54,'DigiLocker','Issuer documents',C.white,C.violetLine,9);
const labour=card(980,455,110,54,'EPFO / ESIC','Where applicable',C.white,C.violetLine,9);
const bis=card(1105,455,110,54,'BIS / debarment','Product + exclusion',C.white,C.violetLine,9);

// Clean route lanes - clients -> edge
hline(162,235,220,C.goldLine,2); arrowRight(225,215,C.goldLine); text('HTTPS',182,201,42,14,9,C.goldLine,true);
hline(162,235,330,C.goldLine,2); arrowRight(225,325,C.goldLine);
hline(162,235,440,C.goldLine,2); arrowRight(225,435,C.goldLine);

// Edge chain, all on one lane
hline(360,405,219,C.blueLine,2); arrowRight(398,214,C.blueLine);
hline(530,575,219,C.blueLine,2); arrowRight(568,214,C.blueLine);
hline(755,790,219,C.tealLine,2); arrowRight(783,214,C.tealLine);
text('request path',410,160,80,14,9,C.blueLine,true);

// API bus to control plane - lines run in whitespace only
vline(665,258,294,C.tealLine,2); hline(305,855,294,C.tealLine,2); text('internal service route',520,268,120,14,9,C.tealLine,true);
for (const x of [305,475,645,815]) { vline(x,294,320,C.tealLine,2); arrowDown(x-5,312,C.tealLine); }

// Control plane bus to data plane
vline(645,384,430,C.violetLine,2); hline(305,815,430,C.violetLine,2); text('evidence and event writes',470,400,145,14,9,C.violetLine,true);
for (const x of [305,475,645,815]) { vline(x,430,455,C.violetLine,2); arrowDown(x-5,447,C.violetLine); }

// Verification to egress, then external source bus
hline(715,790,352,C.violetLine,2,'dashed'); arrowRight(782,347,C.violetLine); text('approved source call',730,365,110,14,9,C.violetLine,true);
hline(895,970,219,C.violetLine,2,'dashed'); arrowRight(962,214,C.violetLine);
vline(952,219,530,C.violetLine,2,'dashed');
for (const y of [216,302,392,482]) { hline(952,980,y,C.violetLine,2,'dashed'); arrowRight(972,y-5,C.violetLine); }
// source grouping labels
text('source-specific adapter contracts',976,530,235,16,9,C.violetLine,true);

// bottom legend and technology strip
text('ROUTE LEGEND',42,625,100,16,10,C.navy,true); hline(142,190,633,C.navy,2); text('synchronous',198,625,80,16,9,C.muted); hline(290,338,633,C.violetLine,2,'dashed'); text('external / async',346,625,100,16,9,C.muted);
text('TECHNOLOGY BASELINE',500,625,150,16,10,C.navy,true); text('React + Vite  |  Node.js 24 LTS  |  Express 5  |  TypeScript  |  MongoDB  |  Redis + BullMQ  |  S3-compatible storage',500,645,700,18,9,C.muted);
text('Human officer decision remains the final qualification authority.',500,669,500,16,10,C.goldLine,true);

s.speakerNotes.textFrame.setText('Cleaned architecture diagram for BidSure SIH26100. This version uses dedicated horizontal and vertical connector lanes so lines do not pass through component boxes. The architecture shows clients, public edge, private control/data planes, egress gateway, and authorised external sources. Node.js and Express replace Python and Flask/FastAPI. External integration requires provider approval, scoped credentials, consent or authority, and source-specific contracts.');

const candidate=path.join(tmpDir,'BidSure_Architecture_Diagram_Clean_candidate.pptx'); await (await PresentationFile.exportPptx(p)).save(candidate);
await fs.writeFile(path.join(tmpDir,'architecture-clean-preview.png'),new Uint8Array(await (await s.export({format:'png',scale:1})).arrayBuffer()));
const result=await finalizePresentation({workspaceDir,candidatePath:candidate,finalPath,pythonExecutable:'C:/Users/hp/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',integrityValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skillDir,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit'],requirements:{explicitTotalSlideCount:1,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[]},fontPolicy:{basis:'design',families:[family]},verifyArtifactToolImport:true,receiptPath:path.join(tmpDir,'BidSure_Architecture_Diagram_Clean_validation.json')});
console.log(JSON.stringify(result,null,2));
