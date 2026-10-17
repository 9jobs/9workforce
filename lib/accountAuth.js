import {betterAuth} from 'better-auth';
import {APIError,createAuthMiddleware} from 'better-auth/api';
import {getMigrations} from 'better-auth/db/migration';
import {fromNodeHeaders,toNodeHandler} from 'better-auth/node';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import path from 'node:path';
import {createAccountNotifications} from './accountNotifications.js';
import {safeAccountNext} from './accountNext.js';
import {accountDeployment} from './accountDeployment.js';
import {accountDatabase} from './accountDatabase.js';

export async function createAccountAuth(root,env,services={}){
  env={...env,...process.env};
  const deployment=accountDeployment(env);
  const directory=path.join(root,'data');
  const secretPath=path.join(directory,'auth-secret');
  let secret=env.BETTER_AUTH_SECRET;
  if(!secret){
    mkdirSync(directory,{recursive:true});
    try{secret=readFileSync(secretPath,'utf8').trim();}
    catch{secret=randomBytes(48).toString('hex');writeFileSync(secretPath,secret,{mode:0o600});}
  }
  const clientId=env.GOOGLE_CLIENT_ID;
  const clientSecret=env.GOOGLE_CLIENT_SECRET;
  const googleEnabled=Boolean(clientId&&clientSecret);
  const localHosts=Array.from({length:21},(_,i)=>[`localhost:${3000+i}`,`127.0.0.1:${3000+i}`]).flat();
  const storage=services.storage||await accountDatabase(root,env,{migrate:services.migrate});
  const notifications=!services.skipNotifications&&env.SMTP_USER&&env.SMTP_PASS?createAccountNotifications(storage.notifications,env,{backgroundTask:services.backgroundTask,serverless:deployment.hosted,initialize:!deployment.hosted||services.migrate}):null;
  const options={
    appName:'9Work Force',
    secret,
    database:storage.database,
    hooks:{before:createAuthMiddleware(async ctx=>{
      if(ctx.path!=='/sign-up/email'||typeof ctx.body?.email!=='string')return;
      const email=ctx.body.email.trim().toLowerCase();
      // With autoSignIn:false, Better Auth otherwise returns a synthetic success
      // for duplicates, even though the submitted password was never saved.
      const existing=await ctx.context.internalAdapter.findUserByEmail(email);
      if(existing?.user)throw new APIError('CONFLICT',{
        code:'ACCOUNT_ALREADY_REGISTERED',
        message:'This email is already registered. Sign in or use the secure password link.',
      });
    })},
    databaseHooks:{user:{create:{after:async user=>{await notifications?.enqueue(user);}}}},
    baseURL:deployment.hosted?deployment.baseURL:{allowedHosts:localHosts,protocol:'http'},
    trustedOrigins:deployment.hosted?deployment.trustedOrigins:localHosts.map(host=>`http://${host}`),
    ...(deployment.hosted?{advanced:{useSecureCookies:true,ipAddress:{ipAddressHeaders:['x-vercel-forwarded-for']} }}:{}),
    emailAndPassword:{enabled:true,minPasswordLength:8,maxPasswordLength:128,autoSignIn:false,
      resetPasswordTokenExpiresIn:1800,revokeSessionsOnPasswordReset:true,
      ...((services.sendResetPassword||notifications)?{sendResetPassword:services.sendResetPassword||notifications.sendResetPassword}:{}),
    },
    socialProviders:googleEnabled?{google:{clientId,clientSecret}}:{},
    account:{accountLinking:{enabled:false}},
    rateLimit:{enabled:true,window:60,max:30,...(deployment.hosted?{storage:'database'}:{})},
  };
  if(!deployment.hosted||services.migrate){
    const migrations=await getMigrations(options);
    await migrations.runMigrations();
  }
  const auth=betterAuth(options);
  await auth.$context;
  if(notifications&&!deployment.hosted)void notifications.processPending().catch(()=>console.error('Pending registration delivery could not be resumed.'));
  async function startGoogle(req,res){
    res.setHeader('Cache-Control','no-store');
    const back=error=>{res.writeHead(302,{Location:`/register?error=${error}`});res.end();};
    if(!googleEnabled)return back('google_not_configured');
    if(req.headers['sec-fetch-site']==='cross-site')return back('google_start');
    if(deployment.hosted){
      const host=String(req.headers.host||'').toLowerCase();
      if(host!==new URL(deployment.baseURL).host){
        const next=safeAccountNext(new URL(req.url,'http://localhost').searchParams.get('next'));
        res.writeHead(302,{Location:`${deployment.baseURL}/api/account/google${next?`?next=${encodeURIComponent(next)}`:''}`});res.end();return;
      }
    }
    try{
      const next=safeAccountNext(new URL(req.url,'http://localhost').searchParams.get('next'));
      const callbackURL=next?`/register?next=${encodeURIComponent(next)}`:'/register';
      const response=await auth.api.signInSocial({
        headers:fromNodeHeaders(req.headers),asResponse:true,
        body:{provider:'google',callbackURL,errorCallbackURL:`/register?error=google${next?`&next=${encodeURIComponent(next)}`:''}`,disableRedirect:true},
      });
      const result=await response.json();
      if(!response.ok||!result.url)return back('google_start');
      const destination=new URL(result.url);
      if(destination.origin!=='https://accounts.google.com')return back('google_start');
      const cookies=response.headers.getSetCookie();
      if(cookies.length)res.setHeader('Set-Cookie',cookies);
      res.writeHead(302,{Location:destination.href});res.end();
    }catch{
      console.error('Google sign-in could not be started.');
      return back('google_start');
    }
  }
  return {handler:toNodeHandler(auth),googleEnabled,startGoogle,getSession:req=>auth.api.getSession({headers:fromNodeHeaders(req.headers)}),processPending:()=>notifications?.processPending(),close:async()=>{await notifications?.ready;notifications?.close();await storage.close();}};
}
