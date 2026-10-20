import {WorkspaceStore} from './store.mjs';
import {importSubmissions} from './import-submissions.mjs';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {publicDocument,saveDocument,deleteDocument} from './document-store.mjs';

export function workspaceApi(directory=path.join(path.dirname(fileURLToPath(import.meta.url)),'data'),{websiteBridge,websiteUrl='http://127.0.0.1:3001',liveSync,jobPublisher}={}){
 const store=new WorkspaceStore(directory);
 return async(req,res,next)=>{
  const url=new URL(req.url,'http://127.0.0.1:3002');if(!url.pathname.startsWith('/api/workspace/'))return next();
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  try{
   if(req.headers.host&&!/^((127\.0\.0\.1)|(localhost))(:\d+)?$/.test(req.headers.host))return send(403,{error:'Localhost access only.'});
   if(req.method!=='GET'&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'Cross-origin writes are not allowed.'});
   const scope=req.headers['x-workspace-role']||url.searchParams.get('workspace');
   const cookieName=['worker','employer'].includes(scope)?`workforce_local_${scope}`:'workforce_local_session';
   const token=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.split('=')[1];
   const route=url.pathname.slice('/api/workspace/'.length);
   const consoleRole=scope==='employer'?'employer':'admin';
   const consoleUser={id:'local-console-'+consoleRole,name:consoleRole==='employer'?'Employer records':'Local workspace',role:consoleRole,status:'Active'};
   let user=scope==='worker'?store.session(token):consoleUser;
   let body={};if(!['GET','HEAD'].includes(req.method)){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>3100000)store.fail('Upload exceeds 2 MB limit.',413);}try{body=raw?JSON.parse(raw):{};}catch{store.fail('Invalid JSON.');}}
   if(route==='session'&&req.method==='GET')return send(200,{user,setup:false,websiteUrl,mode:'local-console'});
   if(route==='preview'&&req.method==='POST'){
    if(body.role==='employer')store.fail('Sign in through the website and submit Request Workers.',403);
    if(body.role!=='worker')store.fail('Unknown preview workspace.');
    if(user?.role===body.role)return send(200,{user});
    const result=store.preview(body.role);res.setHeader('Set-Cookie',`workforce_local_${body.role}=${result.token}; HttpOnly; SameSite=Strict; Path=/api/workspace; Max-Age=43200`);return send(200,{user:result.user});
   }
   if(['login','register','logout','password'].includes(route))return send(404,{error:'This local panel does not use login or password forms.'});
   if(!user)return send(400,{error:'Open the worker workspace to load its local profile.'});
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
   if(route==='assign'&&req.method==='POST')return send(201,store.assign(body,user));
   
   if(route==='import'&&req.method==='POST'){if(user.role!=='admin')store.fail('Administrator access required.',403);return send(200,importSubmissions(store,body.rows));}
   if(route==='documents'||route.startsWith('documents/')){
    const id=route.split('/')[1],doc=id?store.get('documents',id):null;
    const workerId=doc?.workerId||body.workerId||(user.role==='worker'?store.own('workers',user)?.id:undefined);
    const worker=store.get('workers',workerId);if(worker.deletedAt)store.fail('Worker has been deleted.',404);
    if(user.role!=='admin'&&!(scope==='worker'&&(worker.userId===user.id||['website','production-website'].includes(worker.source))))store.fail('Access denied.',403);
    if(req.method==='POST'&&!id)return send(201,saveDocument(store,null,body,workerId));
    if(req.method==='PATCH'&&id)return send(200,saveDocument(store,id,body,workerId));
    if(req.method==='DELETE'&&id)return send(200,deleteDocument(store,id));
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
    if(kind==='jobs'&&jobPublisher)try{await jobPublisher.flush(store);}catch{store.fail('Job change saved locally, but live publishing failed. Refresh to retry.',503);}
    return send(req.method==='POST'?201:200,result);
   }
   send(404,{error:'Unknown local workspace endpoint.'});
  }catch(error){if(!error.status)console.error('Local workspace API:',error.message);send(error.status||500,{error:error.status?error.message:'The local database operation failed. Please retry.'});}
 };
}
