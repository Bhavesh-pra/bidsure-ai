import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const workspaceDir = 'C:/Users/hp/OneDrive/Desktop/BidSure';
const skillDir = 'C:/Users/hp/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.11809/skills/presentations';
const tmpDir = path.join(workspaceDir, '.codex-build');
const finalPath = path.join(workspaceDir, 'output/pptx/BidSure_Architecture_Diagram_Node_Express_v2.pptx');
const stagingDir = path.join(workspaceDir, '.codex-finalizer');
await fs.mkdir(tmpDir, { recursive: true });
await fs.mkdir(path.dirname(finalPath), { recursive: true });
await fs.mkdir(stagingDir, { recursive: true });
const { resolvePresentationFont, finalizePresentation } = await import(pathToFileURL(path.join(skillDir, 'container_tools/artifact_tool_utils.mjs')).href);
const family = resolvePresentationFont();

const W = 1280, H = 720;
const C = {
  navy: '#16324F', ink: '#182530', muted: '#52616B', white: '#FFFFFF',
  line: '#78909C', light: '#F4F7F9', blue: '#DCECF7', blueStroke: '#4B88B5',
  teal: '#DFF3EE', tealStroke: '#2A9D8F', gold: '#FFF2C7', goldStroke: '#C9921E',
  violet: '#EDE5F7', violetStroke: '#7A5BA6', red: '#FBE4E4', redStroke: '#B65A5A',
  dark: '#263238', green: '#E5F4E6', greenStroke: '#4B8F58'
};
const pres = Presentation.create({ slideSize: { width: W, height: H } });
const slide = pres.slides.add();
slide.background.fill = C.white;

function box({x,y,w,h,title,body='',fill=C.white,stroke=C.line,titleColor=C.navy,bodyColor=C.muted,fs=13,rounded=true}) {
  const s = slide.shapes.add({ geometry: rounded ? 'roundRect' : 'rect', position:{left:x,top:y,width:w,height:h}, fill, line:{style:'solid',fill:stroke,width:1.6}, borderRadius: rounded ? 12 : 0 });
  s.text = body ? `${title}\n${body}` : title;
  s.text.style = { typeface: family, fontSize: fs, color: bodyColor, bold: false };
  return s;
}
function label(text,x,y,w,h,fs=11,color=C.muted,bold=false) {
  const s = slide.shapes.add({ geometry:'textbox', position:{left:x,top:y,width:w,height:h}, fill:'none', line:{fill:'none',width:0} });
  s.text = text;
  s.text.style = { typeface: family, fontSize: fs, color, bold };
  return s;
}
function zone({x,y,w,h,title,fill,stroke}) {
  const z = slide.shapes.add({ geometry:'roundRect', position:{left:x,top:y,width:w,height:h}, fill, line:{style:'solid',fill:stroke,width:2}, borderRadius:18 });
  z.text = title;
  z.text.style = { typeface: family, fontSize: 13, color: stroke, bold: true };
  return z;
}
function connect(a,b,opts={}) {
  return slide.shapes.connect(a,b,{ kind: opts.kind || 'elbow', fromSide: opts.fromSide, toSide: opts.toSide, line:{style:opts.style || 'solid',fill:opts.color || C.line,width:opts.width || 2}, head:{type:'arrow',width:'sm',length:'sm'} });
}

// Header
label('BIDSURE', 42, 26, 130, 26, 16, C.navy, true);
label('SYSTEM ARCHITECTURE', 42, 54, 540, 42, 31, C.ink, true);
label('Node.js + Express | Evidence-first compliance verification for GeM procurement', 44, 97, 720, 20, 13, C.muted, false);
label('Editable structure diagram', 1088, 32, 150, 18, 10, C.violetStroke, true);

