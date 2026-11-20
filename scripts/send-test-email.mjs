// Sends ONE real test email and records the mail server's receipt:   npm run mail:test
//   npm run mail:test                         -> sends straight through Brevo (BREVO_API_KEY in .env), or SMTP if Brevo is not set
//   npm run mail:test -- --via-site           -> posts to the running site (http://localhost:3001/api/contact), the same path a visitor uses
//   npm run mail:test -- --via-site https://your-domain.com
// The receipt (message id, accepted recipients, server response) is appended to docs/email-proof/delivery-log.txt.
// The log never contains passwords. Pair it with a screenshot of the email in your inbox as proof of delivery.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { buildMail } from '../server/mail.js';
import { createBrevo } from '../server/brevo.js';
import { ROOT } from '../server/rag/config.js';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
const to = MAIL_TO || 'hasan.x.abbasi@gmail.com';
const stamp = new Date().toISOString();
const token = `DELIVERY-TEST-${stamp.replace(/[-:.TZ]/g, '').slice(0, 14)}`;
const logFile = path.join(ROOT, 'docs', 'email-proof', 'delivery-log.txt');
const log = (line) => { fs.mkdirSync(path.dirname(logFile), { recursive: true }); fs.appendFileSync(logFile, line + '\n'); console.log(line); };

const viaIdx = process.argv.indexOf('--via-site');
if (viaIdx !== -1) {
  const base = (process.argv[viaIdx + 1] && !process.argv[viaIdx + 1].startsWith('--') ? process.argv[viaIdx + 1] : 'http://localhost:3001').replace(/\/+$/, '');
  const res = await fetch(`${base}/api/contact`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Delivery test', email: to, subject: `Portfolio form test ${token}`, message: `This message was sent through the portfolio contact form API to prove delivery. Token: ${token}`, elapsed: 5000 }),
  });
  const body = await res.json().catch(() => ({}));
  log(`[${stamp}] via-site ${base}/api/contact -> HTTP ${res.status} ${JSON.stringify(body)}  token=${token}`);
  if (res.ok && !body.dryRun) console.log(`\nNow check the inbox of ${to} for a message whose subject contains ${token}, and screenshot it. Also copy the "[contact] sent: messageId=..." line from the server terminal.`);
  else if (body.dryRun) console.log('\nThe server is in MAIL_DRY_RUN mode, so nothing was sent. Set MAIL_DRY_RUN=false and restart it.');
  process.exit(res.ok ? 0 : 1);
}

// Brevo (recommended): used automatically when BREVO_API_KEY and BREVO_SENDER_EMAIL are set in .env
const brevoSend = createBrevo();
if (brevoSend) {
  try {
    const mail = buildMail({ name: 'Delivery test', email: to, subject: `Portfolio email test ${token}`, message: `This is a one-off test to prove the portfolio can deliver email through Brevo. Token: ${token}` }, { from: process.env.BREVO_SENDER_EMAIL, to });
    const r = await brevoSend(mail);
    log(`[${new Date().toISOString()}] SENT via Brevo to=${to} sender=${process.env.BREVO_SENDER_EMAIL} replyTo=${mail.replyTo.address} messageId=${r.messageId} http=${r.status} token=${token}`);
    console.log(`\nNow (1) open the inbox of ${to} and screenshot the message whose subject contains ${token} (check Spam too),\n(2) screenshot Brevo, Transactional, Logs, showing it as delivered, and (3) press Reply in Gmail and screenshot that the reply goes to the visitor address.`);
    process.exit(0);
  } catch (err) {
    log(`[${new Date().toISOString()}] FAILED via Brevo ${err.status || ''} ${err.code || ''} ${err.message}`);
    process.exit(1);
  }
}

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) { console.error('Set BREVO_API_KEY and BREVO_SENDER_EMAIL (recommended) or SMTP_HOST, SMTP_USER and SMTP_PASS in .env (see .env.example).'); process.exit(1); }
const port = Number(SMTP_PORT) || 465;
const tx = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
try {
  await tx.verify();
  log(`[${stamp}] SMTP login OK: ${SMTP_HOST}:${port} as ${SMTP_USER}`);
  const mail = buildMail({ name: 'Delivery test', email: to, subject: `Portfolio email test ${token}`, message: `This is a one-off test to prove the portfolio can deliver email. Token: ${token}` }, { from: SMTP_USER, to });
  const info = await tx.sendMail(mail);
  log(`[${new Date().toISOString()}] SENT to=${to} messageId=${info.messageId} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)} response="${info.response}" token=${token}`);
  console.log(`\nNow open the inbox of ${to}, find the message whose subject contains ${token}, and take a screenshot as your proof.`);
} catch (err) {
  log(`[${new Date().toISOString()}] FAILED ${err.code || ''} ${err.message}`);
  process.exit(1);
}
