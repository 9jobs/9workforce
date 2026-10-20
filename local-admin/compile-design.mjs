import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(root,'src/design');fs.mkdirSync(out,{recursive:true});
const unknown=new Set();const styles=[];
const simple={
  flex:'display:flex',grid:'display:grid',block:'display:block',inline:'display:inline',
  relative:'position:relative',absolute:'position:absolute',
  'flex-col':'flex-direction:column','flex-wrap':'flex-wrap:wrap','flex-row':'flex-direction:row',
  'shrink-0':'flex-shrink:0','content-stretch':'align-content:stretch','content-center':'align-content:center',
  'items-start':'align-items:flex-start','items-center':'align-items:center','items-end':'align-items:flex-end','items-baseline':'align-items:baseline',
  'self-center':'align-self:center','self-stretch':'align-self:stretch','py-px':'padding-block:1px','w-px':'width:1px','opacity-40':'opacity:.4',
  'font-bold':'font-weight:700','font-semibold':'font-weight:600','font-medium':'font-weight:500','font-normal':'font-weight:400',
  'justify-center':'justify-content:center','justify-between':'justify-content:space-between','justify-end':'justify-content:flex-end',
  'justify-self-stretch':'justify-self:stretch','self-start':'align-self:flex-start',
  'overflow-clip':'overflow:clip','overflow-hidden':'overflow:hidden','overflow-auto':'overflow:auto',
  'whitespace-nowrap':'white-space:nowrap','text-ellipsis':'text-overflow:ellipsis',
  'not-italic':'font-style:normal',uppercase:'text-transform:uppercase',
  'text-center':'text-align:center','text-right':'text-align:right','text-white':'color:#fff','bg-white':'background-color:#fff',
  'max-w-none':'max-width:none','min-w-px':'min-width:1px','min-h-px':'min-height:1px',
  'w-full':'width:100%','h-full':'height:100%','size-full':'width:100%;height:100%',
  'inset-0':'inset:0','left-0':'left:0','right-0':'right:0','top-0':'top:0','bottom-0':'bottom:0',
  'top-1/2':'top:50%','right-1/4':'right:25%','-translate-y-1/2':'transform:translateY(-50%)',
  'pointer-events-none':'pointer-events:none','opacity-75':'opacity:.75','row-1':'grid-row:1',
  'mb-0':'margin-bottom:0','pb-px':'padding-bottom:1px','pt-px':'padding-top:1px',
  border:'border-width:1px','border-0':'border-width:0','border-t':'border-top-width:1px','border-solid':'border-style:solid','bg-clip-padding':'background-clip:padding-box',
  '[word-break:break-word]':'overflow-wrap:break-word',
};
const properties={'w':'width','h':'height','min-w':'min-width','min-h':'min-height','max-w':'max-width','max-h':'max-height','top':'top','bottom':'bottom','left':'left','right':'right','inset':'inset','gap':'gap','gap-x':'column-gap','gap-y':'row-gap','leading':'line-height','tracking':'letter-spacing','mb':'margin-bottom','mt':'margin-top','ml':'margin-left','mr':'margin-right','p':'padding','pl':'padding-left','pr':'padding-right','pt':'padding-top','pb':'padding-bottom','rounded':'border-radius','rounded-tl':'border-top-left-radius','rounded-tr':'border-top-right-radius','col':'grid-column','grid-cols':'grid-template-columns','grid-rows':'grid-template-rows','shadow':'box-shadow','border':'border-color'};
function declaration(token){
  if(simple[token])return simple[token];
  const font=token.match(/^font-\['Liberation_Serif:(Bold|Regular)'\]$/);
  if(font)return `font-family:'Liberation Serif','Times New Roman',serif;font-weight:${font[1]==='Bold'?700:400}`;
  const sans=token.match(/^font-\['(Inter|Plus_Jakarta_Sans):(Bold|Semi_Bold|Regular|Medium)'\]$/);
  if(sans)return `font-family:'${sans[1].replaceAll('_',' ')}',Arial,sans-serif;font-weight:${({Bold:700,Semi_Bold:600,Medium:500,Regular:400})[sans[2]]}`;
  const m=token.match(/^(.+?)-\[(.*)\]$/);if(m){
    const prefix=m[1],value=m[2].replaceAll('_',' ');
    if(prefix==='text')return /^(#|rgb|hsl)/.test(value)?`color:${value}`:`font-size:${value}`;
    if(prefix==='bg')return `background-color:${value}`;
    if(prefix==='size')return `width:${value};height:${value}`;
    if(prefix==='px')return `padding-left:${value};padding-right:${value}`;
    if(prefix==='py')return `padding-top:${value};padding-bottom:${value}`;
    if(prefix==='flex')return `flex:${value}`;
    if(prefix==='blur')return `filter:blur(${value})`;
    if(prefix==='backdrop-blur')return `backdrop-filter:blur(${value})`;
    if(prefix==='drop-shadow')return `filter:drop-shadow(${value})`;
    if(properties[prefix])return `${properties[prefix]}:${value.replace(/calc\(([^)]+)\)/g,(_,x)=>`calc(${x.replace(/([+-])/g,' $1 ')})`)}`;
  }
  unknown.add(token);return '';
}
const sources=fs.readdirSync(path.join(root,'reference')).filter(f=>f.endsWith('.jsx'));
for(const file of sources){
  const name=file.replace('.jsx','');let code=fs.readFileSync(path.join(root,'reference',file),'utf8');let i=0;
  code=code.replace(/const assetPathPrefix = "[^"]+";/,`const assetPathPrefix = "/assets/${name}";`);
  code=code.replace(/className="([^"]+)"/g,(_,list)=>{
    const cls=`design-${name}-${++i}`;styles.push(`.${cls}{${list.split(/\s+/).map(declaration).filter(Boolean).join(';')}}`);return `className="${cls}"`;
  });
  code=code.replace(/<div([^>]*data-name="(?:Button[^"\n]*|Link)"[^>]*)>/g,(match,attrs)=>attrs.trim().endsWith('/')?match:`<div${attrs} role="button" tabIndex={0} data-ui-action="true">`);
  // Keep the Figma input's exact geometry, replacing its static placeholder with a real field.
  code=code.replace(/<div([^>]*data-name="Input"[^>]*)>(?!\s*<\/div>)/g,'<div$1 data-has-field="true"><input className="design-live-input" aria-label="Search dashboard" placeholder="Search workers, employers, jobs..."/>');
  code=code.replace(/<div([^>]*data-name="Input"[^>]*?)\s*\/>/g,'<input$1 type="checkbox" aria-label="Select worker"/>');
  const options={
    '8:3458':['trade','All Trades','Civil Labourer','Carpenter','Scaffolder','Electrician','Trade Assistant'],
    '8:3461':['region','Victorian Region','Melbourne','Geelong','Ballarat','Bendigo'],
    '8:3464':['availability','Availability Status','Available Now','Currently on Site','Unavailable'],
    '8:3467':['credential','Credential Status','Verified','Pending','Expired'],
  };
  code=code.replace(/<div([^>]*data-name="Options"[^>]*)>/g,(match,attrs)=>{
    const id=attrs.match(/data-node-id="([^"]+)"/)?.[1],list=options[id];if(!list)return match;
    return `<div${attrs} data-has-field="true"><select className="design-live-select" aria-label="${list[1]}" data-worker-filter="${list[0]}">${list.slice(1).map((label,index)=>`<option value="${index?label:''}">${label}</option>`).join('')}</select>`;
  });
  code=code.replace(/(<p[^>]*)(>ADMIN PANEL<\/p>)/g,'$1 role="button" tabIndex={0} data-open-roles="true" title="Switch local dashboard"$2');
  code=code.replace(/<div([^>]*data-name="Heading ([123])"[^>]*)>/g,'<div$1 role="heading" aria-level={$2}>');
  code=code.replace(/export default function ([^(]+)\(\) \{/,'export default function $1() {\n  const {records}=usePanel();');
  if(name==='admin')code=code.replace('>94</p>','>{94+records.workers.length}</p>').replace('>38</p>','>{38+records.jobs.length}</p>').replace('>64</p>','>{64+records.applications.length}</p>').replace('>19</p>','>{19+records.requests.length}</p>');
  if(name==='worker')code=code.replace('{`Available Now (Melbourne Metro & West)`}','{records.availability}').replace('>Acknowledge</p>',">{records.acknowledged?'Shift':'Acknowledge'}</p>").replace('>Shift</p>',">{records.acknowledged?'Acknowledged':'Shift'}</p>");
  if(name==='worker')code=code.replace('>3</p>','>{3+records.applications.length}</p>');
  if(name==='worker')code=code.replaceAll('>Admin Console</p>','>Worker Portal</p>').replaceAll('>Victoria Roster</p>','>My Workspace</p>').replaceAll('>Elena Sutherland</p>','>{records.profile.name}</p>').replaceAll('>Authorised Staff</p>','>Worker Account</p>').replaceAll('>Operations Lead</p>','>{records.profile.trade}</p>');
  if(name==='employer')code=code.replaceAll('>Admin Console</p>','>Employer Portal</p>').replaceAll('>Victoria Roster</p>','>Sites &amp; Staffing</p>').replaceAll('>Elena Sutherland</p>','>David Henderson</p>').replaceAll('>Authorised Staff</p>','>Employer Account</p>').replaceAll('>Operations Lead</p>','>Project Director</p>');
  if(name==='employer')code=code.replace('>3 Active</p>','>{3+records.requests.length} Active</p>');
  if(name==='workers-stats')code=code.replace('>1,482</p>','>{(1482+records.workers.length).toLocaleString()}</p>').replace('>94</p>','>{94+records.workers.length}</p>');
  fs.writeFileSync(path.join(out,file),`import React from 'react';\nimport {usePanel} from '../state';\n${code}\n`);
}
fs.writeFileSync(path.join(out,'figma.css'),styles.join('\n'));
console.log(JSON.stringify({components:sources.length,styleRules:styles.length,unconverted:[...unknown]}));
if(unknown.size)process.exitCode=1;
