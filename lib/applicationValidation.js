export function isAustralianPhone(value) {
  const phone = String(value || '').trim();
  if (!/^[+\d\s()-]+$/.test(phone)) return false;
  return /^(?:0|\+61|0061)[23478]\d{8}$/.test(phone.replace(/[\s()-]/g, ''));
}

export function isValidEmail(value) {
  const email = String(value || '').trim();
  if (email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return local.length > 0 && local.length <= 64 &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) &&
    !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') &&
    domain.split('.').length >= 2 &&
    domain.split('.').every(label => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label)) &&
    /^[A-Za-z]{2,63}$/.test(domain.split('.').at(-1));
}

export function validateRoleApplication(fields) {
  if (!String(fields.fullName || '').trim() || !fields.phone || !fields.email) return 'Please fill in your full name, phone number and email address.';
  if (!isValidEmail(fields.email)) return 'Please enter a valid email address, e.g. name@example.com.';
  if (!isAustralianPhone(fields.phone)) return 'Please enter a valid Australian mobile or landline number, e.g. 0412 345 678 or +61 412 345 678.';
  if (!fields.resumeData) return 'Please upload your resume / CV.';
  return '';
}
