import tls from 'node:tls';
import {randomUUID} from 'node:crypto';

const clean = (value, max = 4000) => String(value ?? '').trim().slice(0, max);
const formatSubmission = data => Object.entries(data).filter(([key]) => !['resumeData', 'coverLetterData'].includes(key)).map(([key, value]) => `${key}: ${clean(value)}`).join('\n');

function sendJson(res, status, body) {
  res.status(status);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  return res.json(body);
}

function smtpCommand(socket, command, expected) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    const onData = chunk => {
      buffer += chunk.toString();
      const lines = buffer.split('\r\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!/^\d{3} /.test(line)) continue;
        socket.off('data', onData);
        const code = Number(line.slice(0, 3));
        if (!expected.includes(code)) reject(new Error(`SMTP ${code}: ${line.slice(4)}`));
        else resolve();
        return;
      }
    };
    socket.on('data', onData);
    socket.once('error', reject);
    if (command) socket.write(`${command}\r\n`);
  });
}

async function sendEmail(subject, text) {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER || 'support@9workforce.com.au';
  const pass = process.env.SMTP_PASS;
  const to = process.env.MAIL_TO || 'support@9workforce.com.au';
  if (!pass) throw new Error('SMTP_PASS is not configured');

  const socket = tls.connect({host, port, servername: host});
  try {
    await smtpCommand(socket, null, [220]);
    await smtpCommand(socket, 'EHLO localhost', [250]);
    await smtpCommand(socket, 'AUTH LOGIN', [334]);
    await smtpCommand(socket, Buffer.from(user).toString('base64'), [334]);
    await smtpCommand(socket, Buffer.from(pass).toString('base64'), [235]);
    await smtpCommand(socket, `MAIL FROM:<${user}>`, [250]);
    await smtpCommand(socket, `RCPT TO:<${to}>`, [250, 251]);
    await smtpCommand(socket, 'DATA', [354]);
    const message = [
      `From: 9Work Force <${user}>`,
      `To: ${to}`,
      `Subject: ${subject.replace(/[\r\n]/g, ' ')}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      text.replace(/^\./gm, '..'),
      ''
    ].join('\r\n');
    await smtpCommand(socket, `${message}\r\n.`, [250]);
    await smtpCommand(socket, 'QUIT', [221]);
  } finally {
    socket.end();
  }
}

async function saveSubmission(submission) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase credentials are not configured');
  const response = await fetch(`${url}/rest/v1/workforce_form_submissions`, {
    method: 'POST',
    headers: {apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation'},
    body: JSON.stringify({id: submission.id, form_type: submission.type, fields: submission.fields, email_sent: false})
  });
  if (!response.ok) throw new Error(`Supabase insert failed: ${await response.text()}`);
  return response.json();
}

async function markEmailSent(id) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${url}/rest/v1/workforce_form_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal'},
    body: JSON.stringify({email_sent: true, email_sent_at: new Date().toISOString()})
  });
  if (!response.ok) throw new Error(`Supabase update failed: ${await response.text()}`);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'POST') return sendJson(res, 404, {error: 'Not found'});
  try {
    const input = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const type = input.type === 'employer' ? 'employer' : 'contact';
    const fields = Object.fromEntries(Object.entries(input.fields || {}).map(([key, value]) => [key, clean(value, ['resumeData', 'coverLetterData'].includes(key) ? 4200000 : 4000)]));
    if (!fields.email && type === 'contact') return sendJson(res, 400, {error: 'Email is required'});
    if (fields.applicationForm === 'roleApplication') {
      if (!fields.fullName || !fields.phone || !fields.email) return sendJson(res, 400, {error: 'Please fill in your full name, phone number and email address.'});
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return sendJson(res, 400, {error: 'Please enter a valid email address.'});
      if (!fields.resumeData) return sendJson(res, 400, {error: 'Please upload your resume / CV.'});
    }
    const submission = {id: randomUUID(), type, receivedAt: new Date().toISOString(), fields};
    await saveSubmission(submission);
    const subject = type === 'employer' ? 'New 9Work Force application' : 'New 9Work Force enquiry';
    await sendEmail(subject, `A new ${type} submission was received.\n\n${formatSubmission(fields)}\n\nSubmission ID: ${submission.id}`);
    await markEmailSent(submission.id);
    return sendJson(res, 200, {ok: true, message: 'Thanks — your details have been sent.'});
  } catch (error) {
    console.error(error.message);
    return sendJson(res, 500, {error: 'Unable to send the form right now. Please try again.'});
  }
}
