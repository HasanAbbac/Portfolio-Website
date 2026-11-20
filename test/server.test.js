// Run with: npm test   (uses Node's built-in test runner, no extra packages)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate, isTooFast, buildMail, escapeHtml, MIN_FILL_MS } from '../server/mail.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const good = { name: 'Test User', email: 'user@example.com', subject: 'Hello there', message: 'A perfectly valid message body.', elapsed: 5000 };

/* ---------- pure helpers ---------- */
test('validate accepts a good message', () => {
  const { errors } = validate(good);
  assert.deepEqual(errors, {});
});
test('validate reports every bad field', () => {
  const { errors } = validate({ name: 'A', email: 'nope', subject: 'Hi', message: 'short' });
  assert.deepEqual(Object.keys(errors).sort(), ['email', 'message', 'name', 'subject']);
});
test('validate flattens line breaks so headers cannot be injected', () => {
  const { data } = validate({ ...good, subject: 'Hello\r\nBcc: victim@example.com' });
  assert.ok(!/[\r\n]/.test(data.subject));
});
test('isTooFast rejects missing, invalid and short timings', () => {
  assert.equal(isTooFast({}), true);
  assert.equal(isTooFast({ elapsed: 'abc' }), true);
  assert.equal(isTooFast({ elapsed: MIN_FILL_MS - 1 }), true);
  assert.equal(isTooFast({ elapsed: MIN_FILL_MS }), false);
});
test('buildMail escapes HTML and cleans the reply-to name', () => {
  const m = buildMail({ ...good, name: 'Eve <script>"x"', message: '<img src=x onerror=alert(1)>' }, { from: 'me@example.com', to: 'you@example.com' });
  assert.ok(!m.html.includes('<script>'));
  assert.ok(!m.html.includes('<img'));
  assert.ok(m.html.includes(escapeHtml('<img src=x onerror=alert(1)>')));
  assert.ok(!/["<>\\;,]/.test(m.replyTo.name));
  assert.equal(m.replyTo.address, 'user@example.com');
});

/* ---------- the running server ---------- */
function startServer(port) {
  const child = spawn(process.execPath, ['server/index.js'], { cwd: root, env: { ...process.env, PORT: String(port), MAIL_DRY_RUN: 'true', BREVO_API_KEY: '', GEMINI_API_KEY: '', ANTHROPIC_API_KEY: '', NODE_ENV: 'test' }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server did not start')), 8000);
    child.stdout.on('data', (d) => { if (String(d).includes('listening')) { clearTimeout(t); resolve(child); } });
    child.on('error', reject);
  });
}
const post = async (port, body, raw) => {
  const r = await fetch(`http://localhost:${port}/api/contact`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: raw ?? JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => null) };
};

let a; let b;
before(async () => { a = await startServer(39101); b = await startServer(39102); });
after(() => { a.kill(); b.kill(); });

test('health endpoint answers', async () => {
  const r = await fetch('http://localhost:39101/api/health');
  assert.equal(r.status, 200);
});
test('honeypot gets a quiet success and nothing is sent', async () => {
  const r = await post(39101, { ...good, company: 'spam' });
  assert.equal(r.status, 200);
  assert.equal(r.json.dryRun, undefined);
});
test('too-fast and missing-timing submissions are rejected with a retryable error', async () => {
  assert.equal((await post(39101, { ...good, elapsed: 100 })).json.code, 'too_fast');
  const { elapsed: _e, ...noElapsed } = good;
  assert.equal((await post(39101, noElapsed)).status, 400);
});
test('invalid fields return 400 with per-field errors', async () => {
  const r = await post(39101, { ...good, email: 'bad' });
  assert.equal(r.status, 400);
  assert.ok(r.json.errors.email);
});
test('a valid message is accepted (dry run)', async () => {
  const r = await post(39101, good);
  assert.equal(r.status, 200);
  assert.equal(r.json.dryRun, true);
});
test('oversized and malformed bodies are refused', async () => {
  assert.equal((await post(39101, { ...good, message: 'x'.repeat(20000) })).status, 413);
  assert.equal((await post(39101, null, '{bad')).status, 400);
});
test('the 6th message in the window is rate limited', async () => {
  for (let i = 0; i < 5; i++) assert.equal((await post(39102, good)).status, 200);
  assert.equal((await post(39102, good)).status, 429);
});
test('unknown URLs return 404 and the home page returns 200 (when a build exists)', async (t) => {
  const home = await fetch('http://localhost:39101/');
  if (home.status !== 200) return t.skip('no dist/ build present; run npm run build first');
  assert.equal((await fetch('http://localhost:39101/robots.txt')).headers.get('content-type')?.includes('text/html'), false);
  assert.equal((await fetch('http://localhost:39101/does-not-exist')).status, 404);
});

/* ---------- hardening ---------- */
test('validate rejects non-text fields and over-long input instead of cutting it', () => {
  assert.ok(validate({ ...good, name: { a: 1 } }).errors.name);
  assert.ok(validate({ ...good, message: ['a'.repeat(20)] }).errors.message);
  assert.ok(validate({ ...good, message: 'm'.repeat(3001) }).errors.message);
  assert.deepEqual(validate({ ...good, message: 'm'.repeat(3000) }).errors, {});
  assert.ok(validate({ ...good, email: `${'a'.repeat(130)}@example.com` }).errors.email);
});
test('mistyped forms do not use up the visitor\'s accepted-message allowance', async () => {
  for (let i = 0; i < 8; i++) assert.equal((await post(39101, { ...good, email: 'bad' })).status, 400);
  assert.equal((await post(39101, good)).status, 200);
});
test('security headers: permissions policy, games CSP, no server banner', async () => {
  const r = await fetch('http://localhost:39101/api/health');
  assert.match(r.headers.get('permissions-policy'), /camera=\(\)/);
  assert.equal(r.headers.get('x-powered-by'), null);
  assert.match(r.headers.get('content-security-policy'), /frame-src 'self' https:\/\/www\.youtube-nocookie\.com/);
});
