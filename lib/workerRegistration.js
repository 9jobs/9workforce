export function registrationAttachments(fields) {
  const attachments = [];
  for (const key of ['resume', 'coverLetter']) {
    if (!fields[`${key}Data`]) continue;
    const match = /^data:([^;,]*);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(fields[`${key}Data`]);
    if (!match) throw new Error('Invalid uploaded document. Please select your file again.');
    attachments.push({name: String(fields[`${key}Name`] || `${key}.pdf`).replace(/[\r\n"\\]/g, '_'), type: match[1] || 'application/octet-stream', data: match[2].replace(/\s/g, '')});
  }
  if (attachments.reduce((total, file) => total + Buffer.from(file.data, 'base64').length, 0) > 3 * 1024 * 1024) throw new Error('Please keep the combined resume and cover letter size within 3 MB.');
  return attachments;
}

export function validateWorkerRegistration(fields) {
  if (!fields.fullName || !fields.phone || !fields.email) return 'Please fill in your full name, phone number and email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return 'Please enter a valid email address.';
  return '';
}

export function registrationEmailBody(text, attachments, boundary) {
  if (!attachments.length) return {contentType: 'text/plain; charset=utf-8', body: text};
  const parts = [`--${boundary}`, 'Content-Type: text/plain; charset=utf-8', '', text];
  for (const file of attachments) parts.push(`--${boundary}`, `Content-Type: ${file.type}`, 'Content-Transfer-Encoding: base64', `Content-Disposition: attachment; filename="${file.name}"`, '', file.data.match(/.{1,76}/g).join('\r\n'));
  parts.push(`--${boundary}--`, '');
  return {contentType: `multipart/mixed; boundary="${boundary}"`, body: parts.join('\r\n')};
}
