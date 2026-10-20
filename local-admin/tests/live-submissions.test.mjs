import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {WorkspaceStore} from '../store.mjs';
import {createLiveSync,importLiveRequests} from '../live-submissions.mjs';
import {saveDocument,deleteDocument,publicDocument} from '../document-store.mjs';

const row=(id,date,extra={})=>({id,created_at:date,fields:{applicationForm:'workerRequest',fullName:'Site Contact',company:'Site Company',email:'contact@example.test',phone:'0400111222',siteLocation:'Melbourne',workersRequired:'General Labourers',workerCount:'2',startDate:'2026-11-05',requirements:'Site requirements',...extra}});
function fixture(t){const directory=mkdtempSync(path.join(tmpdir(),'live-sync-test-'));const store=new WorkspaceStore(directory);t.after(()=>{store.db.close();rmSync(directory,{recursive:true,force:true})});return store;}
test('live requests retain contact history, account metadata, operational status and stable IDs',t=>{
 const store=fixture(t),rows=[row('a','2026-10-01T00:00:00Z',{accountUserId:'account-1'}),row('b','2026-10-02T00:00:00Z',{accountUserId:'account-1',company:'Updated Company'})];
 const accounts=[{id:'account-1',name:'Website Owner',email:'owner@example.test',createdAt:'2026-09-01T00:00:00Z',password:'must-never-be-copied'}];
 assert.equal(importLiveRequests(store,rows,accounts),2);
 assert.equal(store.list('employers').length,1);assert.equal(store.list('employers')[0].company,'Updated Company');
 const request=store.list('requests').find(r=>r.sourceId==='production:a');store.put('requests',{...request,status:'Completed'});
 assert.equal(importLiveRequests(store,rows,accounts),0);
 assert.equal(store.get('requests',request.id).status,'Completed');assert.equal(store.get('requests',request.id).company,'Site Company');
 assert.equal(store.list('employers')[0].accountEmail,'owner@example.test');assert.ok(!JSON.stringify(store.list('users')).includes('must-never-be-copied'));
});
test('sync paginates using GET, coalesces refreshes, and retains cached records on network failure',async t=>{
 const store=fixture(t);let calls=0,fail=false;
 const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'server-only-key'};
 const sync=createLiveSync({env,interval:0,readAccounts:async()=>[],fetcher:async(url,options)=>{
  calls++;assert.equal(options.method,'GET');assert.equal(url.searchParams.get('fields->>applicationForm'),'in.(workerRequest,workerRegistration)');
  if(fail)throw Error('private server details');
  const offset=Number(url.searchParams.get('offset'));return {ok:true,json:async()=>offset===0?Array.from({length:500},(_,i)=>row('row-'+i,'2026-10-01T00:00:00Z')):[row('last','2026-10-02T00:00:00Z')]};
 }});
 const [a,b]=await Promise.all([sync(store),sync(store)]);assert.equal(a.connected,true);assert.equal(b.requests,501);assert.equal(calls,2);assert.equal(store.list('requests').length,501);
 fail=true;const result=await sync(store);assert.equal(result.connected,false);assert.equal(store.list('requests').length,501);assert.ok(!result.error.includes('private server details'));
});
test('Google and email website accounts sync before submitting and expose only safe metadata',t=>{
 const store=fixture(t),accounts=[
  {id:'google-user',name:'Google Owner',email:'google@example.test',createdAt:'2026-09-01T00:00:00Z',providers:['google'],emailVerified:true,lastLogin:'2026-10-01T00:00:00Z',accessToken:'secret-token'},
  {id:'email-user',name:'Email Owner',email:'email@example.test',createdAt:'2026-09-02T00:00:00Z',providers:['credential'],emailVerified:false,password:'secret-password'}
 ];
 importLiveRequests(store,[],accounts);
 const users=store.snapshot({role:'admin'}).users;
 assert.equal(users.length,2);assert.equal(users.find(u=>u.name==='Google Owner').signInMethod,'Google');assert.equal(users.find(u=>u.name==='Email Owner').signInMethod,'Email & password');
 assert.ok(users.every(u=>u.role==='website'&&/^USR-\d{4}$/.test(u.reference)));
 assert.ok(!JSON.stringify(users).includes('secret-'));
 importLiveRequests(store,[row('linked','2026-10-02T00:00:00Z',{accountUserId:'google-user'})],accounts);
 assert.equal(store.list('users').find(u=>u.name==='Google Owner').role,'employer');
});
test('readable references survive updates, imports and reopening without changing relational IDs',t=>{
 const store=fixture(t);
 importLiveRequests(store,[row('first','2026-10-01T00:00:00Z')]);
 const request=store.list('requests')[0],employer=store.list('employers')[0];
 assert.equal(request.reference,'REQ-0001');assert.equal(employer.reference,'EMP-0001');assert.equal(request.employerId,employer.id);
 store.put('requests',{...request,status:'Reviewing'});
 importLiveRequests(store,[row('second','2026-10-02T00:00:00Z')]);
 assert.equal(store.get('requests',request.id).reference,'REQ-0001');assert.equal(store.list('requests')[0].reference,'REQ-0002');
 const reopened=new WorkspaceStore(path.dirname(store.db.prepare('PRAGMA database_list').get().file));
 try{assert.equal(reopened.get('requests',request.id).reference,'REQ-0001');}finally{reopened.db.close();}
});
test('local management edits and status changes survive live sync while preserving the original submission',t=>{
 const store=fixture(t),admin={role:'admin'},rows=[row('edit','2026-10-01T00:00:00Z')];
 importLiveRequests(store,rows);
 const employer=store.list('employers')[0],request=store.list('requests')[0];
 store.save('employers',employer.id,{company:'Corrected company',name:'Corrected contact',status:'Inactive'},admin);
 store.save('requests',request.id,{contactName:'Updated site contact',description:'Local correction',status:'Reviewing'},admin);
 importLiveRequests(store,rows);
 const updated=store.get('employers',employer.id),updatedRequest=store.get('requests',request.id);
 assert.equal(updated.company,'Corrected company');assert.equal(updated.status,'Inactive');assert.equal(updated.originalWebsiteDetails.company,'Site Company');
 assert.equal(updatedRequest.contactName,'Updated site contact');assert.equal(updatedRequest.description,'Local correction');assert.equal(updatedRequest.status,'Reviewing');assert.equal(updatedRequest.originalWebsiteDetails.description,'Site requirements');
 assert.throws(()=>store.save('requests',request.id,{employerId:'another'},admin),/original employer/);
 store.archive('requests',request.id,admin);importLiveRequests(store,rows);assert.equal(store.get('requests',request.id).status,'Cancelled');
});
test('existing legacy profiles sharing a contact email can still toggle status',t=>{
 const store=fixture(t);store.put('employers',{id:'a',name:'Contact',email:'same@example.test',status:'Active'});store.put('employers',{id:'b',name:'Contact',email:'same@example.test',status:'Active'});
 assert.equal(store.save('employers','a',{status:'Inactive'},{role:'admin'}).status,'Inactive');
});
test('website account display edits and disabled status survive sync without changing login identity',t=>{
 const store=fixture(t),accounts=[{id:'account-local-edit',name:'Website Name',email:'login@example.test',createdAt:'2026-09-01T00:00:00Z',providers:['google']}];
 importLiveRequests(store,[],accounts);const user=store.list('users')[0];
 store.save('users',user.id,{name:'Management Name',status:'Inactive'},{role:'admin'});importLiveRequests(store,[],accounts);
 const updated=store.get('users',user.id);assert.equal(updated.name,'Management Name');assert.equal(updated.status,'Inactive');assert.equal(updated.email,'login@example.test');assert.equal(updated.websiteUserId,'account-local-edit');assert.equal(accounts[0].name,'Website Name');
 store.archive('users',user.id,{role:'admin'});importLiveRequests(store,[],accounts);assert.equal(store.get('users',user.id).status,'Inactive');
});
test('document CRUD persists through sync and never exposes source or replacement file content in metadata',t=>{
 const store=fixture(t),rows=[{id:'doc-registration',created_at:'2026-10-01T00:00:00Z',fields:{applicationForm:'workerRegistration',fullName:'Worker',email:'worker@example.test',phone:'0400111222',resumeName:'resume.pdf',resumeData:'data:application/pdf;base64,JVBERi0xLjQK'}}];
 importLiveRequests(store,rows);const document=store.list('documents')[0],worker=store.list('workers')[0];
 saveDocument(store,document.id,{name:'Updated resume.pdf',category:'Ticket',expiry:'2027-01-01',content:'data:application/pdf;base64,JVBERi0yLjAK'},worker.id);
 importLiveRequests(store,rows);const updated=store.get('documents',document.id);assert.equal(updated.name,'Updated resume.pdf');assert.equal(updated.category,'Ticket');assert.equal(updated.content,'data:application/pdf;base64,JVBERi0yLjAK');assert.ok(!JSON.stringify(publicDocument(updated)).includes('base64'));
 deleteDocument(store,document.id);importLiveRequests(store,rows);assert.ok(store.get('documents',document.id).deletedAt);assert.throws(()=>saveDocument(store,document.id,{name:'Restored'},worker.id),/deleted/);
 const created=saveDocument(store,null,{name:'Local file.pdf',category:'Resume',content:'data:application/pdf;base64,JVBERi0xLjQK'},worker.id);assert.equal(created.workerId,worker.id);assert.equal(created.mimeType,'application/pdf');
 assert.throws(()=>saveDocument(store,created.id,{workerId:'another'},worker.id),/moved/);assert.throws(()=>saveDocument(store,null,{name:'Unsafe file',category:'Other',content:'data:text/html;base64,SGVsbG8='},worker.id),/Choose a PDF/);
});
test('worker registrations link verified accounts, preserve all fields, documents, history and local edits',t=>{
 const store=fixture(t),account={id:'worker-account',name:'Worker Account',email:'login@worker.test',createdAt:'2026-09-01T00:00:00Z',providers:['google'],emailVerified:true};
 const fields={applicationForm:'workerRegistration',fullName:'Worker Contact',email:'contact@worker.test',phone:'0400111222',location:'Geelong',workCategory:'Skilled Construction Labourers',availability:'Within 2 weeks',experienceTickets:'White Card; 5 years',additionalInformation:'Own transport',accountUserId:account.id,resumeName:'resume.pdf',resumeData:'data:application/pdf;base64,JVBERi0xLjQK',coverLetterName:'cover.pdf',coverLetterData:'data:application/pdf;base64,JVBERi0xLjQK',password:'must-never-be-stored'};
 const rows=[{id:'worker-1',created_at:'2026-10-01T00:00:00Z',fields}];
 importLiveRequests(store,rows,[account]);let worker=store.list('workers')[0];
 assert.equal(worker.accountEmail,'login@worker.test');assert.equal(worker.email,'contact@worker.test');assert.equal(worker.workType,fields.workCategory);assert.equal(worker.additionalInformation,'Own transport');assert.equal(store.list('users')[0].role,'worker');assert.equal(store.list('users')[0].signInMethod,'Google');assert.equal(store.list('documents').length,2);
 importLiveRequests(store,rows,[account]);assert.equal(store.list('workers').length,1);assert.equal(store.list('documents').length,2);assert.equal(store.list('workerRegistrations').length,1);
 store.save('workers',worker.id,{name:'Corrected Worker',status:'Unavailable'},{role:'admin'});
 importLiveRequests(store,[...rows,{id:'worker-2',created_at:'2026-10-02T00:00:00Z',fields:{...fields,location:'Melbourne',email:'new-contact@worker.test'}}],[account]);worker=store.list('workers')[0];assert.equal(worker.name,'Corrected Worker');assert.equal(worker.status,'Unavailable');assert.equal(worker.location,'Melbourne');assert.equal(store.list('workerRegistrations').length,2);assert.ok(!JSON.stringify(store.list('workerRegistrations')).includes('must-never-be-stored'));
 importLiveRequests(store,[{id:'other-worker',created_at:'2026-10-02T00:00:00Z',fields:{...fields,accountUserId:'different-account'}}],[account]);assert.equal(store.list('workers').length,2);
});


