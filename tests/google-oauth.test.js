import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdirSync,mkdtempSync} from 'node:fs';
import {createAccountAuth} from '../lib/accountAuth.js';

test('Google OAuth builds the localhost callback with state and PKCE',async()=>{
  mkdirSync('scratch',{recursive:true});
  const auth=await createAccountAuth(mkdtempSync('scratch/google-oauth-'),{
    GOOGLE_CLIENT_ID:'local-test.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET:'local-test-only',
  });
  assert.equal(auth.googleEnabled,true);
  const server=http.createServer((req,res)=>auth.handler(req,res));
  await new Promise(resolve=>server.listen(3020,'127.0.0.1',resolve));
  try{
    const response=await fetch('http://127.0.0.1:3020/api/auth/sign-in/social',{
      method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:3020'},
      body:JSON.stringify({provider:'google',callbackURL:'/register',disableRedirect:true}),
    });
    assert.equal(response.status,200);
    const body=await response.json();
    const url=new URL(body.url);
    assert.equal(url.origin,'https://accounts.google.com');
    assert.equal(url.searchParams.get('redirect_uri'),'http://127.0.0.1:3020/api/auth/callback/google');
    assert.equal(url.searchParams.get('code_challenge_method'),'S256');
    assert.ok(url.searchParams.get('code_challenge'));
    assert.ok(url.searchParams.get('state'));
    assert.match(url.searchParams.get('scope'),/openid/);
    assert.ok(response.headers.get('set-cookie')?.includes('HttpOnly'));
  }finally{
    await new Promise(resolve=>server.close(resolve));
  }
});
