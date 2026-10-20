import {randomUUID} from 'node:crypto';
import {validateWorkerRequest} from '../lib/workerRequest.js';
import {validateWorkerRegistration} from '../lib/workerRegistration.js';

// Consumes a user-supplied export; never connects to Supabase or sends email.
export function importSubmissions(store,rows){
 if(!Array.isArray(rows)||rows.length>500)store.fail('Choose a JSON array with at most 500 exported submissions.');
 return store.transaction(()=>{
  const summary={workers:0,employers:0,requests:0,skipped:0,documents:0};
  for(const entry of rows){
   const f=entry.fields||{},sourceId=String(entry.id||'');
   const workerForm=f.applicationForm==='workerRegistration',requestForm=f.applicationForm==='workerRequest';
   if(!workerForm&&!requestForm){summary.skipped++;continue;}
   if(!sourceId)store.fail('Every submission needs its original ID.');
   const validation=workerForm?validateWorkerRegistration(f):validateWorkerRequest(f);if(validation)store.fail(`Submission ${sourceId}: ${validation}`);
   const email=f.email.trim().toLowerCase(),createdAt=entry.created_at||entry.receivedAt||new Date().toISOString();
   if(workerForm){
    const existing=store.list('workers').find(w=>w.email.toLowerCase()===email);
    if(existing?.sourceId===sourceId){summary.skipped++;continue;}
    const user=store.list('users').find(u=>u.email===email&&u.role==='worker');
    const imported={id:randomUUID(),name:f.fullName,email,phone:f.phone,location:f.location||'',workType:f.workCategory||'',availability:f.availability||'',experience:f.experienceTickets||'',tickets:f.experienceTickets||'',additionalInformation:f.additionalInformation||'',status:'Available',createdAt,sourceId,...(user?{userId:user.id}:{})};
    const worker=existing?{...imported,...Object.fromEntries(Object.entries(existing).filter(([,v])=>v!==''&&v!==undefined)),sourceId}:imported;
    store.put('workers',worker);if(existing)summary.skipped++;else summary.workers++;
    for(const key of ['resume','coverLetter'])if(f[key+'Data']){
     if(!/^data:(application\/pdf|image\/(png|jpeg|webp));base64,[A-Za-z0-9+/=]+$/.test(f[key+'Data'])||Buffer.from(f[key+'Data'].split(',')[1],'base64').length>2*1024*1024)store.fail('Export contains an unsupported or oversized attachment. Import this record without the attachment and upload a PDF/image separately.');
     store.put('documents',{id:randomUUID(),workerId:worker.id,name:String(f[key+'Name']||key+'.pdf').slice(0,160),category:key==='resume'?'Resume':'Cover letter',content:f[key+'Data'],createdAt});summary.documents++;
    }
   }else{
    if(store.list('requests').some(r=>r.sourceId===sourceId)){summary.skipped++;continue;}
    let employer=store.list('employers').find(e=>e.email.toLowerCase()===email);
    if(!employer){const user=store.list('users').find(u=>u.email===email&&u.role==='employer');employer={id:randomUUID(),name:f.fullName,company:f.company,email,phone:f.phone,location:f.siteLocation,status:'Active',createdAt,...(user?{userId:user.id}:{})};store.put('employers',employer);summary.employers++;}
    store.put('requests',{id:randomUUID(),employerId:employer.id,position:f.workersRequired,quantity:f.workerCount,location:f.siteLocation,startDate:f.startDate,description:f.requirements||'',status:'New',createdAt,sourceId});summary.requests++;
   }
  }
  return summary;
 });
}
