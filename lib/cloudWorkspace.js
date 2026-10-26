import {createCipheriv,createDecipheriv,randomBytes,hkdfSync} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {workspaceApi} from '../local-admin/api.mjs';
import {createLiveSync} from '../local-admin/live-submissions.mjs';
import {createLiveJobPublisher} from '../local-admin/live-job-posts.mjs';

// Retain the existing transactional workspace engine. PostgreSQL is the durable
// source; each request holds its row lock until its encrypted state is committed.
// This deliberately serializes staff operations and suits a small admin team.
export const cloudWorkspaceSchema=`CREATE TABLE IF NOT EXISTS public.workforce_admin_state (
 id TEXT PRIMARY KEY CHECK(id='workspace'), payload BYTEA NOT NULL, revision BIGINT NOT NULL DEFAULT 1,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
 ALTER TABLE public.workforce_admin_state ENABLE ROW LEVEL SECURITY;
 REVOKE ALL ON public.workforce_admin_state FROM anon, authenticated;`;

function key(secret){if(!secret||secret.length<40)throw Error('Workspace encryption is not configured.');return hkdfSync('sha256',secret,'9workforce','cloud-workspace-v1',32);}
export function encryptWorkspace(state,secret){
 const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(secret),nonce);
 const data=Buffer.concat([cipher.update(gzipSync(Buffer.from(JSON.stringify(state)))),cipher.final()]);
 return Buffer.concat([Buffer.from([1]),nonce,cipher.getAuthTag(),data]);
}
export function decryptWorkspace(bytes,secret){
 if(bytes[0]!==1)throw Error('Unknown workspace state version.');
 const cipher=createDecipheriv('aes-256-gcm',key(secret),bytes.subarray(1,13));cipher.setAuthTag(bytes.subarray(13,29));
 return JSON.parse(gunzipSync(Buffer.concat([cipher.update(bytes.subarray(29)),cipher.final()])).toString());
}
export function readWorkspaceState(directory){return {database:readFileSync(path.join(directory,'workspace.sqlite')).toString('base64'),settingsKey:readFileSync(path.join(directory,'settings-key')).toString('base64')};}

export async function serveCloudWorkspace(req,res,{pool,secret,env=process.env,liveSync=createLiveSync({env}),publish=true}={}){
 // Check Origin before even opening the state, including login and logout.
 const origin=req.headers.origin;
 if(origin&&new URL(origin).host!==req.headers.host){res.writeHead(403,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Cross-origin access is not allowed.'}));}
 const client=await pool.connect();let directory,handler,transaction=false;
 try{
  await client.query('BEGIN');transaction=true;
  await client.query("SET LOCAL lock_timeout='15s'");
  const result=await client.query("SELECT payload FROM public.workforce_admin_state WHERE id='workspace' FOR UPDATE");
  if(!result.rows.length)throw Error('Hosted admin has not been provisioned.');
  const state=decryptWorkspace(result.rows[0].payload,secret);
  directory=mkdtempSync(path.join(tmpdir(),'workforce-admin-'));
  writeFileSync(path.join(directory,'workspace.sqlite'),Buffer.from(state.database,'base64'),{mode:0o600});
  writeFileSync(path.join(directory,'settings-key'),Buffer.from(state.settingsKey,'base64'),{mode:0o600});
  const publisher=publish?createLiveJobPublisher({database:client}):undefined;
  handler=workspaceApi(directory,{hosted:true,websiteUrl:'https://9workforce.com.au',liveSync,jobPublisher:publisher,settingsMail:{env}});
  // Buffer responses: a failed durable save must never return a success or cookie.
  let status=200,body;const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
  const response={setHeader(name,value){headers[name]=name.toLowerCase()==='set-cookie'?String(value)+'; Secure':value;},writeHead(code,extra={}){status=code;Object.assign(headers,extra);},end(value){body=value;}};
  if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);req[Symbol.asyncIterator]=async function*(){yield Buffer.from(raw);};}
  await handler(req,response,()=>{status=404;body=JSON.stringify({error:'Unknown workspace route.'});});
  handler.close();handler.store.db.exec('PRAGMA wal_checkpoint(TRUNCATE)');handler.store.db.close();handler=null;
  const payload=encryptWorkspace(readWorkspaceState(directory),secret);
  await client.query("UPDATE public.workforce_admin_state SET payload=$1,revision=revision+1,updated_at=now() WHERE id='workspace'",[payload]);
  await client.query('COMMIT');transaction=false;
  res.writeHead(status,headers);res.end(body);
 }catch(error){
  if(transaction)await client.query('ROLLBACK').catch(()=>{});
  console.error('Hosted workspace request failed:',error.code||error.name);
  res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Admin workspace is temporarily unavailable. Please retry.'}));
 }finally{
  if(handler){handler.close();handler.store.db.close();}
  if(directory)rmSync(directory,{recursive:true,force:true});
  client.release();
 }
}
