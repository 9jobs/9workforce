import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {workspaceApi} from '../api.mjs';
import {encryptWorkspace,decryptWorkspace,readWorkspaceState,serveCloudWorkspace} from '../../lib/cloudWorkspace.js';

const secret='a'.repeat(96);
function fixture(t){
 const directory=mkdtempSync(path.join(tmpdir(),'cloud-workspace-test-')),api=workspaceApi(directory);
 api.store.register({name:'Cloud Admin',email:'cloud@example.test',password:'CloudTestPassword123'});
 api.close();api.store.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');api.store.db.close();
 let state=encryptWorkspace(readWorkspaceState(directory),secret),failCommit=false;
 t.after(()=>rmSync(directory,{recursive:true,force:true}));
 const pool={async connect(){let pending=state;return {async query(sql,args){
  if(sql.startsWith('SELECT payload'))return {rows:[{payload:state}]};
  if(sql.startsWith('UPDATE public.workforce_admin_state'))pending=args[0];
  if(sql==='COMMIT'){if(failCommit)throw Error('Commit failed');state=pending;}
  return {rows:[]};
 },release(){}};}};
 async function request(route,{method='GET',body,cookie,scope='admin',origin}={}){
  const req=Readable.from(body?[JSON.stringify(body)]:[]);req.method=method;req.url='/api/workspace/'+route;req.headers={host:'admin.example.test','x-workspace-role':scope,...(cookie?{cookie}:{}),...(origin?{origin}:{})};
  let status,headers,data;const res={writeHead(code,values){status=code;headers=values;},end(value){data=value;}};
  await serveCloudWorkspace(req,res,{pool,secret,env:{},liveSync:undefined,publish:false});
  return {status,headers,data:data?JSON.parse(data):null};
 }
 return {request,failCommit(){failCommit=true;}};
}
test('cloud state is encrypted and rejects tampering or a different key',()=>{
 const encrypted=encryptWorkspace({database:'private workforce data'},secret);
 assert.ok(!encrypted.includes(Buffer.from('private workforce data')));
 assert.deepEqual(decryptWorkspace(encrypted,secret),{database:'private workforce data'});
 assert.throws(()=>decryptWorkspace(encrypted,'b'.repeat(96)));
 encrypted[encrypted.length-1]^=1;assert.throws(()=>decryptWorkspace(encrypted,secret));
});
test('hosted admin persists login and job changes across fresh request runtimes and blocks public previews',async t=>{
 const f=fixture(t);
 assert.equal((await f.request('data')).status,401);
 for(const route of ['register','preview'])assert.equal((await f.request(route,{method:'POST',body:{role:'admin'}})).status,403);
 assert.equal((await f.request('data',{scope:'employer'})).status,403);
 assert.equal((await f.request('login',{method:'POST',origin:'https://evil.test',body:{}})).status,403);
 const login=await f.request('login',{method:'POST',body:{email:'cloud@example.test',password:'CloudTestPassword123'}});
 assert.equal(login.status,200);assert.match(login.headers['Set-Cookie'],/; Secure$/);
 const cookie=login.headers['Set-Cookie'].split(';')[0];
 const job=await f.request('jobs',{method:'POST',cookie,body:{title:'Cloud job',quantity:'2',location:'Melbourne',aboutRole:'A paragraph.',keyResponsibilities:'One task.\nAnother task.'}});
 assert.equal(job.status,201);
 const snapshot=await f.request('data',{cookie});assert.equal(snapshot.status,200);
 assert.equal(snapshot.data.jobs[0].aboutRole,'A paragraph.');assert.equal(snapshot.data.jobs[0].keyResponsibilities,'One task.\nAnother task.');
 await f.request('logout',{method:'POST',cookie});assert.equal((await f.request('data',{cookie})).status,401);
});
test('a failed durable commit returns failure without issuing an authenticated cookie',async t=>{
 const f=fixture(t);f.failCommit();
 const login=await f.request('login',{method:'POST',body:{email:'cloud@example.test',password:'CloudTestPassword123'}});
 assert.equal(login.status,503);assert.equal(login.headers['Set-Cookie'],undefined);
});
