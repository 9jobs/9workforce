import {SubmissionNotifications} from './submission-notifications.mjs';
import {SettingsService,handleSettings} from './settings-service.mjs';
import {WorkspaceStore} from './store.mjs';
import {importSubmissions} from './import-submissions.mjs';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicDocument,saveDocument,deleteDocument} from './document-store.mjs';

export function workspaceApi(directory=path.join(path.dirname(fileURLToPath(import.meta.url)),'data'),{websiteBridge,websiteUrl='http://127.0.0.1:3001',liveSync,jobPublisher,settingsMail={},hosted=false}={}){
 const store=new WorkspaceStore(directory);
 const settings=new SettingsService(store,settingsMail);
 const submissions=new SubmissionNotifications(store);
 const handler=async(req,res,next)=>{
  const url=new URL(req.url,'http://127.0.0.1:3002');if(!url.pathname.startsWith('/api/workspace/'))return next();
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  try{
   if(!hosted&&req.headers.host&&!/^((127\.0\.0\.1)|(localhost))(:\d+)?$/.test(req.headers.host))return send(403,{error:'Localhost access only.'});
   if(req.method!=='GET'&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'Cross-origin writes are not allowed.'});
   const scope=req.headers['x-workspace-role']||url.searchParams.get('workspace');
   if(hosted&&['worker','employer'].includes(scope))return send(403,{error:'Hosted workspace requires administrator access.'});
   const cookieName=['worker','employer'].includes(scope)?`workforce_local_${scope}`:'workforce_local_session';
   const token=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.split('=')[1];
   const route=url.pathname.slice('/api/workspace/'.length);
   if(hosted&&['register','preview'].includes(route))return send(403,{error:'Local setup and preview access are disabled on the hosted workspace.'});
   const consoleRole=scope==='employer'?'employer':'admin';
   const consoleUser=store.list('users').find(u=>u.id==='local-console-'+consoleRole)||{id:'local-console-'+consoleRole,name:consoleRole==='employer'?'Employer':'Administrator',role:consoleRole,status:'Active',source:'local-console'};
   let user=token==='signed-out'?null:scope==='employer'&&!token?(consoleUser.status==='Active'?consoleUser:null):store.session(token);
   if(scope!=='worker'&&scope!=='employer'&&user?.role!=='admin')user=null;
   let body={};if(!['GET','HEAD'].includes(req.method)){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>3100000)store.fail('Upload exceeds 2 MB limit.',413);}try{body=raw?JSON.parse(raw):{};}catch{store.fail('Invalid JSON.');}}
   if(route==='session'&&req.method==='GET'){
    // Preserve the local employer console, but give its preferences an explicit scoped session.
    if(scope==='employer'&&user&&!token){store.put('users',user);const session=store.createSession(user,{userAgent:req.headers['user-agent']});res.setHeader('Set-Cookie',`workforce_local_employer=${session.token}; HttpOnly; SameSite=Strict; Path=/api/workspace; Max-Age=43200`);}
    return send(200,{user,setup:!store.hasAdmin(),websiteUrl,mode:'local-console',signedOut:token==='signed-out'});
   }
   if(route==='register'&&req.method==='POST'){
    if(store.hasAdmin())store.fail('An admin account is already configured. Please sign in.',403);
    const account=store.register({...body,role:'admin'});
    const result=store.createSession(account,{userAgent:req.headers['user-agent']});
    res.setHeader('Set-Cookie',`workforce_local_session=${result.token}; HttpOnly; SameSite=Strict; Path=/api/workspace; Max-Age=43200`);
    return send(201,{user:result.user});
   }
   if(['login','login/verify'].includes(route)&&req.method==='POST'){
    const metadata={userAgent:req.headers['user-agent']};
    const result=route==='login'?settings.security.login(hosted?{...body,role:'admin'}:body,metadata):await settings.security.verifyLogin(body,metadata);
    if(result.twoFactorRequired)return send(200,result);
    if(user)store.logout(token);
    res.setHeader('Set-Cookie',`workforce_local_session=${result.token}; HttpOnly; SameSite=Strict; Path=/api/workspace; Max-Age=43200`);
    return send(200,{user:result.user});
   }
   if(route==='preview'&&req.method==='POST'){
    if(!['admin','employer','worker'].includes(body.role))store.fail('Unknown preview workspace.');
    if(body.role==='admin'){
     const admin=store.session(req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('workforce_local_session='))?.slice('workforce_local_session='.length));
     if(admin?.role!=='admin')store.fail('Please sign in to your admin account.',401);
     return send(200,{user:admin});
    }
    if(body.role==='employer'){
     const profile=store.list('users').find(u=>u.id==='local-console-employer')||{id:'local-console-employer',name:'Employer',role:'employer',status:'Active',source:'local-console'};
     if(profile.status!=='Active'||profile.deletedAt)store.fail('This local profile is deactivated.',403);
     store.put('users',profile);const result=store.createSession(profile,{userAgent:req.headers['user-agent']});
     res.setHeader('Set-Cookie',`workforce_local_employer=${result.token}; HttpOnly; SameSite=Strict; Path=/api/workspace; Max-Age=43200`);
     return send(200,{user:result.user});
    }
    if(user?.role===body.role)return send(200,{user});
    const result=store.preview(body.role,{userAgent:req.headers['user-agent']});res.setHeader('Set-Cookie',`workforce_local_${body.role}=${result.token}; HttpOnly; SameSite=Strict; Path=/api/workspace; Max-Age=43200`);return send(200,{user:result.user});
   }
   if(route==='logout'&&req.method==='POST'){
    store.logout(token);
    res.setHeader('Set-Cookie',`${cookieName}=signed-out; HttpOnly; SameSite=Strict; Path=/api/workspace; Max-Age=43200`);
    return send(200,{ok:true});
   }
   if(route==='password')return send(404,{error:'Unknown local workspace endpoint.'});
   if(await handleSettings({service:settings,store,user,token,scope,route,req,res,send,body,url}))return;
   if(!user)return send(401,{error:'Please sign in to open this workspace.'});
   if(route==='submission-notifications'&&req.method==='GET')return send(200,submissions.snapshot(user));
   if(route==='submission-notifications/read'&&req.method==='POST')return send(200,submissions.mark(user,body));
   if(route==='profile'&&req.method==='PATCH'){
    const authenticated=store.session(token),expected=['worker','employer'].includes(scope)?scope:'admin';
    if(!authenticated||authenticated.role!==expected)store.fail('Please sign in to update your profile.',401);
    user=authenticated;
    return send(200,{user:settings.updateProfile(user,body)});
   }
   if(route==='data'&&req.method==='GET'){
    const sync=liveSync?await liveSync(store):null;
    let publicationError='';if(jobPublisher)try{await jobPublisher.flush(store);}catch{publicationError='Some job changes are saved locally and waiting to publish. Refresh to retry.';}
    const snapshot=store.snapshot(scope==='employer'?{role:'admin'}:user);
    const deletedAccounts=new Set(store.list('users').filter(u=>u.deletedAt).map(u=>u.id));
    const registrations=store.visible('workers').filter(w=>['website','production-website'].includes(w.source)).map(w=>({...w,accountDeleted:deletedAccounts.has(w.userId)}));
    const registrationIds=new Set(registrations.map(w=>w.id)),accountIds=new Set(registrations.map(w=>w.userId).filter(Boolean));
    if(scope!=='employer'){
     snapshot.registrations=registrations;
     snapshot.registrationAccounts=store.visible('users').filter(u=>accountIds.has(u.id)).map(u=>store.publicUser(u));
     snapshot.registrationHistory=store.visible('workerRegistrations').filter(r=>registrationIds.has(r.workerId));
     snapshot.registrationApplications=store.visible('applications').filter(a=>registrationIds.has(a.workerId));
     snapshot.registrationAssignments=store.visible('assignments').filter(a=>registrationIds.has(a.workerId));
    }
    snapshot.documents=store.list('documents').filter(d=>!d.deletedAt&&(user.role==='admin'||d.workerId===store.own('workers',user)?.id||scope==='worker'&&registrationIds.has(d.workerId))).map(publicDocument);return send(200,{...snapshot,publicationError,...(sync?{sync}:{})});
   }
   const employerManagement=scope==='employer'&&/^(employers|requests|users)\/[^/]+$/.test(route)&&['PATCH','DELETE'].includes(req.method);
   if(scope==='employer'&&req.method!=='GET'&&!employerManagement)store.fail('This action is not available in the employer records console.',403);
   const [managementKind,managementId]=route.split('/');
   const workerManagement=scope==='worker'&&managementId&&['PATCH','DELETE'].includes(req.method)&&(['workers','users'].includes(managementKind))&&(()=>{const record=store.get(managementKind,managementId);return ['website','production-website'].includes(record.source)&&(managementKind==='workers'||store.list('workers').some(w=>w.userId===record.id&&['website','production-website'].includes(w.source)));})();
   const operator=employerManagement||workerManagement?{...user,role:'admin'}:user;
   if(route==='assign'&&req.method==='POST'){const result=store.assign(body,user);settings.audit(user,'Workers assigned','assignments',`${result.length} assignment records created`);return send(201,result);}
   
   if(route==='import'&&req.method==='POST'){if(user.role!=='admin')store.fail('Administrator access required.',403);return send(200,importSubmissions(store,body.rows));}
   if(route==='documents'||route.startsWith('documents/')){
    const id=route.split('/')[1],doc=id?store.get('documents',id):null;
    const workerId=doc?.workerId||body.workerId||(user.role==='worker'?store.own('workers',user)?.id:undefined);
    const worker=store.get('workers',workerId);if(worker.deletedAt)store.fail('Worker has been deleted.',404);
    if(user.role!=='admin'&&!(scope==='worker'&&(worker.userId===user.id||['website','production-website'].includes(worker.source))))store.fail('Access denied.',403);
    if(req.method==='POST'&&!id){const result=saveDocument(store,null,body,workerId);settings.audit(user,'Document uploaded',result.id,'Worker document saved');return send(201,result);}
    if(req.method==='PATCH'&&id){const result=saveDocument(store,id,body,workerId);settings.audit(user,'Document updated',id,'Worker document updated');return send(200,result);}
    if(req.method==='DELETE'&&id){const result=deleteDocument(store,id);settings.audit(user,'Document deleted',id,'Document removed from local panel');return send(200,result);}
    if(req.method==='GET'&&doc){
     if(doc.deletedAt)store.fail('Document has been deleted.',404);
     const [prefix,encoded]=doc.content.split(','),mime=prefix.slice(5,-7),inline=url.searchParams.get('view')==='1'&&/^(application\/pdf|image\/(png|jpeg|webp))$/.test(mime);
     res.writeHead(200,{'Content-Type':mime,'Content-Disposition':`${inline?'inline':'attachment'}; filename*=UTF-8''${encodeURIComponent(doc.name)}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(inline?{'Content-Security-Policy':"sandbox; default-src 'none'"}:{})});return res.end(Buffer.from(encoded,'base64'));
    }
    return send(405,{error:'Unsupported document operation.'});
   }
   const [kind,id]=route.split('/');
   if(kind==='users'&&id&&req.method!=='GET'){
    const account=store.get('users',id);
    if(scope==='employer'&&!['website','production-website'].includes(account.source))store.fail('Only website account records can be managed here.',403);
    if(['website','production-website'].includes(account.source)&&Object.keys(body).some(key=>!['name','status'].includes(key)))store.fail('Only the local display name and management status can be changed. Website login details are unchanged.',403);
   }
   if(['employers','requests'].includes(kind)){
    if(req.method==='POST')store.fail('Employer details and requests are received automatically from the website Request Workers form.',403);
    if(req.method==='PATCH'&&operator.role!=='admin')store.fail('Management access required.',403);
   }
   if(['POST','PATCH','DELETE'].includes(req.method)&&(id||req.method==='POST')){
    const result=req.method==='DELETE'?store.remove(kind,id,operator):store.save(kind,id||null,body,req.method==='POST'?user:operator);
    settings.audit(user,req.method==='DELETE'?'Record deleted':req.method==='POST'?'Record created':'Record updated',kind+'/'+(id||result.id),'Local workforce record');
    if(kind==='jobs'&&jobPublisher)try{await jobPublisher.flush(store);}catch{store.fail('Job change saved locally, but live publishing failed. Refresh to retry.',503);}
    return send(req.method==='POST'?201:200,result);
   }
   send(404,{error:'Unknown local workspace endpoint.'});
  }catch(error){if(!error.status)console.error('Local workspace API:',error.message);send(error.status||500,{error:error.status?error.message:'The local database operation failed. Please retry.'});}
 };
 handler.store=store;handler.close=()=>settings.delivery.close();return handler;
}