// Top actors / edge
const seller = box({x:42,y:144,w:145,h:56,title:'Bidder',body:'Pre-check portal',fill:C.gold,stroke:C.goldStroke,fs:12});
const officer = box({x:42,y:222,w:145,h:56,title:'Procurement Officer',body:'Review console',fill:C.gold,stroke:C.goldStroke,fs:12});
const edge = zone({x:220,y:136,w:1000,h:172,title:'INTERNET / EDGE NETWORK',fill:'#FBFCFD',stroke:'#A9B7C2'});
const dns = box({x:246,y:185,w:120,h:56,title:'DNS + TLS',body:'HTTPS : 443',fill:C.white,stroke:C.blueStroke,fs:11});
const waf = box({x:396,y:185,w:135,h:56,title:'WAF / Rate limit',body:'Request filtering',fill:C.white,stroke:C.blueStroke,fs:11});
const lb = box({x:562,y:185,w:135,h:56,title:'Load balancer',body:'Public entry route',fill:C.white,stroke:C.blueStroke,fs:11});
const web = box({x:730,y:185,w:135,h:56,title:'Web frontend',body:'React + Vite',fill:C.blue,stroke:C.blueStroke,fs:11});
const api = box({x:885,y:172,w:160,h:82,title:'Express API service',body:'Node.js + TypeScript\nREST / JSON\nJWT / SSO',fill:C.teal,stroke:C.tealStroke,fs:11});

// VPC / private system
const vpc = zone({x:220,y:330,w:1000,h:300,title:'BIDSURE VPC / PRIVATE NETWORK',fill:'#F8FBFC',stroke:C.tealStroke});
const app = zone({x:246,y:370,w:508,h:226,title:'PRIVATE APP SUBNET',fill:'#F0FAF8',stroke:C.tealStroke});
const data = zone({x:784,y:370,w:410,h:226,title:'PRIVATE DATA SUBNET',fill:'#F5F2FA',stroke:C.violetStroke});

const tender = box({x:270,y:416,w:140,h:62,title:'Tender & bid\nservice',body:'Case lifecycle',fill:C.white,stroke:C.tealStroke,fs:11});
const doc = box({x:430,y:416,w:140,h:62,title:'Document\nintelligence',body:'OCR + extraction',fill:C.white,stroke:C.tealStroke,fs:11});
const verify = box({x:590,y:416,w:140,h:62,title:'Verification\nservice',body:'Adapters + checks',fill:C.white,stroke:C.tealStroke,fs:11});
const rules = box({x:350,y:505,w:180,h:62,title:'Compliance engine',body:'Versioned TypeScript rules',fill:C.blue,stroke:C.blueStroke,fs:11});
const decision = box({x:550,y:505,w:180,h:62,title:'Risk + decision',body:'Recommendation only',fill:C.gold,stroke:C.goldStroke,fs:11});

const mongo = box({x:806,y:408,w:170,h:62,title:'MongoDB',body:'Cases, rules, findings',fill:C.white,stroke:C.violetStroke,fs:11});
const object = box({x:994,y:408,w:170,h:62,title:'Object storage',body:'PDFs, images, hashes',fill:C.white,stroke:C.violetStroke,fs:11});
const redis = box({x:806,y:496,w:170,h:62,title:'Redis + BullMQ',body:'Jobs, retries, queues',fill:C.white,stroke:C.violetStroke,fs:11});
const audit = box({x:994,y:496,w:170,h:62,title:'Audit log',body:'Append-only events',fill:C.white,stroke:C.violetStroke,fs:11});

// External integration zone
const gov = zone({x:220,y:650,w:1000,h:54,title:'EXTERNAL AUTHORISED SOURCES / ADAPTERS',fill:'#F8F7FC',stroke:C.violetStroke});
const portals = label('GSTN  |  Udyam  |  MCA21  |  DigiLocker  |  EPFO / ESIC  |  Startup India  |  GeM / CPPP', 252, 670, 930, 18, 12, C.violetStroke, true);

// Routes: actors to edge
connect(seller,dns,{fromSide:'right',toSide:'left',color:C.goldStroke});
connect(officer,dns,{fromSide:'right',toSide:'left',color:C.goldStroke});
connect(dns,waf,{fromSide:'right',toSide:'left',color:C.blueStroke});
connect(waf,lb,{fromSide:'right',toSide:'left',color:C.blueStroke});
connect(lb,web,{fromSide:'right',toSide:'left',color:C.blueStroke});
connect(web,api,{fromSide:'right',toSide:'left',color:C.tealStroke});
connect(lb,api,{fromSide:'bottom',toSide:'top',color:C.tealStroke});

