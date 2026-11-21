import nodemailer from 'nodemailer';
import { validate, isTooFast, buildMail, clean } from '../server/mail.js';
import { createBrevo } from '../server/brevo.js';
import { allow, clientIp, num, body } from '../server/vercel-helpers.js';

const MAIL_TO = process.env.MAIL_TO || 'hasan.x.abbasi@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  const win = num('CONTACT_WINDOW_MINUTES', 15) * 60 * 1000;
  if (!allow('contact:' + clientIp(req), num('CONTACT_LIMIT', 5) * 8, win)) {
    return res.status(429).json({ error: 'Too many messages from this connection. Try again in a few minutes.' });
  }
  const b = body(req);
  if (clean(b.company, 50) !== '') return res.status(200).json({ ok: true }); // honeypot
  if (isTooFast(b)) return res.status(400).json({ error: 'Please wait a moment and try again.', code: 'too_fast' });
  const { data, errors } = validate(b);
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Check the highlighted fields.', errors });
  if (!allow('contact-ok:' + clientIp(req), num('CONTACT_LIMIT', 5), win)) {
    return res.status(429).json({ error: 'Too many messages from this connection. Try again in a few minutes.' });
  }

  const mail = buildMail(data, { from: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'portfolio@localhost', to: MAIL_TO });
  if (String(process.env.MAIL_DRY_RUN).toLowerCase() === 'true') return res.status(200).json({ ok: true, dryRun: true });

  const brevo = createBrevo();
  try {
    if (brevo) {
      await brevo(mail);
      return res.status(200).json({ ok: true });
    }
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      return res.status(503).json({ error: 'The mail service is not set up yet. Please email me directly.' });
    }
    const port = Number(SMTP_PORT) || 465;
    await nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } }).sendMail(mail);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact] send failed:', err.message);
    return res.status(502).json({ error: 'The message could not be delivered right now. Please try again, or email me directly.' });
  }
}
