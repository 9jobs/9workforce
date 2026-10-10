import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import tls from 'node:tls';
import handler from '../api/submissions.js';
import {isAustralianPhone, isValidEmail} from '../lib/applicationValidation.js';

const resume = Buffer.from('%PDF-1.4\nResume fixture\n%%EOF');
const coverLetter = Buffer.from('Cover letter fixture with a different attachment payload.');
const application = () => ({applicationForm:'roleApplication', fullName:'Attachment Test', phone:'+61 412 345 678', email:'candidate@example.com.au', location:'Melbourne, VIC', availability:'After 2 weeks', resumeName:'test-resume.pdf', resumeData:`data:application/pdf;base64,${resume.toString('base64')}`, coverLetterName:'test-cover-letter.txt', coverLetterData:`data:text/plain;base64,${coverLetter.toString('base64')}`});

test('Australian contact validation accepts formatted mobile/landline numbers and normal email domains', () => {
  for (const phone of ['0412 345 678', '+61 412 345 678', '0061 412 345 678', '(03) 9123 4567', '+61 3 9123 4567']) assert.equal(isAustralianPhone(phone), true, phone);
  for (const phone of ['12345', '041234567', '+91 9876543210', '+610412345678', '0412345678abc']) assert.equal(isAustralianPhone(phone), false, phone);
  for (const email of ['name@example.com', 'name+work@example.com.au']) assert.equal(isValidEmail(email), true, email);
  for (const email of ['name@example', 'name..test@example.com', 'name@-example.com', 'name@example..com']) assert.equal(isValidEmail(email), false, email);
});

test('role API saves files, sends both MIME attachments intact, then marks email sent', async () => {
  const originalFetch = globalThis.fetch;
  const originalConnect = tls.connect;
  const envKeys = ['SMTP_PASS', 'SMTP_USER', 'MAIL_TO', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  Object.assign(process.env, {SMTP_PASS:'test-only', SMTP_USER:'sender@example.com', MAIL_TO:'recipient@example.com', SUPABASE_URL:'https://mock-database.invalid', SUPABASE_SERVICE_ROLE_KEY:'test-only'});
  const operations = [];
  let message;
  globalThis.fetch = async (_url, options) => {
    operations.push(options.method);
    const body = JSON.parse(options.body);
    if (options.method === 'POST') { assert.equal(body.fields.resumeData, application().resumeData); if (body.fields.coverLetterData) assert.equal(body.fields.coverLetterData, application().coverLetterData); }
    if (options.method === 'PATCH') assert.equal(body.email_sent, true);
    return {ok:true, json:async () => [], text:async () => ''};
  };
  tls.connect = () => {
    const socket = new EventEmitter();
    const codes = [250, 334, 334, 235, 250, 250, 354, 250, 221];
    socket.write = command => {
      if (command.includes('MIME-Version:')) { message = command; operations.push('SMTP'); }
      queueMicrotask(() => socket.emit('data', Buffer.from(`${codes.shift()} OK\r\n`)));
    };
    socket.end = () => {};
    queueMicrotask(() => socket.emit('data', Buffer.from('220 Ready\r\n')));
    return socket;
  };
  const call = async fields => {
    let status, body;
    const response = {status(value) { status = value; return this; }, setHeader() {}, json(value) { body = value; return this; }};
    await handler({method:'POST', body:{type:'contact', fields}}, response);
    return {status, body};
  };
  try {
    for (const [patch, expected] of [[{phone:'12345'}, 'Australian'], [{email:'bad@email'}, 'email'], [{resumeData:''}, 'resume'], [{resumeData:'invalid-file'}, 'document']]) {
      const result = await call({...application(), ...patch});
      assert.equal(result.status, 400);
      assert.match(result.body.error, new RegExp(expected, 'i'));
    }
    const oversized = Buffer.alloc(3 * 1024 * 1024 + 1).toString('base64');
    assert.equal((await call({...application(), resumeData:`data:application/pdf;base64,${oversized}`})).status, 400);
    assert.deepEqual(operations, [], 'invalid submissions must not save or send');
    const result = await call(application());
    assert.equal(result.status, 200);
    assert.equal(result.body.ok, true);
    assert.deepEqual(operations, ['POST', 'SMTP', 'PATCH']);
    assert.match(message, /Content-Type: multipart\/mixed/);
    assert.doesNotMatch(message, /Submission ID:/);
    for (const [filename, bytes] of [['test-resume.pdf', resume], ['test-cover-letter.txt', coverLetter]]) {
      const attachment = message.match(new RegExp(`filename="${filename.replaceAll('.', '\\.')}"\\r\\n\\r\\n([A-Za-z0-9+/=\\r\\n]+?)\\r\\n--`));
      assert.ok(attachment, filename);
      assert.deepEqual(Buffer.from(attachment[1].replace(/\s/g, ''), 'base64'), bytes);
    }
    operations.length = 0;
    const noCover = application(); delete noCover.coverLetterData; delete noCover.coverLetterName;
    assert.equal((await call(noCover)).status, 200);
    assert.match(message, /test-resume.pdf/);
    assert.doesNotMatch(message, /test-cover-letter.txt/);
  } finally {
    globalThis.fetch = originalFetch; tls.connect = originalConnect;
    for (const [key, value] of Object.entries(originalEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});
