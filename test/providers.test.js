// Tests for the two outside services: Brevo (email) and Gemini (chat answers).
// No real account or key is needed: a fake HTTP server stands in for both services.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createBrevo } from '../server/brevo.js';
import { createGeminiLlm, pickAnswerer } from '../server/rag/gemini.js';
import { NOT_FOUND } from '../server/rag/llm.js';
import { ROOT } from '../server/rag/config.js';

const mail = { to: 'inbox@example.com', replyTo: { name: 'Visitor', address: 'visitor@example.com' }, subject: '[Portfolio] Hello', html: '<p>Hi</p>' };
const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

/* ---------- Brevo client ---------- */
test('brevo: no key or no sender means not configured', () => {
  assert.equal(createBrevo({ apiKey: '', senderEmail: 'a@b.com' }), null);
  assert.equal(createBrevo({ apiKey: 'k', senderEmail: '' }), null);
});
test('brevo: builds the request Brevo documents and returns the message id', async () => {
  let seen;
  const send = createBrevo({ apiKey: 'secret-key', senderEmail: 'me@gmail.com', fetchFn: async (url, init) => { seen = { url, init }; return json(201, { messageId: '<abc@relay.brevo>' }); } });
  const r = await send(mail);
  assert.equal(r.messageId, '<abc@relay.brevo>');
  assert.equal(seen.url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(seen.init.method, 'POST');
  assert.equal(seen.init.headers['api-key'], 'secret-key');
  const body = JSON.parse(seen.init.body);
  assert.deepEqual(body.sender, { name: 'Portfolio contact', email: 'me@gmail.com' });
  assert.deepEqual(body.to, [{ email: 'inbox@example.com' }]);
  assert.deepEqual(body.replyTo, { email: 'visitor@example.com', name: 'Visitor' });
  assert.equal(body.subject, '[Portfolio] Hello');
  assert.equal(body.htmlContent, '<p>Hi</p>');
  assert.equal(body.textContent, undefined); // one body type per request
});
test('brevo: an API error becomes an error that never contains the key', async () => {
  const send = createBrevo({ apiKey: 'secret-key', senderEmail: 'me@gmail.com', fetchFn: async () => json(401, { code: 'unauthorized', message: 'Key not found' }) });
  await assert.rejects(send(mail), (e) => e.status === 401 && e.code === 'unauthorized' && !e.message.includes('secret-key'));
});
test('brevo: a network failure is reported as brevo_network', async () => {
  const send = createBrevo({ apiKey: 'k', senderEmail: 'a@b.com', fetchFn: async () => { throw new Error('offline'); } });
  await assert.rejects(send(mail), (e) => e.code === 'brevo_network');
});

/* ---------- Gemini client ---------- */
const passages = [{ n: 1, title: 'Project: Chess Set', text: 'A chess set made in Blender.' }];
test('gemini: no key means not configured, and Claude is the fallback choice', () => {
  const saved = process.env.GEMINI_API_KEY; delete process.env.GEMINI_API_KEY;
  assert.equal(createGeminiLlm({ apiKey: '' }), null);
  assert.equal(pickAnswerer(() => null), null);
  assert.equal(pickAnswerer(() => async () => 'x').name, 'Claude');
  if (saved) process.env.GEMINI_API_KEY = saved;
});
test('gemini: sends the system prompt, the passages and a low temperature, and returns the text', async () => {
  let seen;
  const ask = createGeminiLlm({ apiKey: 'gk', model: 'test-model', baseUrl: 'https://example.test/v1beta', fetchFn: async (url, init) => { seen = { url, init }; return json(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'It is a ' }, { text: 'chess set.' }] } }] }); } });
  const out = await ask({ question: 'What is the Chess Set?', history: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }], passages });
  assert.equal(out, 'It is a chess set.');
  assert.equal(seen.url, 'https://example.test/v1beta/models/test-model:generateContent');
  assert.equal(seen.init.headers['x-goog-api-key'], 'gk');
  const body = JSON.parse(seen.init.body);
  assert.ok(body.systemInstruction.parts[0].text.includes(NOT_FOUND));
  assert.equal(body.generationConfig.temperature, 0.2);
  assert.deepEqual(body.contents.map((c) => c.role), ['user', 'model', 'user']);
  assert.ok(body.contents[2].parts[0].text.includes('A chess set made in Blender.'));
});
test('gemini: blocked, empty and unsafe responses become NOT_FOUND', async () => {
  const mk = (data) => createGeminiLlm({ apiKey: 'gk', fetchFn: async () => json(200, data) });
  assert.equal(await mk({ promptFeedback: { blockReason: 'SAFETY' } })({ question: 'q', passages }), NOT_FOUND);
  assert.equal(await mk({ candidates: [] })({ question: 'q', passages }), NOT_FOUND);
  assert.equal(await mk({ candidates: [{ finishReason: 'SAFETY', content: { parts: [{ text: 'x' }] } }] })({ question: 'q', passages }), NOT_FOUND);
  assert.equal(await mk({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '   ' }] } }] })({ question: 'q', passages }), NOT_FOUND);
});
test('gemini: auth, rate-limit and server errors map to the codes the server handles', async () => {
  const fail = (status) => createGeminiLlm({ apiKey: 'gk', retryDelayMs: 0, fetchFn: async () => json(status, {}) })({ question: 'q', passages });
  await assert.rejects(fail(403), (e) => e.code === 'llm_auth');
  await assert.rejects(fail(429), (e) => e.code === 'llm_busy');
  await assert.rejects(fail(500), (e) => e.code === 'llm_error');
});