test('deleted source workers, employers, requests and accounts never reappear after live sync',t=>{
 const store=fixture(t),admin={role:'admin'},accounts=[{id:'delete-account',name:'Owner',email:'owner@delete.test',createdAt:'2026-10-01T00:00:00Z'}];
 const rows=[row('delete-request','2026-10-01T00:00:00Z',{accountUserId:'delete-account'}),{id:'delete-worker',created_at:'2026-10-01T00:00:00Z',fields:{applicationForm:'workerRegistration',accountUserId:'delete-account',fullName:'Worker',email:'worker@delete.test',phone:'0400111222',location:'Melbourne',workCategory:'Construction Labour',availability:'Immediately'}}];
 importLiveRequests(store,rows,accounts);
 for(const kind of ['workers','requests','employers','users'])for(const record of store.visible(kind))store.remove(kind,record.id,admin);
 importLiveRequests(store,[...rows,row('new-request','2026-10-02T00:00:00Z',{accountUserId:'delete-account'}),{...rows[1],id:'new-registration',created_at:'2026-10-02T00:00:00Z'}],accounts);
 for(const kind of ['workers','employers','users'])assert.equal(store.visible(kind).length,0,kind);
 assert.equal(store.visible('requests').some(r=>r.sourceId==='production:delete-request'),false);
 assert.equal(store.visible('requests').length,1,'a genuinely new request remains visible');
});


