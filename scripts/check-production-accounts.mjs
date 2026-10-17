import http from 'node:http';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createAccountAuth} from '../lib/accountAuth.js';

try{process.loadEnvFile('.env.production.local');}catch{}
try{process.loadEnvFile('.env');}catch{}
process.env.NODE_ENV='production';
const canonical=new URL(process.env.BETTER_AUTH_URL);
let auth,server,userId;
const email=`production-smoke-${Date.now()}@example.com`;
async function request(path,{method='GET',body,cookie}={}){
  return new Promise((resolve,reject)=>{
    const data=body?JSON.stringify(body):undefined;
    const req=http.request({hostname:'127.0.0.1',port:server.address().port,path,method,headers:{Host:canonical.host,'x-forwarded-proto':'https','x-vercel-forwarded-for':'192.0.2.10',Origin:canonical.origin,...(data?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}:{}),...(cookie?{Cookie:cookie}:{})}},res=>{
      let text='';res.on('data',chunk=>text+=chunk);res.on('end',()=>{let json;try{json=JSON.parse(text);}catch{}resolve({status:res.statusCode,headers:res.headers,json});});
    });req.on('error',reject);req.end(data);
  });
}
try{
  auth=await createAccountAuth(process.cwd(),process.env,{skipNotifications:true});
  server=http.createServer((req,res)=>auth.handler(req,res));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const password=randomBytes(24).toString('hex');
  const signup=await request('/api/auth/sign-up/email',{method:'POST',body:{name:'Production Auth Smoke Test',email,password}});
  assert.equal(signup.status,200,'Production registration failed');userId=signup.json.user.id;
  const login=await request('/api/auth/sign-in/email',{method:'POST',body:{email,password}});
  assert.equal(login.status,200,'Production email sign-in failed');
  const cookies=login.headers['set-cookie']||[];
  assert.ok(cookies.some(cookie=>cookie.includes('Secure')&&cookie.includes('HttpOnly')),'Secure session cookie missing');
  const cookie=cookies.map(value=>value.split(';')[0]).join('; ');
  const session=await request('/api/auth/get-session',{cookie});
  assert.equal(session.json.user.id,userId);
  await auth.close();
  auth=await createAccountAuth(process.cwd(),process.env,{skipNotifications:true});
  const resumed=await request('/api/auth/get-session',{cookie});
  assert.equal(resumed.json.user.id,userId,'Session did not survive a new database pool/auth instance');
  const google=await request('/api/auth/sign-in/social',{method:'POST',body:{provider:'google',callbackURL:'/register',disableRedirect:true}});
  assert.equal(google.status,200);
  assert.equal(new URL(google.json.url).searchParams.get('redirect_uri'),`${canonical.origin}/api/auth/callback/google`);
  await request('/api/auth/sign-out',{method:'POST',body:{},cookie});
  assert.equal((await request('/api/auth/get-session',{cookie})).json,null);
  console.log('Production PostgreSQL: registration, sign-in, secure cookies, session persistence, Google callback and sign-out passed. No emails sent.');
}finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  if(auth)await auth.close();
  if(userId){
    const {Pool}=await import('pg');const {readFileSync}=await import('node:fs');
    const connection=new URL(process.env.DATABASE_URL);connection.searchParams.delete('sslmode');
    const pool=new Pool({connectionString:connection.href,ssl:{ca:readFileSync(new URL('../lib/certs/supabase-prod-ca.crt',import.meta.url),'utf8'),rejectUnauthorized:true}});
    try{
      await pool.query('DELETE FROM workforce_auth.session WHERE "userId"=$1',[userId]);
      await pool.query('DELETE FROM workforce_auth.account WHERE "userId"=$1',[userId]);
      await pool.query('DELETE FROM workforce_auth."user" WHERE id=$1 AND email=$2',[userId,email]);
      console.log('Temporary smoke-test account removed.');
    }finally{await pool.end();}
  }
}
