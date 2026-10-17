import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {accountDeployment} from '../lib/accountDeployment.js';
import {createAccountAuth} from '../lib/accountAuth.js';

const env={VERCEL:'1',BETTER_AUTH_URL:'https://9workforce.com.au',DATABASE_URL:'postgresql://fixture:fixture@localhost/fixture',BETTER_AUTH_SECRET:'production-test-secret-at-least-thirty-two-chars',GOOGLE_CLIENT_ID:'fixture.apps.googleusercontent.com',GOOGLE_CLIENT_SECRET:'fixture-only'};

test('production refuses ephemeral accounts, missing secrets and unsafe origins',()=>{
  assert.throws(()=>accountDeployment({VERCEL:'1'}),/DATABASE_URL/);
  assert.throws(()=>accountDeployment({...env,BETTER_AUTH_SECRET:''}),/BETTER_AUTH_SECRET/);
  assert.throws(()=>accountDeployment({...env,BETTER_AUTH_URL:'http://localhost:3001'}),/HTTPS/);
  assert.throws(()=>accountDeployment({...env,BETTER_AUTH_TRUSTED_ORIGINS:'https://*.vercel.app'}),/explicit|origins/);
  assert.equal(accountDeployment(env).baseURL,'https://9workforce.com.au');
  assert.deepEqual(accountDeployment({}).hosted,false);
});

test('production OAuth uses the canonical HTTPS callback, secure cookies and rejects a foreign origin',async()=>{
  const database=new DatabaseSync(':memory:');
  const auth=await createAccountAuth('.',env,{migrate:true,skipNotifications:true,storage:{database,notifications:database,close:()=>database.close()}});
  const server=http.createServer((req,res)=>req.url.startsWith('/api/account/google')?auth.startGoogle(req,res):auth.handler(req,res));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const alias=await fetch(`${base}/api/account/google?next=${encodeURIComponent('/request-workers')}`,{redirect:'manual'});
    assert.equal(new URL(alias.headers.get('location')).origin,'https://9workforce.com.au');
    assert.equal(alias.headers.get('set-cookie'),null);
    const response=await new Promise((resolve,reject)=>{
      http.get(`${base}/api/account/google?next=${encodeURIComponent('/request-workers')}`,{headers:{Host:'9workforce.com.au'}},res=>{
        const headers=new Headers();for(const [key,value]of Object.entries(res.headers))for(const item of Array.isArray(value)?value:[value])if(item!==undefined)headers.append(key,item);
        res.resume();res.on('end',()=>resolve({status:res.statusCode,headers}));
      }).on('error',reject);
    });
    assert.equal(response.status,302);
    const url=new URL(response.headers.get('location'));
    assert.equal(url.origin,'https://accounts.google.com');
    assert.equal(url.searchParams.get('redirect_uri'),'https://9workforce.com.au/api/auth/callback/google');
    assert.equal(url.searchParams.get('code_challenge_method'),'S256');
    assert.ok(url.searchParams.get('state'));
    assert.match(response.headers.get('set-cookie'),/Secure/);
    assert.match(response.headers.get('set-cookie'),/HttpOnly/);
    const foreign=await fetch(`${base}/api/auth/sign-in/social`,{method:'POST',headers:{Origin:'https://attacker.example',Cookie:'fixture=value','Content-Type':'application/json'},body:JSON.stringify({provider:'google',callbackURL:'/register'})});
    assert.equal(foreign.status,403);
    const crossSite=await fetch(`${base}/api/account/google`,{headers:{'sec-fetch-site':'cross-site'},redirect:'manual'});
    assert.equal(crossSite.headers.get('location'),'/register?error=google_start');
  }finally{await new Promise(resolve=>server.close(resolve));await auth.close();}
});