test('new verified worker activity restores its deleted login metadata without reviving old deleted profiles',t=>{
 const store=fixture(t),admin={role:'admin'},account={id:'returning-worker',name:'Login Owner',email:'login@return.test',createdAt:'2026-09-01T00:00:00Z',providers:['credential','google'],emailVerified:true,lastLogin:'2026-10-03T00:00:00Z'};
 const fields={applicationForm:'workerRegistration',accountUserId:account.id,fullName:'Site Worker',email:'contact@return.test',phone:'0400111222',location:'Melbourne',workCategory:'Construction Labour',availability:'Immediately'};
 const old={id:'old-worker-activity',created_at:'2026-10-01T00:00:00Z',fields};
 importLiveRequests(store,[old],[account]);const user=store.visible('users')[0];store.remove('users',user.id,admin);
 importLiveRequests(store,[old],[account]);assert.equal(store.visible('users').length,0);
 const deleted=store.get('users',user.id);store.db.prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify({...deleted,deletedAt:'2026-10-02T00:00:00Z'}),user.id);
 const recent={...old,id:'new-worker-activity',created_at:'2026-10-03T00:00:00Z'};
 importLiveRequests(store,[old,recent],[account]);const restored=store.visible('users')[0],worker=store.visible('workers')[0];
 assert.equal(restored.id,user.id);assert.equal(restored.reference,user.reference);assert.equal(restored.status,'Active');assert.equal(restored.signInMethod,'Email & password + Google');assert.equal(restored.email,'login@return.test');assert.equal(worker.userId,restored.id);assert.equal(worker.accountSignInMethod,restored.signInMethod);assert.equal(worker.email,'contact@return.test');assert.equal(store.visible('workers').length,1);
 store.remove('users',user.id,admin);importLiveRequests(store,[old,recent],[account]);assert.equal(store.visible('users').length,0,'deleting again stays deleted on replay');
 assert.ok(!JSON.stringify(store.snapshot(admin)).includes('passwordHash'));
});


