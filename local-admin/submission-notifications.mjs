// Read-only projection of submitted website forms. Editing a profile never creates an alert.
export class SubmissionNotifications{
 constructor(store){this.store=store;store.db.exec('CREATE TABLE IF NOT EXISTS admin_submission_reads(user_id TEXT NOT NULL,submission_key TEXT NOT NULL,read_at TEXT NOT NULL,PRIMARY KEY(user_id,submission_key));');}
 requireAdmin(user){if(user?.role!=='admin')this.store.fail('Administrator access required.',403);}
 events(){
  const workers=new Map(this.store.visible('workers').map(row=>[row.id,row]));
  const employers=new Map(this.store.visible('employers').map(row=>[row.id,row]));
  const events=new Map(),registered=new Set();
  const add=(kind,sourceId,recordId,name,company,createdAt)=>{
   if(!sourceId||!Number.isFinite(Date.parse(createdAt)))return;
   const id=kind+':'+sourceId;
   events.set(id,{id,kind,recordId,name:String(name||'').trim()||(kind==='worker'?'Worker':'Employer'),company:String(company||''),createdAt,path:kind==='worker'?'/admin/workers':'/admin/employer-requests'});
  };
  for(const row of this.store.visible('workerRegistrations')){
   if(!workers.has(row.workerId))continue;
   registered.add(row.workerId);
   add('worker',row.sourceId||row.id,row.workerId,row.fields?.fullName||workers.get(row.workerId).name,'',row.createdAt);
  }
  // Older exports predate registration history; keep one alert per known source form.
  for(const row of workers.values())if(!registered.has(row.id)&&row.source!=='local-preview')add('worker',row.sourceId,row.id,row.originalWebsiteDetails?.name||row.name,'',row.createdAt);
  for(const row of this.store.visible('requests')){
   const original=row.originalWebsiteDetails||row,employer=employers.get(row.employerId);
   add('employer',row.sourceId,row.id,original.contactName||row.contactName||employer?.originalWebsiteDetails?.name||employer?.name,original.company||row.company||employer?.company,row.createdAt);
  }
  return [...events.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)||a.id.localeCompare(b.id));
 }
 snapshot(user){this.requireAdmin(user);const read=new Set(this.store.db.prepare('SELECT submission_key FROM admin_submission_reads WHERE user_id=?').all(user.id).map(row=>row.submission_key));const events=this.events().map(event=>({...event,read:read.has(event.id)}));return {notifications:events.slice(0,50),unread:events.filter(event=>!event.read).length,total:events.length};}
 mark(user,body){this.requireAdmin(user);if(!body||Array.isArray(body)||typeof body!=='object')this.store.fail('Submit a notification object.');const events=this.events(),keys=body.all===true?events.map(event=>event.id):[body.id];if(keys.some(key=>!events.some(event=>event.id===key)))this.store.fail('Submission notification not found.',404);this.store.transaction(()=>{const save=this.store.db.prepare('INSERT OR IGNORE INTO admin_submission_reads VALUES(?,?,?)');for(const key of keys)save.run(user.id,key,new Date().toISOString());});return this.snapshot(user);}
}
