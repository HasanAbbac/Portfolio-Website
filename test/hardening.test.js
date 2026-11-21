// Tests for the audit fixes: trusted client IP, request size guard, follow-up questions, tool/category split, Gemini model fallback.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientIp, tooLarge, body, MAX_BODY_BYTES } from '../server/vercel-helpers.js';
import { buildDocs } from '../server/rag/knowledge.js';
import { loadIndex } from '../server/rag/store.js';
import { answerQuestion, REFUSAL } from '../server/rag/answer.js';
import { createGeminiLlm } from '../server/rag/gemini.js';

const res = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });

test('clientIp trusts the platform header before a visitor-sendable one', () => {
  const req = { headers: { 'x-forwarded-for': '6.6.6.6', 'x-vercel-forwarded-for': '1.2.3.4' }, socket: { remoteAddress: '9.9.9.9' } };
  assert.equal(clientIp(req), '1.2.3.4');
  assert.equal(clientIp({ headers: { 'x-forwarded-for': '5.5.5.5, 7.7.7.7' } }), '5.5.5.5');
  assert.equal(clientIp({ headers: {}, socket: { remoteAddress: '9.9.9.9' } }), '9.9.9.9');
  assert.equal(clientIp({ headers: {} }), 'unknown');
});

test('bodies over 10 kB are refused before they are parsed', () => {
  assert.equal(tooLarge({ headers: { 'content-length': String(MAX_BODY_BYTES + 1) } }), true);
  assert.equal(tooLarge({ headers: { 'content-length': '500' } }), false);
  assert.equal(tooLarge({ headers: {} }), false);
  assert.deepEqual(body({ body: 'x'.repeat(MAX_BODY_BYTES + 5) }), {});
  assert.deepEqual(body({ body: '{"a":1}' }), { a: 1 });
});

test('project passages keep software and categories apart', () => {
  const doc = buildDocs().find((d) => d.id === 'project-rage-station');
  assert.ok(doc, 'Rage Station passage exists');
  assert.match(doc.text, /Software and tools used: Unity\./);
  assert.match(doc.text, /Categories: VR, Game\./);
  assert.doesNotMatch(doc.text, /Tools and techniques/);
});

test('a short follow-up is not derailed by a misleading earlier question', async () => {
  const index = loadIndex();
  assert.ok(index, 'the chatbot index exists');
  const history = [{ role: 'user', content: 'Tell me about his Harvard PhD' }, { role: 'assistant', content: REFUSAL }];
  const r = await answerQuestion({ question: 'and his education?', history }, { index, embedFn: null, llm: null, rewrite: null });
  assert.notEqual(r.mode, 'refusal');
  assert.match(r.answer, /NED|Computer Science/i);
});

test('gemini: a retired model id falls back to the latest alias instead of failing', async () => {
  const urls = [];
  const ask = createGeminiLlm({
    apiKey: 'k', model: 'gone-model', retryDelayMs: 0,
    fetchFn: async (url) => { urls.push(url); return urls.length === 1 ? res(404, { error: { message: 'not found' } }) : res(200, { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Hello' }] } }] }); },
  });
  const text = await ask({ question: 'hi', passages: [{ n: 1, title: 'T', text: 'x' }] });
  assert.equal(text, 'Hello');
  assert.match(urls[0], /gone-model/);
  assert.match(urls[1], /gemini-flash-lite-latest/);
});
