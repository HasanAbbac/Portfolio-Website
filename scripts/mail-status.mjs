// Asks Brevo what happened to emails the site sent (delivered, soft/hard bounce, blocked, spam complaint, opened).
// Read-only: it sends nothing. Usage:
//   npm run mail:status                       checks every message id found in docs/email-proof/delivery-log.txt
//   npm run mail:status -- "<message-id>"     checks one message id
// Needs BREVO_API_KEY in .env (the key is never printed).
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const key = process.env.BREVO_API_KEY;
if (!key) { console.error('BREVO_API_KEY is not set in .env'); process.exit(1); }

let ids = process.argv.slice(2);
if (!ids.length) {
  const log = path.join(root, 'docs', 'email-proof', 'delivery-log.txt');
  if (!fs.existsSync(log)) { console.error('No message id given and no delivery-log.txt found.'); process.exit(1); }
  ids = [...fs.readFileSync(log, 'utf8').matchAll(/messageId=(<[^>]+>)/g)].map((m) => m[1]);
}
ids = [...new Set(ids)];
if (!ids.length) { console.error('No message ids found.'); process.exit(1); }

for (const id of ids) {
  const url = `https://api.brevo.com/v3/smtp/statistics/events?messageId=${encodeURIComponent(id)}&limit=50&sort=asc`;
  try {
    const r = await fetch(url, { headers: { 'api-key': key, accept: 'application/json' } });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { console.log(`${id}\n   HTTP ${r.status}: ${j.message || 'request failed'}\n`); continue; }
    const events = (j.events || []).map((e) => `${e.date} ${e.event}${e.reason ? ` (${e.reason})` : ''}`);
    console.log(`${id}\n   ${events.length ? events.join('\n   ') : 'no events recorded yet (try again in a minute)'}\n`);
  } catch (e) {
    console.log(`${id}\n   could not reach Brevo: ${e.message}\n`);
  }
}
