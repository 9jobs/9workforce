import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {WorkspaceStore} from '../store.mjs';
import {publicJobs} from '../public-jobs.mjs';
import {createLiveJobPublisher} from '../live-job-posts.mjs';
const admin={role:'admin'};
function fixture(t){const store=new WorkspaceStore(mkdtempSync(path.join(tmpdir(),'jobs-test-')));t.after(()=>store.db.close());return store;}

test('role sections survive saving, public filtering and live publication, including edits',async t=>{
 const store=fixture(t),writes=[],publisher=createLiveJobPublisher({env:{},database:{query:async(sql,values)=>writes.push(values),end:async()=>{}}});
 const job=store.save('jobs',null,{title:'Site Labourer',location:'Melbourne',quantity:'1',status:'Open',aboutRole:'Support site crews.\nWork across Melbourne.',keyResponsibilities:'Move materials.\nKeep the site tidy.'},admin);
 await publisher.flush(store);
 for(const visible of [publicJobs(store)[0],JSON.parse(writes.at(-1)[1])]){
  assert.equal(visible.aboutRole,job.aboutRole);assert.equal(visible.keyResponsibilities,job.keyResponsibilities);
 }
 store.save('jobs',job.id,{keyResponsibilities:'Follow site safety procedures.'},admin);await publisher.flush(store);
 assert.equal(JSON.parse(writes.at(-1)[1]).keyResponsibilities,'Follow site safety procedures.');
 assert.equal(publicJobs(store)[0].aboutRole,job.aboutRole);
});
test('only published jobs expose whitelisted vacancy fields; edits, closing and deletion update publication',async t=>{
 const store=fixture(t),writes=[],database={query:async(sql,values)=>{writes.push(values);},end:async()=>{}},publisher=createLiveJobPublisher({env:{},database});
 const job=store.save('jobs',null,{title:'Site Crew',location:'Melbourne',quantity:'2',description:'Private-safe vacancy'},admin);assert.equal(publicJobs(store).length,0);
 store.save('jobs',job.id,{status:'Open',rate:'$40/hour'},admin);await publisher.flush(store);assert.equal(writes.length,1);assert.equal(store.get('jobs',job.id).publicationPending,false);
 const visible=publicJobs(store);assert.equal(visible[0].title,'Site Crew');assert.ok(!JSON.stringify(visible).match(/employerId|publicationPending|publicationRevision|localOverrides/));
 store.save('jobs',job.id,{title:'Updated Crew'},admin);await publisher.flush(store);assert.equal(JSON.parse(writes.at(-1)[1]).title,'Updated Crew');
 store.save('jobs',job.id,{status:'Closed'},admin);await publisher.flush(store);assert.equal(publicJobs(store).length,0);assert.equal(writes.at(-1)[2],'Closed');
 store.remove('jobs',job.id,admin);await publisher.flush(store);assert.ok(writes.at(-1)[4]);assert.equal(store.get('jobs',job.id).publicationPending,false);assert.equal(store.visible('jobs').length,0);
 await publisher.flush(store);assert.equal(writes.length,4,'successful publishing does not enqueue itself');
});
test('a failed live publication remains queued and retries without discarding admin changes',async t=>{
 const store=fixture(t);let unavailable=true;const publisher=createLiveJobPublisher({env:{},database:{query:async()=>{if(unavailable)throw Error('Offline');},end:async()=>{}}});
 const job=store.save('jobs',null,{title:'Reliable Crew',location:'Geelong',quantity:'1',status:'Open'},admin);
 await assert.rejects(publisher.flush(store),/Offline/);assert.equal(store.get('jobs',job.id).publicationPending,true);
 unavailable=false;await publisher.flush(store);assert.equal(store.get('jobs',job.id).publicationPending,false);assert.equal(store.get('jobs',job.id).title,'Reliable Crew');
});
test('a newer edit made during a live write is published after the older revision',async t=>{
 const store=fixture(t),writes=[];let release,started;
 const start=new Promise(resolve=>{started=resolve;}),wait=new Promise(resolve=>{release=resolve;});
 const publisher=createLiveJobPublisher({env:{},database:{query:async(sql,values)=>{writes.push(values);if(writes.length===1){started();await wait;}},end:async()=>{}}});
 const job=store.save('jobs',null,{title:'First Title',location:'Melbourne',quantity:'1',status:'Open'},admin);
 const pending=publisher.flush(store);await start;store.save('jobs',job.id,{title:'Latest Title'},admin);release();await pending;
 assert.equal(writes.length,2);assert.equal(JSON.parse(writes[1][1]).title,'Latest Title');assert.equal(store.get('jobs',job.id).publicationPending,false);
});


test('queued deletion retries in the background after the connection recovers without another browser request',async t=>{
 const store=fixture(t);let offline=false;const writes=[];
 const publisher=createLiveJobPublisher({env:{},retryInterval:20,database:{query:async(sql,values)=>{if(offline)throw Error('offline');writes.push(values);},end:async()=>{}}});
 t.after(()=>publisher.close());
 const job=store.save('jobs',null,{title:'Delete retry',location:'Melbourne',quantity:'1',status:'Open'},admin);await publisher.flush(store);
 offline=true;store.remove('jobs',job.id,admin);await assert.rejects(publisher.flush(store),/offline/);assert.equal(store.visible('jobs').length,0);assert.equal(store.get('jobs',job.id).publicationPending,true);
 offline=false;await new Promise(resolve=>setTimeout(resolve,90));assert.ok(writes.at(-1)[4]);assert.equal(store.get('jobs',job.id).publicationPending,false);
});


test('company names are inferred from the linked employer, editable, published, and backfilled for older jobs',async t=>{
 const store=fixture(t),employer=store.save('employers',null,{name:'Contact',company:'Employer Company',email:'contact@company.test'},admin);
 const request=store.save('requests',null,{employerId:employer.id,position:'General Labourers',location:'Melbourne',quantity:'2'},admin);
 const job=store.save('jobs',null,{requestId:request.id,title:'Company vacancy',location:'Melbourne',quantity:'2',status:'Open'},admin);
 assert.equal(job.company,'Employer Company');assert.equal(publicJobs(store)[0].company,'Employer Company');
 store.save('jobs',job.id,{company:'Public trading name'},admin);assert.equal(store.get('jobs',job.id).company,'Public trading name');assert.equal(store.get('employers',employer.id).company,'Employer Company');
 const writes=[],publisher=createLiveJobPublisher({env:{},database:{query:async(sql,values)=>{writes.push(values);},end:async()=>{}}});await publisher.flush(store);assert.equal(JSON.parse(writes[0][1]).company,'Public trading name');
 const legacy=store.get('jobs',job.id);delete legacy.company;store.db.prepare('UPDATE records SET data=? WHERE id=?').run(JSON.stringify({...legacy,publicationPending:false}),job.id);
 const reopened=new WorkspaceStore(path.dirname(store.db.prepare('PRAGMA database_list').get().file));try{const restored=reopened.get('jobs',job.id);assert.equal(restored.company,'Employer Company');assert.equal(restored.reference,legacy.reference);assert.equal(restored.publicationPending,true);}finally{reopened.db.close();}
});
