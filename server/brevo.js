// Sends the contact-form email through Brevo's transactional email API (free plan, no domain needed):
//   POST https://api.brevo.com/v3/smtp/email   with the header  api-key: <BREVO_API_KEY>
// The sender must be an address you have verified in Brevo (your Gmail). The visitor's address goes in replyTo,
// so pressing Reply in Gmail answers the visitor. The API key is read from the environment and never logged.

const DEFAULT_URL = 'https://api.brevo.com/v3/smtp/email';

export function createBrevo({
  apiKey = process.env.BREVO_API_KEY,
  senderEmail = process.env.BREVO_SENDER_EMAIL,
  senderName = 'Portfolio contact',
  url = process.env.BREVO_API_URL || DEFAULT_URL, // overridable so tests can point at a fake server
  fetchFn = fetch,
  timeoutMs = 15000,
} = {}) {
  if (!apiKey || !senderEmail) return null;

  // mail comes from buildMail(): { to, replyTo: { name, address }, subject, html }
  return async function sendViaBrevo(mail) {
    const body = {
      sender: { name: senderName, email: senderEmail },
      to: [{ email: mail.to }],
      replyTo: { email: mail.replyTo.address, ...(mail.replyTo.name ? { name: mail.replyTo.name } : {}) },
      subject: mail.subject,
      // Brevo accepts one body type per request; the HTML body is built from escaped visitor text
      htmlContent: mail.html,
    };
    let res;
    try {
      res = await fetchFn(url, {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      throw Object.assign(new Error('Could not reach Brevo.'), { code: 'brevo_network', cause: err });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Brevo error bodies look like { code: 'unauthorized', message: '...' }
      throw Object.assign(new Error(`Brevo rejected the message (${res.status}${data.code ? ' ' + data.code : ''}): ${String(data.message || '').slice(0, 160)}`), { status: res.status, code: data.code || 'brevo_error' });
    }
    return { messageId: data.messageId || (data.messageIds && data.messageIds[0]) || '', status: res.status };
  };
}
