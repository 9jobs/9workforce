import http from 'node:http';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import tls from 'node:tls';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {createServer as createViteServer} from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(root, '.env');
const env = loadEnv(envPath);
const port = Number(process.env.PORT || env.PORT || 3000);
const isDev = process.argv.includes('--dev');

function loadEnv(file) {
  try {
    return Object.fromEntries(fsSyncRead(file).split(/\r?\n/).filter(line => line && !line.trim().startsWith('#')).map(line => {
      const index = line.indexOf('=');
      return index === -1 ? [line.trim(), ''] : [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
    }));
  } catch {
    return {};
  }
}

function fsSyncRead(file) {
  return readFileSync(file, 'utf8');
}

function sendJson(res, status, body) {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*'});
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 4500000) req.destroy(new Error('Request too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function clean(value, max = 4000) {
  return String(value ?? '').trim().slice(0, max);
}

function formatSubmission(data) {
  return Object.entries(data).filter(([key]) => key !== 'resumeData').map(([key, value]) => `${key}: ${clean(value)}`).join('\n');
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
  const host = env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(env.SMTP_PORT || 465);
  const user = env.SMTP_USER || 'support@9workforce.com.au';
  const pass = env.SMTP_PASS;
  const to = env.MAIL_TO || 'support@9workforce.com.au';
  if (!pass) throw new Error('SMTP_PASS is not configured');

  const socket = tls.connect({host, port, servername: host});
  try {
    await smtpCommand(socket, null, [220]);
    await smtpCommand(socket, `EHLO localhost`, [250]);
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
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase credentials are not configured');
  const response = await fetch(`${url}/rest/v1/workforce_form_submissions`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify({id: submission.id, form_type: submission.type, fields: submission.fields, email_sent: false})
  });
  if (!response.ok) throw new Error(`Supabase insert failed: ${await response.text()}`);
  return response.json();
}

async function markEmailSent(id) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${url}/rest/v1/workforce_form_submissions?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({email_sent: true, email_sent_at: new Date().toISOString()})
  });
  if (!response.ok) throw new Error(`Supabase update failed: ${await response.text()}`);
}

async function handleApiRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS'});
    return res.end();
  }
  if (req.method !== 'POST' || req.url !== '/api/submissions') return sendJson(res, 404, {error: 'Not found'});
  try {
    const input = JSON.parse(await readBody(req));
    const type = input.type === 'employer' ? 'employer' : 'contact';
    const fields = Object.fromEntries(Object.entries(input.fields || {}).map(([key, value]) => [key, clean(value, key === 'resumeData' ? 4200000 : 4000)]));
    if (!fields.email && type === 'contact') return sendJson(res, 400, {error: 'Email is required'});
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

const vite = isDev ? await createViteServer({server: {middlewareMode: true}}) : null;
const server = http.createServer((req, res) => {
  if (req.url?.startsWith('/api/')) return handleApiRequest(req, res);
  if (vite) return vite.middlewares(req, res, () => sendJson(res, 404, {error: 'Not found'}));
  return sendJson(res, 404, {error: 'Not found'});
});

server.listen(port, () => console.log(`App and Form API listening on http://localhost:${port}`));
