import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createServer} from 'node:http';
import {WorkspaceStore} from '../store.mjs';
import {SubmissionNotifications} from '../submission-notifications.mjs';
import {importLiveRequests} from '../live-submissions.mjs';
import {workspaceApi} from '../api.mjs';
const password='Notification-test-123';
function fixture(t){const dir=mkdtempSync(path.join(tmpdir(),'9wf-submission-alerts-')),store=new WorkspaceStore(dir),notifications=new SubmissionNotifications(store);const admin=store.register({name:'Alert Admin',email:'alerts@example.test',password});t.after(()=>{store.db.close();rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100})});return {dir,store,notifications,admin};}
const worker=(id,name,date='2026-10-24T09:00:00Z')=>({id,created_at:date,fields:{applicationForm:'workerRegistration',fullName:name,email:'worker@example.test',accountUserId:'worker-owner'}});
const employer=(id,name)=>({id,created_at:'2026-10-24T10:00:00Z',fields:{applicationForm:'workerRequest',fullName:name,company:'Site Company',workersRequired:'General Labourers',siteLocation:'Melbourne',workerCount:'1',email:'contact@example.test',accountUserId:'employer-owner'}});
test('one notification per submitted form preserves each submitter name across repeated sync and local edits',t=>{
 const {store,notifications,admin}=fixture(t),rows=[worker('w1','First Worker'),worker('w2','Returning Worker','2026-10-24T11:00:00Z'),employer('e1','First Contact'),employer('e2','Second Contact')];
 importLiveRequests(store,rows);assert.equal(store.list('workers').length,1);assert.equal(store.list('employers').length,1);let result=notifications.snapshot(admin);assert.equal(result.unread,4);assert.deepEqual(result.notifications.map(n=>n.name).sort(),['First Contact','First Worker','Returning Worker','Second Contact']);assert.equal(result.notifications.filter(n=>n.kind==='employer').length,2);
 const event=result.notifications[0];notifications.mark(admin,{id:event.id});importLiveRequests(store,rows);assert.equal(notifications.snapshot(admin).unread,3);
 const profile=store.list('workers')[0];store.save('workers',profile.id,{name:'Locally edited name'},admin);const request=store.list('requests')[0];store.save('requests',request.id,{contactName:'Locally edited contact',status:'Reviewing'},admin);
 result=notifications.snapshot(admin);assert.equal(result.total,4);assert.ok(!result.notifications.some(n=>n.name.startsWith('Locally')));assert.ok(!JSON.stringify(result).includes('worker@example.test'));
});
test('read state is persistent, owned by each admin, and excludes previews and unrelated account events',t=>{
 const {dir,store,notifications,admin}=fixture(t);const second=store.register({name:'Second Admin',email:'second@example.test',password,role:'admin'},admin);const preview=store.preview('worker').user;store.put('jobs',{id:'job',title:'Unrelated job',createdAt:new Date().toISOString()});importLiveRequests(store,[worker('w1','Worker Name')]);
 assert.equal(notifications.snapshot(admin).total,1);assert.throws(()=>notifications.snapshot(preview),/Administrator/);assert.throws(()=>notifications.mark(admin,{id:'not-a-submission'}),/not found/);notifications.mark(admin,{all:true});assert.equal(notifications.snapshot(admin).unread,0);assert.equal(notifications.snapshot(second).unread,1);
 const reopened=new WorkspaceStore(dir);try{assert.equal(new SubmissionNotifications(reopened).snapshot(admin).unread,0)}finally{reopened.db.close()}
 importLiveRequests(store,[employer('e1','New Contact')]);assert.equal(notifications.snapshot(admin).unread,1);assert.equal(notifications.snapshot(admin).total,2);
});
test('legacy exported forms produce alerts without inventing alerts for manually-created profiles',t=>{
 const {store,notifications,admin}=fixture(t);store.put('workers',{id:'legacy',sourceId:'legacy-form',name:'Legacy Worker',createdAt:'2026-10-23T09:00:00Z'});store.put('workers',{id:'manual',name:'Manual Worker',createdAt:'2026-10-23T09:00:00Z'});assert.equal(notifications.snapshot(admin).total,1);assert.equal(notifications.snapshot(admin).notifications[0].name,'Legacy Worker');
});
test('HTTP submission notifications require an admin session and reject cross-origin writes',async t=>{
 const dir=mkdtempSync(path.join(tmpdir(),'9wf-notifications-http-')),store=new WorkspaceStore(dir),admin=store.register({name:'HTTP Admin',email:'http@example.test',password}),workerUser=store.register({name:'HTTP Worker',email:'http-worker@example.test',password,role:'worker'},admin),session=store.createSession(admin),workerSession=store.createSession(workerUser);importLiveRequests(store,[employer('http-form','HTTP Contact')]);
 const handler=workspaceApi(dir),server=createServer((req,res)=>handler(req,res,()=>{res.statusCode=404;res.end()}));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(async()=>{await new Promise(resolve=>server.close(resolve));handler.close();store.db.close()});
 const base=`http://127.0.0.1:${server.address().port}/api/workspace/`,call=(route,token,role='admin',body,extra={})=>fetch(base+route,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-Workspace-Role':role,...(token?{Cookie:`${role==='admin'?'workforce_local_session':'workforce_local_worker'}=${token}`} :{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await call('submission-notifications')).status,401);assert.equal((await call('submission-notifications',workerSession.token,'worker')).status,403);const result=await (await call('submission-notifications',session.token)).json();assert.equal(result.notifications[0].name,'HTTP Contact');assert.equal((await call('submission-notifications/read',session.token,'admin',{all:true},{Origin:'https://untrusted.example'})).status,403);assert.equal((await call('submission-notifications/read',session.token,'admin',{id:result.notifications[0].id})).status,200);assert.equal((await (await call('submission-notifications',session.token)).json()).unread,0);
});
