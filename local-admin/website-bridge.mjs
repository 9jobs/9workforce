import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createAccountAuth} from '../lib/accountAuth.js';
import {accountDatabase} from '../lib/accountDatabase.js';
import {validateWorkerRequest} from '../lib/workerRequest.js';
import {WorkspaceStore} from './store.mjs';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {validateWorkerRegistration,registrationAttachments} from '../lib/workerRegistration.js';
import {ingestWorkerRegistration} from './worker-ingestion.mjs';

const projectRoot=fileURLToPath(new URL('../',import.meta.url));
export async function createWebsiteBridge({authRoot=projectRoot,workspaceDirectory=path.join(projectRoot,'local-admin/data'),googleEnv={}}={}){
 // Explicit SQLite storage and no notifications: never use DATABASE_URL, SMTP or Supabase here.
 const storage=await accountDatabase(authRoot,{});
 const auth=await createAccountAuth(authRoot,googleEnv,{storage,skipNotifications:true});
 // Better Auth starts a background schema check after its context resolves.
 // Let that initialization drain before callers can immediately close a test bridge.
 await new Promise(resolve=>setImmediate(resolve));
 const store=new WorkspaceStore(workspaceDirectory);
 function actor(session,role='employer'){
  if(!session?.user)return null;
  const id='website:'+session.user.id,existing=store.list('users').find(u=>u.id===id);
  if(existing&&existing.status!=='Active')store.fail('Your employer account is not active.',403);
  const user={...existing,id,name:session.user.name,email:session.user.email,role:'employer',status:existing?.status||'Active',source:'website',websiteUserId:session.user.id,createdAt:existing?.createdAt||new Date(session.user.createdAt||Date.now()).toISOString(),lastLogin:new Date(session.session?.createdAt||Date.now()).toISOString()};
  user.accountRoles=[...new Set([...(existing?.accountRoles||[]),role])];user.role=user.accountRoles.includes('employer')?'employer':role;
  try{const providers=storage.database.prepare('SELECT "providerId" FROM account WHERE "userId"=?').all(session.user.id);user.signInMethod=[...new Set(providers.map(p=>p.providerId==='google'?'Google':p.providerId==='credential'?'Email & password':p.providerId))].join(' + ')||existing?.signInMethod||'Not available';}catch{}
  user.emailVerified=Boolean(session.user.emailVerified);
  if(existing?.localOverrides?.name!==undefined)user.name=existing.localOverrides.name;store.put('users',user);return store.publicUser(user);
 }
 function submit(submission,session){
  const input=submission.fields||{};
  if(input.applicationForm==='workerRegistration'){
   if(!session?.user)store.fail('Please sign in before submitting this form.',401);
   const validation=validateWorkerRegistration(input);if(validation)store.fail(validation);registrationAttachments(input);
   return store.transaction(()=>{const user=actor(session,'worker'),fields={...input,accountUserId:session.user.id};const worker=ingestWorkerRegistration(store,{...submission,fields},{...session.user,signInMethod:user.signInMethod},{source:'website',userId:user.id});return {id:submission.id,workerId:worker.id};});
  }
  if(input.applicationForm!=='workerRequest'){
   store.put('submissions',{...submission,fields:{...input,accountUserId:session?.user?.id||''}});return {id:submission.id};
  }
  if(!session?.user)store.fail('Please sign in before submitting this form.',401);
  const validation=validateWorkerRequest(input);if(validation)store.fail(validation);
  return store.transaction(()=>{
   const user=actor(session);
   const fields=Object.fromEntries(['applicationForm','fullName','company','email','phone','siteLocation','workersRequired','workerCount','startDate','requirements'].map(key=>[key,String(input[key]??'').trim()]));
   fields.accountUserId=session.user.id;
   const previous=store.list('requests').find(r=>r.sourceId===submission.id);
   if(previous)return {id:submission.id,requestId:previous.id,employerId:previous.employerId};
   const existing=store.list('employers').find(e=>e.websiteUserId===session.user.id);
   const createdAt=submission.receivedAt||new Date().toISOString();
   const employer={...existing,id:existing?.id||randomUUID(),userId:user.id,websiteUserId:session.user.id,name:fields.fullName,company:fields.company,email:fields.email,phone:fields.phone,location:fields.siteLocation,accountName:session.user.name,accountEmail:session.user.email,accountCreatedAt:new Date(session.user.createdAt||Date.now()).toISOString(),status:existing?.status||'Active',source:'website',createdAt:existing?.createdAt||createdAt,updatedAt:createdAt};
   if(employer.status!=='Active')store.fail('Your employer profile is not active.',403);
   Object.assign(employer,existing?.localOverrides||{});
   store.put('employers',employer);
   const request={id:randomUUID(),employerId:employer.id,position:fields.workersRequired,quantity:fields.workerCount,location:fields.siteLocation,startDate:fields.startDate,description:fields.requirements||'',contactName:fields.fullName,company:fields.company,contactEmail:fields.email,contactPhone:fields.phone,websiteUserId:session.user.id,source:'website',sourceId:submission.id,status:'New',createdAt};
   store.put('requests',request);store.put('submissions',{...submission,fields});
   return {id:submission.id,requestId:request.id,employerId:employer.id};
  });
 }
 return {auth,store,actor,submit,close:async()=>{store.db.close();await auth.close();}};
}
let defaultBridge;
export function getWebsiteBridge(){
 if(defaultBridge)return defaultBridge;
 const googleEnv={};
 try{for(const line of readFileSync(path.join(projectRoot,'.env'),'utf8').split(/\r?\n/)){const match=/^(GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET)\s*=\s*(.*)$/.exec(line);if(match)googleEnv[match[1]]=match[2].replace(/^['"]|['"]$/g,'');}}catch{}
 return defaultBridge=createWebsiteBridge({googleEnv});
}
