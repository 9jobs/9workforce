import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createOTP} from '@better-auth/utils/otp';
import {WorkspaceStore} from '../store.mjs';
import {SettingsService} from '../settings-service.mjs';
const password='Dynamic-settings-test-123';
function fixture(t,mail={}){
 const dir=mkdtempSync(path.join(tmpdir(),'9wf-dynamic-')),store=new WorkspaceStore(dir),settings=new SettingsService(store,mail);
 const admin=store.register({name:'Settings Admin',email:'admin@example.test',password});
 const worker=store.register({name:'Settings Worker',email:'worker@example.test',password,role:'worker'},admin);
 t.after(()=>{settings.delivery.close();store.db.close();rmSync(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100})});
 return {dir,store,settings,admin,worker};
}
test('authenticator enrolment, encrypted persistence, login challenges and recovery codes are enforced',async t=>{
 const {store,settings,admin}=fixture(t),session=store.createSession(admin),other=store.createSession(admin),security=settings.security;
 assert.throws(()=>security.begin(admin,session.token,{currentPassword:'wrong'}),/incorrect/);
 const setup=security.begin(admin,session.token,{currentPassword:password});assert.ok(setup.uri.startsWith('otpauth://totp/'));
 const row=store.db.prepare('SELECT * FROM workspace_factors WHERE user_id=?').get(admin.id),raw=security.decrypt(row.secret);
 assert.ok(!row.secret.includes(raw));assert.ok(!JSON.stringify(settings.snapshot(admin)).includes(setup.secret));
 const code=await createOTP(raw).totp();
 await assert.rejects(()=>security.enable(admin,other.token,{code}),/No matching/);
 const enabled=await security.enable(admin,session.token,{code});assert.equal(enabled.recoveryCodes.length,8);assert.equal(store.session(other.token),null);
 assert.throws(()=>store.login({email:admin.email,password}),/Two-factor/);
 const challenge=security.login({email:admin.email,password},{userAgent:'Test browser'});assert.ok(challenge.twoFactorRequired);assert.equal(challenge.token,undefined);
 await assert.rejects(()=>security.verifyLogin({...challenge,code}),/already used/);
 const signed=await security.verifyLogin({...challenge,code:enabled.recoveryCodes[0]},{userAgent:'Firefox/100 Windows'});assert.equal(signed.user.id,admin.id);
 await assert.rejects(()=>security.verifyLogin({...challenge,code:enabled.recoveryCodes[1]}),/expired/);
 await assert.rejects(()=>security.useCode(admin,enabled.recoveryCodes[0]),/already-used/);
 assert.equal(security.status(admin).recoveryCodesRemaining,7);
 await security.disable(admin,signed.token,{currentPassword:password,code:enabled.recoveryCodes[1]});assert.equal(security.status(admin).enabled,false);
 assert.equal(store.session(session.token),null);assert.ok(security.login({email:admin.email,password}).token);
});
test('pending MFA expires, login attempts are bounded, and backup codes are replaced',async t=>{
 const {store,settings,admin}=fixture(t),security=settings.security,session=store.createSession(admin);
 security.begin(admin,session.token,{currentPassword:password});store.db.prepare('UPDATE workspace_factors SET pending_until=0').run();
 await assert.rejects(()=>security.enable(admin,session.token,{code:'123456'}),/No matching/);
 security.begin(admin,session.token,{currentPassword:password});const raw=security.decrypt(store.db.prepare('SELECT secret FROM workspace_factors').get().secret);
 const {recoveryCodes}=await security.enable(admin,session.token,{code:await createOTP(raw).totp()});
 const replaced=await security.regenerate(admin,{currentPassword:password,code:recoveryCodes[0]});assert.equal(replaced.recoveryCodes.length,8);
 await assert.rejects(()=>security.useCode(admin,recoveryCodes[1]),/already-used/);
 const challenge=security.login({email:admin.email,password});for(let n=0;n<5;n++)await assert.rejects(()=>security.verifyLogin({...challenge,code:'invalid'}));
 await assert.rejects(()=>security.verifyLogin({...challenge,code:replaced.recoveryCodes[0]}),/expired/);
 for(let n=0;n<10;n++)assert.throws(()=>security.login({email:'unknown@example.test',password:'wrong'}),/incorrect/);
 assert.throws(()=>security.login({email:'unknown@example.test',password:'wrong'}),/Too many/);
});
test('session policy applies to existing and new sessions; revocation cannot target another owner',t=>{
 const {store,settings,admin,worker}=fixture(t),session=store.createSession(admin,{userAgent:'Firefox/100 Windows'}),other=store.createSession(admin),foreign=store.createSession(worker);
 settings.save(admin,'security',{sessionHours:'1'});const sessions=settings.sessions(admin,session.token);assert.equal(sessions.length,2);assert.ok(sessions.every(s=>Date.parse(s.expiresAt)<=Date.now()+3600000));assert.ok(sessions.find(s=>s.current).device.includes('Firefox'));
 const own=sessions.find(s=>!s.current),foreignId=settings.sessions(worker,foreign.token)[0].id;
 assert.throws(()=>settings.revokeSession(admin,session.token,{id:foreignId,currentPassword:password}),/not found/);
 assert.throws(()=>settings.revokeSession(admin,session.token,{id:sessions.find(s=>s.current).id,currentPassword:password}),/Use Logout/);
 settings.revokeSession(admin,session.token,{id:own.id,currentPassword:password});assert.equal(store.session(other.token),null);assert.ok(store.session(foreign.token));
 const fresh=store.createSession(admin);assert.ok(settings.sessions(admin,fresh.token).every(s=>Date.parse(s.expiresAt)<=Date.now()+3600000));
});
test('sharing filters profile and contact data server-side and notification read state is owned and durable',t=>{
 const {dir,store,settings,admin,worker}=fixture(t);assert.deepEqual(settings.activity.directory(admin),[]);
 settings.save(worker,'privacy',{profileVisibility:'Workspace',contactVisibility:'Private'});let directory=settings.activity.directory(admin);assert.equal(directory.length,1);assert.equal(directory[0].email,undefined);
 settings.save(worker,'privacy',{contactVisibility:'Workspace'});assert.equal(settings.activity.directory(admin)[0].email,worker.email);
 settings.save(worker,'privacy',{profileVisibility:'Private'});assert.deepEqual(settings.activity.directory(admin),[]);
 settings.audit(admin,'Profile updated',admin.id,'Own profile');settings.audit(worker,'Profile updated',worker.id,'Other profile');
 const event=settings.activity.feed(admin).find(e=>e.type==='security');assert.equal(event.read,false);settings.activity.mark(admin,{key:event.key});assert.equal(settings.activity.feed(admin).find(e=>e.key===event.key).read,true);
 assert.throws(()=>settings.activity.mark(worker,{key:event.key}),/Unknown/);
 const reopened=new WorkspaceStore(dir),service=new SettingsService(reopened);try{assert.equal(service.activity.feed(admin).find(e=>e.key===event.key).read,true);assert.equal(service.preferences(worker).privacy.profileVisibility,'Private')}finally{service.delivery.close();reopened.db.close()}
 settings.save(admin,'notifications',{inApp:false});assert.ok(settings.activity.feed(admin).some(e=>e.type==='security'));
});
test('email delivery is opt-in, accepts only new events, deduplicates and cancels queued mail on opt-out',async t=>{
 const sent=[],transport={verify:async()=>true,sendMail:async mail=>{sent.push(mail);return {accepted:[mail.to],rejected:[]}}};
 const {settings,admin}=fixture(t,{transport});settings.audit(admin,'Profile updated',admin.id,'Old event');await settings.delivery.process();assert.equal(sent.length,0);
 settings.save(admin,'notifications',{email:true});settings.db.prepare('UPDATE workspace_email_state SET enabled_at=?').run(new Date(Date.now()+100).toISOString());
 await settings.delivery.process();assert.equal(sent.length,0);
 settings.db.prepare('UPDATE workspace_email_state SET enabled_at=?').run(new Date(Date.now()-1).toISOString());settings.audit(admin,'Password changed',admin.id,'New event');
 await settings.delivery.process();assert.ok(sent.length>=1);const count=sent.length;assert.ok(sent.every(mail=>mail.to===admin.email));await settings.delivery.process();assert.equal(sent.length,count);
 assert.equal((await settings.delivery.verify(admin)).connected,true);await settings.delivery.test(admin);assert.equal(sent.length,count+1);assert.equal(settings.delivery.status(admin).delivery[0].status,'Accepted');
 await assert.rejects(()=>settings.delivery.test(admin),/Too many/);
 settings.save(admin,'notifications',{email:false});settings.audit(admin,'Profile updated',admin.id,'After opting out');await settings.delivery.process();assert.equal(sent.length,count+1);
});
test('SMTP failures are recorded without claiming success and retry queue respects privacy changes',async t=>{
 const {settings,admin}=fixture(t,{transport:{sendMail:async()=>{throw new Error('private SMTP credential must not leak')}}});
 await assert.rejects(()=>settings.delivery.test(admin),/did not accept/);let item=settings.delivery.status(admin).delivery[0];assert.equal(item.status,'Retrying');assert.ok(!item.error.includes('credential'));
 settings.delivery.disable(admin);assert.equal(settings.delivery.status(admin).delivery[0].status,'Cancelled');
});
test('deactivation request withdrawal and review enforce ownership, invalidate sessions and protect last admin',t=>{
 const {store,settings,admin,worker}=fixture(t),session=store.createSession(worker);let request=settings.requestDeactivation(worker,{confirm:'DEACTIVATE',currentPassword:password});
 assert.throws(()=>settings.activity.withdraw(admin,{id:request.id}),/cannot change/);settings.activity.withdraw(worker,{id:request.id});assert.equal(settings.activity.request(worker).status,'Withdrawn');
 request=settings.requestDeactivation(worker,{confirm:'DEACTIVATE',currentPassword:password});assert.throws(()=>settings.activity.review(worker,{id:request.id,decision:'Approved',currentPassword:password}),/Administrator/);
 settings.activity.review(admin,{id:request.id,decision:'Approved',currentPassword:password});assert.equal(store.get('users',worker.id).status,'Inactive');assert.equal(store.session(session.token),null);
 const own=settings.requestDeactivation(admin,{confirm:'DEACTIVATE',currentPassword:password});assert.throws(()=>settings.activity.review(admin,{id:own.id,decision:'Approved',currentPassword:password}),/last active/);
 settings.activity.review(admin,{id:own.id,decision:'Rejected',currentPassword:password});assert.equal(settings.activity.request(admin).status,'Rejected');assert.equal(store.get('users',admin.id).status,'Active');
});
