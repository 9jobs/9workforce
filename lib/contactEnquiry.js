export function validateContactEnquiry(fields) {
  if (!fields.fullName || !fields.email || !fields.phone || !fields.message) return 'Please fill in your name, email, phone number and message.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return 'Please enter a valid email address.';
  return '';
}

export function formatContactEnquiry(fields) {
  return `Contact form filled by: ${fields.fullName}\n\nName: ${fields.fullName}\nEmail: ${fields.email}\nPhone: ${fields.phone}\nMessage:\n${fields.message}`;
}