test('a newer website request restores its deleted employer while deleted request history remains hidden',t=>{
 const store=fixture(t),admin={role:'admin'},old=row('old-company-request','2026-10-01T00:00:00Z',{accountUserId:'company-owner'});
 importLiveRequests(store,[old]);const employer=store.visible('employers')[0],request=store.visible('requests')[0];
 store.remove('requests',request.id,admin);store.remove('employers',employer.id,admin);importLiveRequests(store,[old]);assert.equal(store.visible('employers').length,0);
 const deleted=store.get('employers',employer.id);store.db.prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify({...deleted,deletedAt:'2026-10-02T00:00:00Z'}),employer.id);
 const fresh=row('new-company-request','2026-10-03T00:00:00Z',{accountUserId:'company-owner',company:'Updated Company'});
 importLiveRequests(store,[old,fresh]);const restored=store.visible('employers')[0],newRequest=store.visible('requests')[0];assert.equal(restored.id,employer.id);assert.equal(restored.reference,employer.reference);assert.equal(restored.status,'Active');assert.equal(restored.company,'Updated Company');assert.equal(newRequest.employerId,employer.id);assert.equal(store.visible('requests').length,1);
 store.save('jobs',null,{requestId:newRequest.id,employerId:restored.id,title:'Linked vacancy',location:newRequest.location,quantity:'1'},admin);
 store.remove('employers',employer.id,admin);importLiveRequests(store,[old,fresh]);assert.equal(store.visible('employers').length,0,'a second deletion is not undone by replay');assert.throws(()=>store.save('jobs',null,{requestId:newRequest.id,title:'Bad vacancy',location:'Melbourne',quantity:'1'},admin),/deleted/);
});
