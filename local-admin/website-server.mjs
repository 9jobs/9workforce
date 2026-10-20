// Local website entry point. Uses existing public React pages and Better Auth,
// with a local submission sink; it never loads production database or mail credentials.
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createServer as createViteServer} from 'vite';
import {getWebsiteBridge} from './website-bridge.mjs';
import {devServerIdentity} from '../lib/devServerIdentity.js';
import {searchVictoriaLocations} from '../lib/victoriaLocations.js';
import {validateWorkerRegistration,registrationAttachments} from '../lib/workerRegistration.js';
import {validateRoleApplication,validateJoinTeam} from '../lib/applicationValidation.js';
import {validateContactEnquiry} from '../lib/contactEnquiry.js';
import {publicJobs} from './public-jobs.mjs';

export function websiteApi(bridge,{root=fileURLToPath(new URL('../',import.meta.url))}={}){
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
 return async(req,res,next)=>{
  const url=new URL(req.url,'http://127.0.0.1');
  if(!url.pathname.startsWith('/api/'))return next();
  try{
   if(req.headers.host&&!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host))return send(res,403,{error:'Local development only.'});
   if(req.method!=='GET'&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(res,403,{error:'Cross-origin writes are not allowed.'});
   if(url.pathname==='/api/jobs')return req.method==='GET'?send(res,200,{jobs:publicJobs(bridge.store)}):send(res,405,{error:'Manage job posts through the Admin panel.'});
   if(url.pathname==='/api/dev/status')return send(res,200,{...devServerIdentity(root),localWorkspaceConnected:true});
   if(url.pathname==='/api/account/config')return send(res,200,{googleEnabled:bridge.auth.googleEnabled});
   if(url.pathname==='/api/account/google')return bridge.auth.startGoogle(req,res);
   if(url.pathname.startsWith('/api/auth/'))return bridge.auth.handler(req,res);
   if(url.pathname==='/api/locations')return send(res,200,{results:await searchVictoriaLocations(url.searchParams.get('q'))});
   if(url.pathname!=='/api/submissions'||req.method!=='POST')return send(res,404,{error:'Not found'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>4500000)throw Object.assign(new Error('Request too large.'),{status:413});}
   let input;try{input=JSON.parse(raw);}catch{return send(res,400,{error:'Invalid JSON.'});}
   const fields=Object.fromEntries(Object.entries(input.fields||{}).map(([key,value])=>[key,String(value??'').trim().slice(0,['resumeData','coverLetterData'].includes(key)?4200000:4000)]));
   const protectedForm=input.type==='employer'||['workerRequest','workerRegistration','roleApplication','joinTeam'].includes(fields.applicationForm);
   const session=protectedForm?await bridge.auth.getSession(req):null;
   if(protectedForm&&!session)return send(res,401,{error:'Please sign in before submitting this form.',code:'SIGN_IN_REQUIRED'});
   if(session)fields.accountUserId=session.user.id;
   const validator={workerRegistration:validateWorkerRegistration,roleApplication:validateRoleApplication,joinTeam:validateJoinTeam,contactEnquiry:validateContactEnquiry}[fields.applicationForm];
   const error=validator?.(fields);if(error)return send(res,400,{error});
   if(['workerRegistration','roleApplication'].includes(fields.applicationForm))registrationAttachments(fields);
   if(!fields.email)return send(res,400,{error:'Email is required.'});
   const result=bridge.submit({id:randomUUID(),type:input.type==='employer'?'employer':'contact',receivedAt:new Date().toISOString(),fields},session);
   return send(res,200,{ok:true,message:'Thanks — your details have been received.',...result});
  }catch(error){send(res,error.status||400,{error:error.status?error.message:'Unable to save this submission. Please check your details and try again.'});}
 };
}

export async function startWebsite({port=3001,root=fileURLToPath(new URL('../',import.meta.url)),bridge,cacheDirectory}={}){
 bridge??=await getWebsiteBridge();
 const vite=await createViteServer({configFile:false,root,...(cacheDirectory?{cacheDir:cacheDirectory}:{}),server:{middlewareMode:true,hmr:{port:port+10000},watch:{ignored:['**/data/**','**/.npm-cache/**','**/scratch/**','**/local-admin/**']},fs:{deny:['.env','.env.*','**/data/**','**/*.sqlite*','**/auth-secret','**/*.pem']}}});
 const handler=websiteApi(bridge,{root});
 const server=http.createServer((req,res)=>handler(req,res,()=>vite.middlewares(req,res)));
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 let alias;
 if(port===3001){
  alias=http.createServer((req,res)=>{res.writeHead(307,{Location:`http://127.0.0.1:3001${req.url}`,'Cache-Control':'no-store'});res.end();});
  alias.on('error',()=>console.log('Local alias port 3000 is occupied. Use http://127.0.0.1:3001.'));
  alias.listen(3000,'127.0.0.1');server.on('close',()=>alias.close());
 }
 console.log(`Local website: http://127.0.0.1:${server.address().port} (forms connected to local admin; no production/email writes)`);
 return {server,vite,bridge,close:async()=>{await new Promise(resolve=>server.close(resolve));await vite.close();}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 let configuredPort;try{configuredPort=readFileSync(new URL('../.env',import.meta.url),'utf8').match(/^PORT\s*=\s*['"]?(\d+)/m)?.[1];}catch{}
 await startWebsite({port:Number(process.env.PORT||configuredPort||3001)});
}
