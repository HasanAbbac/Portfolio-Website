// Pure helpers for the contact form: input cleaning, validation and message building.
// Kept free of Express and SMTP code so they can be unit tested on their own.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// eslint-disable-next-line no-control-regex
export const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
export const noNewlines = (v) => v.replace(/[\r\n]+/g, ' ');
export const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Fastest a person can plausibly go from first touching the form to pressing Send.
export const MIN_FILL_MS = 1500;

export const LIMITS = { name: 80, email: 120, subject: 120, message: 3000 };

export function validate(body) {
  // every field must really be text: objects, arrays and numbers are rejected instead of being turned into "[object Object]"
  const text = (k) => (typeof body[k] === 'string' ? body[k] : '');
  const wrongType = (k) => body[k] !== undefined && body[k] !== null && typeof body[k] !== 'string';
  const data = {
    name: noNewlines(clean(text('name'), LIMITS.name)),
    email: noNewlines(clean(text('email'), LIMITS.email)),
    subject: noNewlines(clean(text('subject'), LIMITS.subject)),
    message: clean(text('message'), LIMITS.message),
  };
  const errors = {};
  if (wrongType('name') || data.name.length < 2) errors.name = 'Enter your name.';
  if (wrongType('email') || !EMAIL_RE.test(data.email) || text('email').trim().length > LIMITS.email) errors.email = 'Enter a valid email address.';
  if (wrongType('subject') || data.subject.length < 3) errors.subject = 'Add a short subject.';
  if (wrongType('message') || data.message.length < 10) errors.message = 'Write at least 10 characters.';
  // too long is an error the visitor can fix, not a silent cut that loses the end of their message
  if (text('message').trim().length > LIMITS.message) errors.message = `Keep the message under ${LIMITS.message} characters.`;
  if (text('subject').trim().length > LIMITS.subject) errors.subject = `Keep the subject under ${LIMITS.subject} characters.`;
  if (text('name').trim().length > LIMITS.name) errors.name = `Keep the name under ${LIMITS.name} characters.`;
  return { data, errors };
}

// True when the form was filled in too quickly to be a person. A missing or invalid `elapsed` counts as too fast.
export function isTooFast(body) {
  const ms = Number(body && body.elapsed);
  return !(Number.isFinite(ms) && ms >= MIN_FILL_MS);
}

export function buildMail(data, { from, to }) {
  const text = `New message from your portfolio\n\nName: ${data.name}\nEmail: ${data.email}\nSubject: ${data.subject}\n\n${data.message}\n`;
  const html = `<h2 style="font-family:sans-serif">New message from your portfolio</h2>
<p style="font-family:sans-serif"><b>Name:</b> ${escapeHtml(data.name)}<br><b>Email:</b> ${escapeHtml(data.email)}<br><b>Subject:</b> ${escapeHtml(data.subject)}</p>
<p style="font-family:sans-serif;white-space:pre-wrap">${escapeHtml(data.message)}</p>`;
  return {
    from: `"Portfolio contact" <${from}>`,
    to,
    // the visitor's address is validated, and the display name is stripped of characters that could alter the header
    replyTo: { name: data.name.replace(/["<>\\;,]/g, ''), address: data.email },
    subject: `[Portfolio] ${data.subject}`,
    text,
    html,
  };
}