// Internal routes
connect(api,tender,{fromSide:'bottom',toSide:'top',color:C.tealStroke});
connect(api,doc,{fromSide:'bottom',toSide:'top',color:C.tealStroke});
connect(api,verify,{fromSide:'bottom',toSide:'top',color:C.tealStroke});
connect(tender,rules,{fromSide:'bottom',toSide:'top',color:C.line});
connect(doc,rules,{fromSide:'bottom',toSide:'top',color:C.line});
connect(verify,rules,{fromSide:'bottom',toSide:'top',color:C.line});
connect(rules,decision,{fromSide:'right',toSide:'left',color:C.goldStroke});
connect(decision,api,{fromSide:'top',toSide:'bottom',color:C.goldStroke,style:'dashed'});

// Data routes
connect(tender,mongo,{fromSide:'right',toSide:'left',color:C.violetStroke});
connect(doc,object,{fromSide:'right',toSide:'left',color:C.violetStroke});
connect(verify,redis,{fromSide:'right',toSide:'left',color:C.violetStroke,style:'dashed'});
connect(decision,audit,{fromSide:'right',toSide:'left',color:C.violetStroke});
connect(api,audit,{fromSide:'right',toSide:'top',color:C.violetStroke,style:'dashed'});

// External adapter route
connect(verify,portals,{fromSide:'bottom',toSide:'top',color:C.violetStroke,style:'dashed'});
connect(doc,portals,{fromSide:'bottom',toSide:'top',color:C.violetStroke,style:'dashed'});

// Route labels / legend
label('HTTPS : 443', 270, 164, 90, 15, 10, C.blueStroke, true);
label('REST / JSON', 865, 159, 100, 15, 10, C.tealStroke, true);
label('internal service calls', 486, 318, 160, 15, 10, C.muted, false);
label('async jobs', 709, 448, 75, 15, 10, C.violetStroke, true);
label('source verification', 660, 618, 130, 15, 10, C.violetStroke, true);
label('solid = synchronous request', 910, 92, 145, 15, 10, C.muted, false);
label('dashed = async / external', 1060, 92, 160, 15, 10, C.muted, false);

// Right tech stack strip
const stack = box({x:1065,y:144,w:155,h:116,title:'TECH STACK',body:'React + Vite\nNode.js + Express\nTypeScript\nMongoDB\nRedis + BullMQ\nObject storage',fill:C.white,stroke:C.navy,fs:9});
stack.text.style = { typeface: family, fontSize: 10, color: C.muted };

slide.speakerNotes.textFrame.setText('Architecture diagram for BidSure SIH26100. The diagram reflects the revised stack requested by the user: Node.js and Express replace Python and Flask/FastAPI. External government integrations are represented as authorised adapters and should use approved APIs, sandbox data or mock responses for the hackathon. Human officer authority remains outside the automated decision engine.');

const candidate = path.join(tmpDir, 'BidSure_Architecture_Diagram_candidate.pptx');
await (await PresentationFile.exportPptx(pres)).save(candidate);
const png = await slide.export({ format:'png', scale:1 });
await fs.writeFile(path.join(tmpDir, 'architecture-preview.png'), new Uint8Array(await png.arrayBuffer()));

const result = await finalizePresentation({
  workspaceDir,
  candidatePath: candidate,
  finalPath,
  pythonExecutable: 'C:/Users/hp/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  integrityValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-heading-fit'],
  requirements: { explicitTotalSlideCount: 1, requiredNativeTableOwnerSlides: [], requiredNativeChartOwnerSlides: [] },
  fontPolicy: { basis:'design', families:[family] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(tmpDir, 'BidSure_Architecture_Diagram_validation_v2.json'),
});
console.log(JSON.stringify(result, null, 2));
