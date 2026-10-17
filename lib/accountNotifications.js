import nodemailer from 'nodemailer';
import {randomUUID} from 'node:crypto';

export function createAccountNotifications(database,env,services={}){
  const ready=services.initialize===false?Promise.resolve():Promise.resolve(database.exec(`CREATE TABLE IF NOT EXISTS registration_delivery (
    user_id TEXT PRIMARY KEY, submission_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL, email TEXT NOT NULL, registered_at TEXT NOT NULL,
    mirror_saved INTEGER NOT NULL DEFAULT 0, admin_sent INTEGER NOT NULL DEFAULT 0,
    welcome_sent INTEGER NOT NULL DEFAULT 0, completed INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0, next_attempt INTEGER NOT NULL DEFAULT 0,
    last_error TEXT, admin_message_id TEXT, welcome_message_id TEXT
  )`));
  const inbox=env.MAIL_TO||env.SMTP_USER;
  const transport=services.transport||nodemailer.createTransport({
    host:env.SMTP_HOST||'smtp.gmail.com',port:Number(env.SMTP_PORT||465),
    secure:env.SMTP_SECURE==='true'||Number(env.SMTP_PORT||465)===465,
    auth:{user:env.SMTP_USER,pass:env.SMTP_PASS},
    connectionTimeout:15000,greetingTimeout:15000,socketTimeout:20000,
  });
  const from={name:'9Work Force',address:env.SMTP_USER};
  let running=false;
  async function mirror(job,complete=false){
    if(!env.SUPABASE_URL||!env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Database credentials missing');
    const response=await (services.fetch||fetch)(`${env.SUPABASE_URL}/rest/v1/workforce_form_submissions?on_conflict=id`,{
      method:'POST',signal:AbortSignal.timeout(15000),
      headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
      body:JSON.stringify({id:job.submission_id,form_type:'contact',fields:{applicationForm:'accountRegistration',userId:job.user_id,fullName:job.name,email:job.email,registeredAt:job.registered_at,adminEmailSent:Boolean(job.admin_sent),confirmationEmailSent:Boolean(job.welcome_sent)},email_sent:Boolean(job.admin_sent),email_sent_at:complete?new Date().toISOString():null}),
    });
    if(!response.ok)throw new Error(`Database sync returned ${response.status}`);
  }
  async function send(to,subject,text){
    const result=await transport.sendMail({from,to,subject,text});
    if(!result.accepted?.length||result.rejected?.length)throw new Error('Email was rejected by the mail server');
    return result.messageId;
  }
  async function processPending(){
    if(running)return;
    running=true;
    try{
      await ready;
      const jobs=database.claim?await database.claim():await database.prepare('SELECT * FROM registration_delivery WHERE completed=0 AND next_attempt<=? ORDER BY registered_at LIMIT 5').all(Date.now());
      for(const job of jobs){
        const failures=[];
        if(!job.mirror_saved){try{await mirror(job);await database.prepare('UPDATE registration_delivery SET mirror_saved=1 WHERE user_id=?').run(job.user_id);job.mirror_saved=1;}catch(error){failures.push(error.message);}}
        if(!job.admin_sent){try{
          const id=await send(inbox,'New account registration — 9Work Force',`A new user has registered with 9Work Force.\n\nName: ${job.name}\nEmail: ${job.email}\nRegistered at: ${job.registered_at}\nAccount ID: ${job.user_id}\n\nThis is an account registration. The worker application is completed separately.\nRegistration reference: ${job.submission_id}`);
          await database.prepare('UPDATE registration_delivery SET admin_sent=1,admin_message_id=? WHERE user_id=?').run(id,job.user_id);job.admin_sent=1;
        }catch(error){failures.push(`Admin email: ${error.code||'delivery failed'}`);}}
        if(!job.welcome_sent){try{
          const id=await send(job.email,'Your 9Work Force account is ready',`Hi ${job.name},\n\nThanks for creating your 9Work Force account. Your account registration has been saved.\n\nSign in to your account, then choose Register for Work to share your experience, tickets, location and availability so our team can review suitable construction opportunities across Melbourne and Victoria.\n\nIf you need workers for your site, sign in and choose Request Workers instead.\n\nCreating an account does not guarantee a job or placement.\n\nNeed help? Contact support@9workforce.com.au.\n\nThe 9Work Force team\nRegistration reference: ${job.submission_id}`);
          await database.prepare('UPDATE registration_delivery SET welcome_sent=1,welcome_message_id=? WHERE user_id=?').run(id,job.user_id);job.welcome_sent=1;
        }catch(error){failures.push(`Confirmation email: ${error.code||'delivery failed'}`);}}
        if(job.mirror_saved&&job.admin_sent&&job.welcome_sent){
          try{await mirror(job,true);await database.prepare('UPDATE registration_delivery SET completed=1,last_error=NULL,attempts=attempts+1 WHERE user_id=?').run(job.user_id);}
          catch(error){failures.push(error.message);}
        }
        if(failures.length){await database.prepare('UPDATE registration_delivery SET attempts=attempts+1,last_error=?,next_attempt=? WHERE user_id=?').run(failures.join('; '),Date.now()+Math.min(900000,15000*2**Math.min(job.attempts,6)),job.user_id);console.error('Account registration delivery pending:',failures.join('; '));}
      }
    }finally{running=false;}
  }
  async function enqueue(user){
    await ready;
    await database.prepare('INSERT OR IGNORE INTO registration_delivery (user_id,submission_id,name,email,registered_at) VALUES (?,?,?,?,?)').run(user.id,randomUUID(),user.name,user.email,new Date(user.createdAt).toISOString());
    // Keep delivery outside the authentication transaction and response.
    if(services.backgroundTask)services.backgroundTask(processPending());
    else setTimeout(()=>{void processPending().catch(()=>console.error('Account delivery worker failed.'));},0).unref();
  }
  const timer=services.serverless?null:setInterval(()=>{void processPending().catch(()=>console.error('Account delivery worker failed.'));},30000);
  timer?.unref();
  async function sendResetPassword({user,url}){
    await send(user.email,'Set or reset your 9Work Force password',`Hi ${user.name},\n\nUse this secure link to set or reset the password for your 9Work Force account:\n\n${url}\n\nThis link expires in 30 minutes. If you signed up with Google, you can continue using Google sign-in or use this link to add a password.\n\nIf you did not request this, you can ignore this email. Your account will remain unchanged.\n\nThe 9Work Force team`);
  }
  return {ready,enqueue,processPending,sendResetPassword,verifyEmail:()=>transport.verify(),close:()=>{clearInterval(timer);transport.close();}};
}
