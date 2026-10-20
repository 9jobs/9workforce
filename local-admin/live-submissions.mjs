import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {randomUUID} from 'node:crypto';
import {ingestWorkerRegistration} from './worker-ingestion.mjs';

// Server-only configuration. Never include credentials in a browser response.
export function liveEnvironment(){
 let env={};
 try{env=parseEnv(readFileSync(new URL('../.env',import.meta.url),'utf8'));}catch{}
 return {...env,...process.env};
}

export async function readAccountDetails(ids,env){
 if(!env.DATABASE_URL)return [];
 const {Client}=await import('pg');
 const connection=new URL(env.DATABASE_URL);
 const supabase=connection.hostname.endsWith('.pooler.supabase.com')||connection.hostname.endsWith('.supabase.co');
 if(supabase)connection.searchParams.delete('sslmode');
 const client=new Client({connectionString:connection.href,connectionTimeoutMillis:10000,statement_timeout:10000,...(supabase?{ssl:{ca:readFileSync(new URL('../lib/certs/supabase-prod-ca.crt',import.meta.url),'utf8'),rejectUnauthorized:true}}:{})});
 try{
  await client.connect();
  await client.query('BEGIN READ ONLY');
  // Only safe account metadata. Never select password, tokens, provider account IDs or sessions.
  const result=await client.query(`SELECT u.id,u.name,u.email,u."createdAt",u."emailVerified",
   ARRAY(SELECT DISTINCT a."providerId" FROM workforce_auth.account a WHERE a."userId"=u.id) AS providers,
   (SELECT MAX(s."createdAt") FROM workforce_auth.session s WHERE s."userId"=u.id) AS "lastLogin"
   FROM workforce_auth."user" u ORDER BY u."createdAt",u.id`);
  return result.rows;
 }finally{await client.end();}
}

export function importLiveRequests(store,rows,accounts=[]){
 return store.transaction(()=>{
  let added=0;
  for(const account of accounts){
   const id='production-account:'+account.id,existing=store.list('users').find(u=>u.id===id);
   // A new verified worker submission is new activity, not a replay of a deleted account.
   // Replaying old submissions must never undo an operator's subsequent Delete.
   const newRegistration=existing?.deletedAt&&rows.find(r=>r.fields?.applicationForm==='workerRegistration'&&r.fields.accountUserId===account.id&&Date.parse(r.created_at||r.receivedAt)>Date.parse(existing.deletedAt));
   const providers=account.providers||[];
   const signInMethod=providers.map(p=>p==='google'?'Google':p==='credential'?'Email & password':p).join(' + ')||'Not available';
   const accountRoles=[...new Set(rows.filter(r=>r.fields?.accountUserId===account.id).map(r=>r.fields.applicationForm==='workerRegistration'?'worker':'employer'))];
   store.put('users',{...existing,id,name:existing?.localOverrides?.name??account.name,email:account.email,role:accountRoles.includes('employer')?'employer':accountRoles.includes('worker')?'worker':'website',accountRoles,status:newRegistration?'Active':existing?.status||'Active',...(newRegistration?{localOverrides:{...existing.localOverrides,status:'Active'},restoredBySubmission:newRegistration.id}:{}),source:'production-website',websiteUserId:account.id,signInMethod,emailVerified:Boolean(account.emailVerified),createdAt:new Date(account.createdAt).toISOString(),lastLogin:account.lastLogin?new Date(account.lastLogin).toISOString():existing?.lastLogin||''},{restore:Boolean(newRegistration)});
  }
  for(const entry of rows){
   const f=entry.fields||{};
   if(entry.id&&f.applicationForm==='workerRegistration'){ingestWorkerRegistration(store,entry,accounts.find(a=>a.id===f.accountUserId),{userId:f.accountUserId?'production-account:'+f.accountUserId:undefined});continue;}
   if(!entry.id||f.applicationForm!=='workerRequest')continue;
   const account=accounts.find(a=>a.id===f.accountUserId);
   const identity=f.accountUserId?'account:'+f.accountUserId:'contact:'+String(f.email||'').trim().toLowerCase();
   const sourceId='production:'+entry.id,createdAt=entry.created_at||entry.receivedAt;
   if(!createdAt)throw Error('Live submission has no creation date.');
   const previous=store.list('requests').find(r=>r.sourceId===sourceId);
   const existing=store.list('employers').find(e=>e.liveIdentity===identity);
   const restoreEmployer=Boolean(existing?.deletedAt&&Date.parse(createdAt)>Date.parse(existing.deletedAt));
   const userId=f.accountUserId?'production-account:'+f.accountUserId:undefined;
   const profile={...existing,id:existing?.id||randomUUID(),source:'production-website',liveIdentity:identity,status:existing?.status||'Active',createdAt:existing?.createdAt||createdAt};
   // Full history is read oldest first; older requests must not replace the latest profile.
   if(!existing?.updatedAt||Date.parse(createdAt)>=Date.parse(existing.updatedAt))Object.assign(profile,{name:f.fullName||'',company:f.company||'',email:f.email||'',phone:f.phone||'',location:f.siteLocation||'',updatedAt:createdAt,websiteUserId:f.accountUserId||'',userId,accountName:account?.name||existing?.accountName||'',accountEmail:account?.email||existing?.accountEmail||'',accountCreatedAt:account?.createdAt?new Date(account.createdAt).toISOString():existing?.accountCreatedAt||''});
   Object.assign(profile,existing?.localOverrides||{});
   if(restoreEmployer){profile.status='Active';profile.localOverrides={...profile.localOverrides,status:'Active'};profile.restoredBySubmission=entry.id;}
   store.put('employers',profile,{restore:restoreEmployer});
   if(previous)continue;
   store.put('requests',{id:randomUUID(),employerId:profile.id,source:'production-website',sourceId,websiteUserId:f.accountUserId||'',contactName:f.fullName||'',company:f.company||'',contactEmail:f.email||'',contactPhone:f.phone||'',position:f.workersRequired||'',quantity:String(f.workerCount||''),location:f.siteLocation||'',startDate:f.startDate||'',description:f.requirements||'',status:'New',createdAt});
   added++;
  }
  return added;
 });
}

