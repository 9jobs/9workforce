import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import {randomUUID,randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {statuses,fields} from './model.mjs';
import {publicJob} from '../lib/publicJobFields.js';

export class WorkspaceStore{
 constructor(directory){
  mkdirSync(directory,{recursive:true});this.db=new DatabaseSync(`${directory}/workspace.sqlite`);
  this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
   CREATE TABLE IF NOT EXISTS records (id TEXT PRIMARY KEY, kind TEXT NOT NULL, data TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS credentials (user_id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, salt TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS record_references (kind TEXT NOT NULL, record_id TEXT NOT NULL, number INTEGER NOT NULL, PRIMARY KEY(kind,record_id), UNIQUE(kind,number));
   CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL);`);
  // Backfill readable references once; filtering, sorting and refresh never renumber them.
  for(const {kind,data} of this.db.prepare("SELECT kind,data FROM records WHERE kind IN ('employers','requests','users','workers','jobs','applications','assignments') ORDER BY json_extract(data,'$.createdAt'),id").all()){
   const row=JSON.parse(data);if(!row.reference)this.put(kind,row);
  }
  // Existing linked vacancies gain a company name without changing their source relationships.
  for(const job of this.list('jobs').filter(row=>!row.deletedAt&&!row.company)){
   const company=this.jobCompany(job);if(company)this.put('jobs',{...job,company});
  }
 }
 jobCompany(job){
  const read=(kind,id)=>{const row=id&&this.db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get(kind,id);return row?JSON.parse(row.data):null;};
  const request=read('requests',job.requestId);
  return request?.company||read('employers',job.employerId||request?.employerId)?.company||'';
 }
 list(kind){return this.db.prepare('SELECT data FROM records WHERE kind=? ORDER BY rowid DESC').all(kind).map(x=>{const row=JSON.parse(x.data);return fields[kind]&&!row.reference?this.put(kind,row):row;});}
 get(kind,id){const r=this.db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get(kind,id);if(!r)throw Object.assign(new Error('Record not found'),{status:404});return JSON.parse(r.data);}
 put(kind,row,{restore=false}={}){
  const previous=this.db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get(kind,row.id);
  const deletedAt=previous&&JSON.parse(previous.data).deletedAt;
  if(deletedAt&&!restore)row={...row,deletedAt};
  if(restore){row={...row};delete row.deletedAt;}
  if(kind==='jobs'){
   const old=previous&&JSON.parse(previous.data);
   if(!old||JSON.stringify([publicJob(old),old.status,old.deletedAt])!==JSON.stringify([publicJob(row),row.status,row.deletedAt]))row={...row,publicationPending:true,publicationRevision:randomUUID()};
  }
  const prefix={employers:'EMP',requests:'REQ',users:'USR',workers:'WRK',jobs:'JOB',applications:'APP',assignments:'ASN'}[kind];
  if(prefix){
   this.db.prepare('INSERT INTO record_references(kind,record_id,number) SELECT ?,?,COALESCE(MAX(number),0)+1 FROM record_references WHERE kind=? ON CONFLICT(kind,record_id) DO NOTHING').run(kind,row.id,kind);
   const {number}=this.db.prepare('SELECT number FROM record_references WHERE kind=? AND record_id=?').get(kind,row.id);
   row={...row,reference:prefix+'-'+String(number).padStart(4,'0')};
  }
  this.db.prepare('INSERT INTO records VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(row.id,kind,JSON.stringify(row));return row;
 }
 transaction(fn){this.db.exec('BEGIN IMMEDIATE');try{const r=fn();this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 fail(message,status=400){throw Object.assign(new Error(message),{status});}
 publicUser(user){const {id,reference,name,email,role,accountRoles,status,createdAt,lastLogin,source,websiteUserId,signInMethod,emailVerified}=user;return {id,reference,name,email,role,accountRoles,status,createdAt,lastLogin,source,websiteUserId,signInMethod,emailVerified};}
 register(body,admin){return this.transaction(()=>{
  const first=!this.list('users').some(u=>u.role==='admin');
  const role=first?'admin':body.role;
  if(!['admin','employer','worker'].includes(role)||(!first&&role==='admin'&&admin?.role!=='admin'))this.fail('Only an administrator can create another admin.',403);
  const email=String(body.email||'').trim().toLowerCase(),name=String(body.name||'').trim();
  if(!name||!/^\S+@\S+\.\S+$/.test(email)||String(body.password||'').length<10||String(body.password).length>128)this.fail('Enter a name, valid email and password of 10–128 characters.');
  if(this.db.prepare('SELECT 1 FROM credentials WHERE email=?').get(email)||this.list('users').some(u=>u.email===email))this.fail('Email already registered.',409);
  const user={id:randomUUID(),name,email,role,status:'Active',createdAt:new Date().toISOString()};this.put('users',user);
  const salt=randomBytes(24).toString('hex'),hash=scryptSync(body.password,salt,64).toString('hex');
  this.db.prepare('INSERT INTO credentials VALUES(?,?,?,?)').run(user.id,email,hash,salt);
  if(role!=='admin'){
   const kind=role==='worker'?'workers':'employers';const existing=this.list(kind).find(r=>r.email?.toLowerCase()===email);
   this.put(kind,{...(existing||{}),id:existing?.id||randomUUID(),name,email,userId:user.id,company:existing?.company||body.company||name,status:existing?.status||(role==='worker'?'Available':'Active'),createdAt:existing?.createdAt||user.createdAt});
  }
  return user;
 });}
 login(body){const credential=this.db.prepare('SELECT * FROM credentials WHERE email=?').get(String(body.email||'').trim().toLowerCase());
  const computed=scryptSync(String(body.password||''),credential?.salt||'invalid-login-salt',64);
  if(!credential||!timingSafeEqual(computed,Buffer.from(credential.hash,'hex')))this.fail('Email or password is incorrect.',401);
  const user=this.get('users',credential.user_id);if(user.deletedAt||user.status!=='Active')this.fail('Account is not active.',403);
  if(body.role&&body.role!==user.role)this.fail('Use an administrator account to sign in here.',403);
  user.lastLogin=new Date().toISOString();this.put('users',user);
  return this.createSession(user);
 }
 createSession(user){const token=randomBytes(32).toString('hex');this.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(this.digest(token),user.id,Date.now()+12*3600000);return {token,user:this.publicUser(user)};}
 preview(role){
  if(!['worker','employer'].includes(role))this.fail('Unknown preview workspace.');
  const user=this.transaction(()=>{
   let user=this.list('users').find(u=>u.role===role&&u.source==='local-preview');
   if(user){if(user.deletedAt||user.status!=='Active')this.fail('This preview workspace has been deactivated.',403);return user;}
   const createdAt=new Date().toISOString(),name=role==='worker'?'Local Preview Worker':'Local Preview Employer';
   user={id:randomUUID(),name,email:`preview-${role}@9workforce.local`,role,status:'Active',source:'local-preview',createdAt};this.put('users',user);
   this.put(role==='worker'?'workers':'employers',{id:randomUUID(),userId:user.id,name,email:user.email,...(role==='employer'?{company:'Local Preview Company'}:{}),status:role==='worker'?'Available':'Active',source:'local-preview',createdAt});return user;
  });return this.createSession(user);
 }
 digest(token){return createHash('sha256').update(token).digest('hex');}
 session(token){if(!token)return null;const s=this.db.prepare('SELECT * FROM sessions WHERE token=? AND expires>?').get(this.digest(token),Date.now());if(!s)return null;try{const u=this.get('users',s.user_id);return !u.deletedAt&&u.status==='Active'?this.publicUser(u):null;}catch{return null;}}
 logout(token){this.db.prepare('DELETE FROM sessions WHERE token=?').run(this.digest(token||''));}
 changePassword(user,body){return this.transaction(()=>{
  const credential=this.db.prepare('SELECT * FROM credentials WHERE user_id=?').get(user.id);
  if(!credential||!timingSafeEqual(scryptSync(String(body.currentPassword||''),credential.salt,64),Buffer.from(credential.hash,'hex')))this.fail('Current password is incorrect.',403);
  const password=String(body.newPassword||'');if(password.length<10||password.length>128)this.fail('Choose a password of 10–128 characters.');
  const salt=randomBytes(24).toString('hex'),hash=scryptSync(password,salt,64).toString('hex');
  this.db.prepare('UPDATE credentials SET hash=?,salt=? WHERE user_id=?').run(hash,salt,user.id);
  this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);return {ok:true};
 });}
 visible(kind){return this.list(kind).filter(r=>!r.deletedAt);}
 own(kind,user){return this.visible(kind).find(r=>r.userId===user.id);}
 snapshot(user){
  const all=Object.fromEntries(Object.keys(fields).map(k=>[k,this.visible(k)]));
  // Legacy employer preview records are retained on disk, but are not website employers.
  const legacyEmployers=new Set(all.employers.filter(e=>e.source==='local-preview').map(e=>e.id));
  all.employers=all.employers.filter(e=>!legacyEmployers.has(e.id));
  const legacyRequests=new Set(all.requests.filter(r=>legacyEmployers.has(r.employerId)).map(r=>r.id));
  all.requests=all.requests.filter(r=>!legacyRequests.has(r.id));
  all.jobs=all.jobs.filter(j=>!legacyEmployers.has(j.employerId)&&!legacyRequests.has(j.requestId));
  all.assignments=all.assignments.filter(a=>!legacyEmployers.has(a.employerId));
  all.users=all.users.filter(u=>!(u.role==='employer'&&u.source==='local-preview'));
  if(user.role==='admin')return {...all,users:all.users.map(u=>this.publicUser(u)),applications:all.applications.map(a=>({...a,location:all.jobs.find(j=>j.id===a.jobId)?.location||'',workType:all.jobs.find(j=>j.id===a.jobId)?.workType||all.workers.find(w=>w.id===a.workerId)?.workType||''}))};
  const worker=this.own('workers',user),employer=this.own('employers',user);
  if(user.role==='worker')return {workers:worker?[worker]:[],employers:[],requests:[],jobs:all.jobs.filter(j=>j.status==='Open').map(({employerId,requestId,...j})=>j),applications:all.applications.filter(a=>a.workerId===worker?.id).map(a=>({...a,jobTitle:all.jobs.find(j=>j.id===a.jobId)?.title,location:all.jobs.find(j=>j.id===a.jobId)?.location})),assignments:all.assignments.filter(a=>a.workerId===worker?.id).map(a=>({...a,company:all.employers.find(e=>e.id===a.employerId)?.company})),users:[this.publicUser(user)]};
  const assignments=all.assignments.filter(a=>a.employerId===employer?.id);
  return {employers:employer?[employer]:[],requests:all.requests.filter(r=>r.employerId===employer?.id),assignments,workers:all.workers.filter(w=>assignments.some(a=>a.workerId===w.id)).map(w=>({id:w.id,name:w.name,workType:w.workType})),jobs:[],applications:[],users:[this.publicUser(user)]};
 }
 save(kind,id,body,user){return this.transaction(()=>{
  if(!fields[kind]||kind==='users'&&!id)this.fail('Unsupported record type.');
  const old=id?this.get(kind,id):null;
  if(old?.deletedAt)this.fail('Record has been deleted.',404);
  if(old&&kind==='requests'&&['website','production-website'].includes(old.source)&&body.employerId!==undefined&&body.employerId!==old.employerId)this.fail('A website request keeps its original employer relationship.');
  if(user.role!=='admin'){
   const ownWorker=this.own('workers',user),ownEmployer=this.own('employers',user);
   const permitted=user.role==='employer'&&(kind==='requests'&&(!old||old.employerId===ownEmployer?.id)||kind==='employers'&&old?.id===ownEmployer?.id)||user.role==='worker'&&(kind==='workers'&&old?.id===ownWorker?.id||kind==='applications'&&(!old||old.workerId===ownWorker?.id));
   if(!permitted)this.fail('You cannot change this record.',403);
   if(kind==='requests'&&old&&['Completed','Cancelled','Workers Assigned'].includes(old.status))this.fail('This request is locked. Contact the administrator.');
   if(kind==='workers'&&body.status&&!['Available','Unavailable'].includes(body.status))this.fail('Invalid availability.');
   if(kind==='applications'&&old&&(body.status!=='Withdrawn'||['Assigned','Withdrawn'].includes(old.status)))this.fail('Only pending applications can be withdrawn.');
  }
  const allowed=fields[kind].filter(k=>user.role==='admin'||!['employerId','workerId','role','email'].includes(k));
  if(kind==='applications'&&!old)allowed.push('jobId');
  const patch=Object.fromEntries(allowed.filter(k=>body[k]!==undefined).map(k=>[k,String(body[k]).trim().slice(0,10000)]));
  const row={...old,...patch,id:old?.id||randomUUID(),createdAt:old?.createdAt||new Date().toISOString(),status:old?.status||statuses[kind][0]};
  if(body.status&&(user.role==='admin'||kind==='applications'||kind==='workers'))row.status=body.status;
  if(!statuses[kind].includes(row.status))this.fail('Invalid status.');
  if(kind==='users'){
   if(!['admin','employer','worker','website'].includes(row.role)||row.role!==old.role)this.fail('Account roles cannot be changed after registration.');
   if(row.email!==old.email)this.fail('Account email is fixed to its secure login.');
   if(old.role==='admin'&&row.status!=='Active'&&this.list('users').filter(u=>u.role==='admin'&&u.status==='Active').length===1)this.fail('Keep at least one active administrator.');
  }
  if(user.role==='employer'&&kind==='requests')row.employerId=this.own('employers',user)?.id;
  if(user.role==='worker'&&kind==='applications')row.workerId=this.own('workers',user)?.id;
  if(kind==='workers'&&user.role==='worker'&&old.status==='Assigned')row.status='Assigned';
  if(['workers','employers'].includes(kind)){
   if(!row.name||!/^\S+@\S+\.\S+$/.test(row.email||''))this.fail('Name and valid email are required.');
   if((!old||row.email.toLowerCase()!==old.email?.toLowerCase())&&this.list(kind).some(r=>r.id!==row.id&&r.email?.toLowerCase()===row.email.toLowerCase()))this.fail('A profile with this email already exists.',409);
  }
  if(kind==='requests'||kind==='jobs'){
   if(kind==='jobs'&&!row.company)row.company=this.jobCompany(row);
   if(!row.location||!(kind==='jobs'?row.title:row.position))this.fail('Position/title and location are required.');
   if(!Number.isInteger(Number(row.quantity))||Number(row.quantity)<1)this.fail('Workers required must be a positive whole number.');
   if(row.employerId){if(this.get('employers',row.employerId).deletedAt)this.fail('Selected employer has been deleted. Refresh the workspace.');}else if(kind==='requests')this.fail('Choose an employer.');
   if(row.requestId){const request=this.get('requests',row.requestId);if(request.deletedAt)this.fail('Selected request has been deleted. Refresh the workspace.');if(row.employerId&&row.employerId!==request.employerId)this.fail('Employer does not match request.');if(this.get('employers',request.employerId).deletedAt)this.fail('The employer linked to this request has been deleted. Refresh the workspace.');row.employerId=request.employerId;}
   if(row.endDate&&row.startDate&&row.endDate<row.startDate)this.fail('End date must follow start date.');
   if(old){
    const related=this.list('assignments').filter(a=>(kind==='requests'?a.requestId:a.jobId)===old.id&&a.status!=='Cancelled');
    if(related.length>Number(row.quantity))this.fail('Workers required cannot be lower than existing assignments.');
    if(related.length&&['employerId','requestId'].some(k=>row[k]!==old[k]))this.fail('Assigned records cannot change their employer/request relationship.');
    if(kind==='requests'&&['Cancelled','Completed'].includes(row.status)&&related.some(a=>['Scheduled','Active'].includes(a.status)))this.fail('Complete or cancel active assignments first.');
   }
  }
  if(kind==='applications'){
   const job=this.get('jobs',row.jobId),worker=this.get('workers',row.workerId);
   if(!old&&(job.status!=='Open'||['Inactive','Unavailable'].includes(worker.status)))this.fail('This job or worker is not available.');
   if(!old&&this.list(kind).some(a=>a.jobId===row.jobId&&a.workerId===row.workerId))this.fail('You have already applied for this job.',409);
   if(row.status==='Assigned'&&old?.status!=='Assigned')this.fail('Use Assign to create a linked assignment.');
   if(old&&['workerId','jobId'].some(k=>old[k]!==row[k]))this.fail('Application relationships cannot be changed.');
   if(old?.status==='Assigned'&&row.status!=='Assigned')this.fail('Complete or cancel the linked assignment first.');
  }
  if(kind==='assignments'){
   if(!old)this.fail('Use Assign Workers or Assign Application.');
   for(const key of fields.assignments.filter(k=>k.endsWith('Id')))if(row[key]!==old[key])this.fail('Assignment relationships cannot be changed.');
   if(['Completed','Cancelled'].includes(old.status)&&row.status!==old.status)this.fail('A finished assignment cannot be reopened.');
   if(row.endDate&&row.startDate&&row.endDate<row.startDate)this.fail('End date must follow start date.');
  }
  const active=this.list('assignments').some(a=>a.workerId===row.id&&['Active','Scheduled'].includes(a.status));
  if(kind==='workers'&&active&&row.status!=='Assigned')this.fail('Complete or cancel the active assignment first.');
  if(old&&['employers','requests','users','workers'].includes(kind)&&['website','production-website'].includes(old.source)){
   row.originalWebsiteDetails=old.originalWebsiteDetails||Object.fromEntries(fields[kind].map(k=>[k,old[k]||'']));
   row.localOverrides={...old.localOverrides,...patch};row.locallyUpdatedAt=new Date().toISOString();
  }
  this.put(kind,row);if(kind==='assignments')this.reconcile(row);return row;
 });}
 assign(body,user){if(user.role!=='admin')this.fail('Administrator access required.',403);return this.transaction(()=>{
  const application=body.applicationId?this.get('applications',body.applicationId):null;
  const job=application?this.get('jobs',application.jobId):null;
  if([application,job].some(r=>r?.deletedAt))this.fail('Record has been deleted.',404);
  if(application&&['Assigned','Withdrawn','Not Selected'].includes(application.status))this.fail('Application is not available for assignment.');
  if(job&&job.status!=='Open')this.fail('Job must be open for assignment.');
  const request=body.requestId?this.get('requests',body.requestId):job?.requestId?this.get('requests',job.requestId):null;
  const employerId=request?.employerId||job?.employerId||body.employerId;const employer=this.get('employers',employerId);
  if(request?.deletedAt||employer.deletedAt)this.fail('Record has been deleted.',404);
  if(employer.status!=='Active')this.fail('Employer is inactive.');
  if(request&&['Completed','Cancelled'].includes(request.status))this.fail('Request is closed.');
  const workerIds=application?[application.workerId]:body.workerIds;
  if(!Array.isArray(workerIds)||!workerIds.length||new Set(workerIds).size!==workerIds.length)this.fail('Select one or more different workers.');
  const ongoing=this.list('assignments').filter(a=>a.status!=='Cancelled');
  if(request&&ongoing.filter(a=>a.requestId===request.id).length+workerIds.length>Number(request.quantity))this.fail('Assignment exceeds workers required.');
  if(job&&ongoing.filter(a=>a.jobId===job.id).length+workerIds.length>Number(job.quantity))this.fail('No vacancies remain.');
  const result=workerIds.map(id=>{
   const worker=this.get('workers',id);if(worker.deletedAt||worker.status!=='Available'||this.list('assignments').some(a=>a.workerId===id&&['Active','Scheduled'].includes(a.status)))this.fail('Worker is already assigned or unavailable.');
   const row={id:randomUUID(),workerId:id,employerId,requestId:request?.id||'',jobId:job?.id||'',applicationId:application?.id||'',location:request?.location||job?.location||body.location||'',startDate:request?.startDate||job?.startDate||body.startDate||'',endDate:job?.endDate||'',status:'Scheduled',createdAt:new Date().toISOString()};
   this.put('assignments',row);this.put('workers',{...worker,status:'Assigned'});return row;
  });
  if(request)this.put('requests',{...request,status:'Workers Assigned'});
  if(application)this.put('applications',{...application,status:'Assigned'});
  if(job&&ongoing.filter(a=>a.jobId===job.id).length+workerIds.length>=Number(job.quantity))this.put('jobs',{...job,status:'Filled'});
  return result;
 });}
 reconcile(assignment){
  const worker=this.get('workers',assignment.workerId);const active=this.list('assignments').some(a=>a.workerId===worker.id&&['Scheduled','Active'].includes(a.status));
  this.put('workers',{...worker,status:active?'Assigned':'Available'});
  if(assignment.applicationId&&assignment.status==='Cancelled'){const app=this.get('applications',assignment.applicationId);this.put('applications',{...app,status:'Shortlisted'});}
  if(assignment.jobId&&assignment.status==='Cancelled'){const job=this.get('jobs',assignment.jobId);if(job.status==='Filled')this.put('jobs',{...job,status:'Closed'});}
  if(assignment.requestId){const req=this.get('requests',assignment.requestId),rows=this.list('assignments').filter(a=>a.requestId===req.id);if(!['Cancelled','Completed'].includes(req.status))this.put('requests',{...req,status:rows.some(a=>['Active','Scheduled'].includes(a.status))?'Workers Assigned':rows.filter(a=>a.status==='Completed').length>=Number(req.quantity)?'Completed':'In Progress'});}
 }
 remove(kind,id,user){return this.transaction(()=>{
  if(user.role!=='admin')this.fail('Administrator access required.',403);
  if(!statuses[kind])this.fail('Unknown record.');
  const row=this.get(kind,id);if(row.deletedAt)return {id,deletedAt:row.deletedAt};
  if(kind==='users'&&row.role==='admin'&&row.status==='Active'&&this.visible('users').filter(u=>u.role==='admin'&&u.status==='Active').length===1)this.fail('Keep at least one active administrator.');
  // Cancel ongoing staffing links before removing their source from the console.
  const userWorkers=new Set(kind==='users'?this.list('workers').filter(w=>w.userId===id).map(w=>w.id):[]);
  const userEmployers=new Set(kind==='users'?this.list('employers').filter(e=>e.userId===id).map(e=>e.id):[]);
  for(const assignment of this.visible('assignments').filter(a=>['Active','Scheduled'].includes(a.status)&&(
   kind==='assignments'&&a.id===id||kind==='workers'&&a.workerId===id||kind==='employers'&&a.employerId===id||kind==='requests'&&a.requestId===id||kind==='jobs'&&a.jobId===id||kind==='applications'&&a.applicationId===id||kind==='users'&&(userWorkers.has(a.workerId)||userEmployers.has(a.employerId))
  ))){const cancelled={...assignment,status:'Cancelled'};this.put('assignments',cancelled);this.reconcile(cancelled);}
  const status={users:'Inactive',workers:'Inactive',employers:'Inactive',requests:'Cancelled',jobs:'Closed',applications:'Not Selected',assignments:'Cancelled'}[kind];
  const deletedAt=new Date().toISOString();
  this.put(kind,{...this.get(kind,id),status,deletedAt,localOverrides:{...row.localOverrides,status}});
  if(kind==='users')this.db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
  return {id,deletedAt};
 });}
 archive(kind,id,user){if(user.role!=='admin')this.fail('Administrator access required.',403);if(!statuses[kind])this.fail('Unknown record.');const row=this.get(kind,id);const status={users:'Inactive',workers:'Inactive',employers:'Inactive',requests:'Cancelled',jobs:'Closed',applications:'Not Selected',assignments:'Cancelled'}[kind];
  if(kind==='requests'&&this.list('assignments').some(a=>a.requestId===id&&['Active','Scheduled'].includes(a.status)))this.fail('Cancel or complete assignments before archiving this request.');
  if(kind==='employers'&&this.list('assignments').some(a=>a.employerId===id&&['Active','Scheduled'].includes(a.status)))this.fail('Cancel or complete assignments before deactivating this employer.');
  return this.save(kind,id,{status},user);
 }
}
