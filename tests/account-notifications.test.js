import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createAccountNotifications} from '../lib/accountNotifications.js';

test('registration persists, mirrors and sends admin/user emails once across retries',async()=>{
  const database=new DatabaseSync(':memory:');
  const mails=[];const records=[];let failDatabase=true;
  const worker=createAccountNotifications(database,{SMTP_USER:'sender@example.com',MAIL_TO:'admin@example.com',SUPABASE_URL:'https://database.example',SUPABASE_SERVICE_ROLE_KEY:'test-only'}, {
    transport:{sendMail:async mail=>{mails.push(mail);return{accepted:[mail.to],rejected:[],messageId:`test-${mails.length}`};},close(){}},
    fetch:async(url,options)=>{records.push(JSON.parse(options.body));return{ok:!failDatabase,status:failDatabase?503:201};},
  });
  try{
    await worker.enqueue({id:'test-user',name:'Test Worker',email:'worker@example.com',createdAt:new Date()});
    await worker.processPending();
    let job=database.prepare('SELECT * FROM registration_delivery').get();
    assert.equal(job.completed,0);assert.equal(job.admin_sent,1);assert.equal(job.welcome_sent,1);
    assert.equal(mails[0].to,'admin@example.com');assert.equal(mails[1].to,'worker@example.com');
    assert.match(job.last_error,/503/);
    failDatabase=false;database.exec('UPDATE registration_delivery SET next_attempt=0');
    await worker.processPending();
    job=database.prepare('SELECT * FROM registration_delivery').get();
    assert.equal(job.completed,1);assert.equal(mails.length,2);
    assert.equal(records.at(-1).fields.applicationForm,'accountRegistration');
    assert.equal(records.at(-1).email_sent,true);
    assert.equal(records.at(-1).fields.confirmationEmailSent,true);
    assert.ok(!JSON.stringify(records).includes('password'));
    await worker.enqueue({id:'test-user',name:'Test Worker',email:'worker@example.com',createdAt:new Date()});
    await worker.processPending();assert.equal(mails.length,2);
  }finally{worker.close();}
});