export function createLiveSync({env=liveEnvironment(),fetcher=fetch,readAccounts=readAccountDetails,interval=5000}={}){
 let pending,lastAttempt=0;
 let status={source:'9workforce.com.au',connected:false,lastSyncedAt:null,requests:0,error:''};
 async function run(store){
  if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('Live website connection is not configured.');
  const base=new URL(env.SUPABASE_URL);
  if(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co'))throw Error('Live website database URL is invalid.');
  const rows=[];
  for(let offset=0;offset<50000;offset+=500){
   const url=new URL('/rest/v1/workforce_form_submissions',base);
   for(const [key,value] of Object.entries({select:'id,created_at,fields','fields->>applicationForm':'in.(workerRequest,workerRegistration)',order:'created_at.asc,id.asc',limit:'500',offset:String(offset)}))url.searchParams.set(key,value);
   const response=await fetcher(url,{method:'GET',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY},signal:AbortSignal.timeout(15000),redirect:'error'});
   if(!response.ok)throw Error('Live website request read failed (HTTP '+response.status+').');
   const page=await response.json();if(!Array.isArray(page))throw Error('Live website returned invalid records.');
   rows.push(...page);if(page.length<500)break;
   if(offset===49500)throw Error('Live request history exceeds the sync limit.');
  }
  let accounts=[],warning='';
  try{accounts=await readAccounts([...new Set(rows.map(r=>r.fields?.accountUserId).filter(Boolean))],env);}catch{warning='Requests synced; website account details are temporarily unavailable.';}
  const added=importLiveRequests(store,rows,accounts);
  status={source:'9workforce.com.au',connected:true,lastSyncedAt:new Date().toISOString(),requests:rows.filter(r=>r.fields?.applicationForm==='workerRequest').length,registrations:rows.filter(r=>r.fields?.applicationForm==='workerRegistration').length,accounts:accounts.length,added,error:warning};
 }
 return async store=>{
  if(pending)return pending;
  if(lastAttempt&&Date.now()-lastAttempt<interval)return status;
  lastAttempt=Date.now();
  pending=run(store).catch(()=>{status={...status,connected:false,error:'Live website sync failed. Previously synced records are retained. Check the server connection and refresh.'};}).then(()=>status).finally(()=>{pending=null;});
  return pending;
 };
}
