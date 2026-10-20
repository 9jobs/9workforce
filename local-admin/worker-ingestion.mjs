import {randomUUID,createHash} from 'node:crypto';
import {registrationAttachments} from '../lib/workerRegistration.js';

export function ingestWorkerRegistration(store,entry,account,{source='production-website',userId}={}){
 const f=entry.fields||{},sourceId=(source==='production-website'?'production:':'')+entry.id;
 const identity=f.accountUserId?'account:'+f.accountUserId:'contact:'+String(f.email||'').trim().toLowerCase();
 const existing=store.list('workers').find(w=>w.source===source&&w.registrationIdentity===identity);
 const createdAt=entry.created_at||entry.receivedAt||new Date().toISOString();
 const worker={...existing,id:existing?.id||randomUUID(),source,registrationIdentity:identity,createdAt:existing?.createdAt||createdAt,status:existing?.status||'Available'};
 if(!existing?.updatedAt||Date.parse(createdAt)>=Date.parse(existing.updatedAt))Object.assign(worker,{name:f.fullName||'',email:f.email||'',phone:f.phone||'',location:f.location||'',workType:f.workCategory||'',availability:f.availability||'',experience:f.experienceTickets||'',tickets:f.experienceTickets||'',additionalInformation:f.additionalInformation||'',sourceId,updatedAt:createdAt,websiteUserId:f.accountUserId||'',userId,accountName:account?.name||existing?.accountName||'',accountEmail:account?.email||existing?.accountEmail||'',accountCreatedAt:account?.createdAt?new Date(account.createdAt).toISOString():existing?.accountCreatedAt||''});
 Object.assign(worker,existing?.localOverrides||{});store.put('workers',worker);
 if(account){worker.accountSignInMethod=account.signInMethod||(account.providers||[]).map(provider=>provider==='google'?'Google':provider==='credential'?'Email & password':provider).join(' + ')||'Not available';worker.accountEmailVerified=Boolean(account.emailVerified);store.put('workers',worker);}
 const documents=[];let warning='';
 try{
  for(const [index,file] of registrationAttachments(f).entries()){
   if(!['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg','image/webp'].includes(file.type)){warning='An uploaded file type could not be imported.';continue;}
   const content=`data:${file.type};base64,${file.data}`;
   const category=index===0&&f.resumeData?'Resume':'Cover letter';
   const id='registration-doc:'+createHash('sha256').update(worker.id+'|'+category+'|'+content).digest('hex');
   const existingDocument=store.list('documents').find(document=>document.id===id);
   store.put('documents',{...existingDocument,id,workerId:worker.id,name:file.name,category,content,createdAt,source,sourceId,...existingDocument?.localOverrides});documents.push(id);
  }
 }catch{warning='One or more uploaded documents could not be imported.';}
 const safeFields=Object.fromEntries(['fullName','phone','email','location','workCategory','availability','experienceTickets','additionalInformation','resumeName','coverLetterName','accountUserId'].map(key=>[key,String(f[key]||'')]));
 store.put('workerRegistrations',{id:'registration:'+sourceId,workerId:worker.id,sourceId,source,createdAt,fields:safeFields,documentIds:documents,warning});
 return worker;
}