/* ---------- the real server talking to a fake Brevo and a fake Gemini ---------- */
const received = { brevo: [], gemini: [] };
let fake; let good; let bad;
function startFake() {
  fake = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => { raw += c; });
    req.on('end', () => {
      const reply = (status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
      if (req.url === '/brevo') { received.brevo.push({ headers: req.headers, body: JSON.parse(raw) }); return reply(201, { messageId: '<fake-id@brevo>' }); }
      if (req.url === '/brevo-bad') return reply(401, { code: 'unauthorized', message: 'Key not found' });
      if (req.url.startsWith('/gemini/models/')) { received.gemini.push({ url: req.url, headers: req.headers, body: JSON.parse(raw) }); return reply(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Neon Collector is a browser game Hasan built with Three.js.' }] } }] }); }
      reply(404, {});
    });
  });
  return new Promise((r) => fake.listen(39201, r));
}
function startServer(port, env) {
  const child = spawn(process.execPath, ['server/index.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), NODE_ENV: 'test', RAG_RETRIEVAL: 'lexical', ANTHROPIC_API_KEY: '', GEMINI_API_KEY: '', BREVO_API_KEY: '', SMTP_HOST: '', MAIL_DRY_RUN: 'false', MAIL_TO: 'inbox@example.com', ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  return new Promise((resolve, reject) => { const t = setTimeout(() => reject(new Error('server did not start')), 8000); child.stdout.on('data', (d) => { if (String(d).includes('listening')) { clearTimeout(t); resolve({ child, log: () => out }); } }); });
}
before(async () => {
  await startFake();
  good = await startServer(39202, { BREVO_API_KEY: 'test-brevo-key', BREVO_SENDER_EMAIL: 'sender@example.com', BREVO_API_URL: 'http://localhost:39201/brevo', GEMINI_API_KEY: 'test-gemini-key', GEMINI_API_URL: 'http://localhost:39201/gemini', GEMINI_CHAT_MODEL: 'test-model' });
  bad = await startServer(39203, { BREVO_API_KEY: 'wrong-key', BREVO_SENDER_EMAIL: 'sender@example.com', BREVO_API_URL: 'http://localhost:39201/brevo-bad' });
});
after(() => { good && good.child.kill(); bad && bad.child.kill(); fake && fake.close(); });
const post = async (port, path, body) => { const r = await fetch(`http://localhost:${port}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); return { status: r.status, json: await r.json() }; };
const form = { name: 'Test Visitor', email: 'visitor@example.com', subject: 'Hello from the test', message: 'This is a valid test message for Brevo.', elapsed: 5000 };

test('server: a valid message is sent through Brevo with the verified sender and the visitor as reply-to', async () => {
  const r = await post(39202, '/api/contact', form);
  assert.equal(r.status, 200);
  const got = received.brevo.at(-1);
  assert.equal(got.headers['api-key'], 'test-brevo-key');
  assert.equal(got.body.sender.email, 'sender@example.com');
  assert.deepEqual(got.body.to, [{ email: 'inbox@example.com' }]);
  assert.equal(got.body.replyTo.email, 'visitor@example.com');
  assert.ok(got.body.htmlContent.includes('Hello from the test'));
  assert.match(good.log(), /sent via Brevo: messageId=<fake-id@brevo>/);
  assert.ok(!good.log().includes('test-brevo-key')); // the key is never logged
});
test('server: when Brevo rejects the key the visitor gets a clear error, not a success', async () => {
  const r = await post(39203, '/api/contact', form);
  assert.equal(r.status, 502);
  assert.match(r.json.error, /could not be delivered/i);
  assert.ok(!JSON.stringify(r.json).includes('wrong-key'));
});
test('server: the chat answer is written by Gemini from the retrieved passages', async () => {
  const status = await (await fetch('http://localhost:39202/api/chat/status')).json();
  assert.deepEqual(status, { ready: true }); // no provider, model or counts are exposed
  const r = await post(39202, '/api/chat', { message: 'Tell me about the Neon Collector game' });
  assert.equal(r.status, 200);
  assert.match(r.json.answer, /Neon Collector is a browser game/);
  const got = received.gemini.at(-1);
  assert.equal(got.headers['x-goog-api-key'], 'test-gemini-key');
  assert.ok(got.url.includes('/models/test-model:generateContent'));
  assert.ok(got.body.contents.at(-1).parts[0].text.includes('Neon Collector')); // the retrieved passage was sent as context
});
test('server: an out-of-scope question never reaches Gemini', async () => {
  const before = received.gemini.length;
  const r = await post(39202, '/api/chat', { message: 'How do I bake chocolate cake with butter' });
  assert.equal(r.json.mode, 'refusal');
  assert.equal(received.gemini.length, before);
});

test('gemini: one temporary 403 (new key still starting up) is retried once, then succeeds', async () => {
  let calls = 0;
  const ask = createGeminiLlm({ apiKey: 'gk', retryDelayMs: 0, fetchFn: async () => { calls++; return calls === 1 ? json(403, {}) : json(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Fine.' }] } }] }); } });
  assert.equal(await ask({ question: 'q', passages }), 'Fine.');
  assert.equal(calls, 2);
});
