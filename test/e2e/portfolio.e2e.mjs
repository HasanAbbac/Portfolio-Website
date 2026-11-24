// Browser end-to-end tests: npm run test:e2e
// They start the production server (dry-run mail, so nothing is ever sent), open the real site in Chrome and walk the main journeys.
// Needs Chrome or Edge installed (playwright-core drives the browser you already have, no browser download) and a built site (npm run build).
// The page's strict Content-Security-Policy blocks the in-page polling that Playwright uses, so these contexts bypass it (the CSP itself is covered by test/hardening.test.js).
// If no browser can be launched the tests are skipped with a message instead of failing.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright-core';

const PORT = 3400 + Math.floor(Math.random() * 400);
const BASE = `http://localhost:${PORT}`;
let server, browser, skipReason = '';

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`${BASE}/api/chat/status`); if (r.ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('server did not start');
}

before(async () => {
  if (!existsSync(new URL('../../dist/index.html', import.meta.url))) { skipReason = 'dist/ is missing, run npm run build first'; return; }
  server = spawn(process.execPath, ['server/index.js'], { env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production', MAIL_DRY_RUN: 'true' }, stdio: 'ignore' });
  await waitForServer();
  for (const channel of ['chrome', 'msedge']) {
    try { browser = await chromium.launch({ channel, headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] }); break; } catch { /* try the next browser */ }
  }
  if (!browser) skipReason = 'no Chrome or Edge could be launched';
});
after(async () => { if (browser) await browser.close(); if (server) server.kill(); });

// Opens the site and gets past the render-style loading screen (its Skip button).
async function openSite(context, path = '/') {
  const page = await context.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => problems.push('request failed: ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(BASE + path);
  await page.waitForSelector('html.js', { state: 'attached' });
  const skip = page.locator('.ll-skip');
  if (await skip.count()) await skip.click().catch(() => {});
  await page.waitForFunction(() => !document.documentElement.classList.contains('fx-loading'), null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  return { page, problems };
}
const guard = (t) => { if (skipReason) { t.skip(skipReason); return true; } return false; };

test('home page loads with no console errors, failed requests or HTTP errors', async (t) => {
  if (guard(t)) return;
  const ctx = await browser.newContext({ bypassCSP: true, viewport: { width: 1280, height: 800 } });
  const { page, problems } = await openSite(ctx);
  assert.match(await page.title(), /Hasan Abbasi/);
  assert.equal(await page.locator('h1').getAttribute('aria-label'), 'Hasan Abbasi');
  assert.deepEqual(problems.filter((p) => !/favicon/.test(p)), []);
  await ctx.close();
});

test('section navigation works and Back / Forward step between sections', async (t) => {
  if (guard(t)) return;
  const ctx = await browser.newContext({ bypassCSP: true, viewport: { width: 1280, height: 800 } });
  const { page } = await openSite(ctx);
  const y = () => page.evaluate(() => Math.round(scrollY));
  await page.click('#nav a[href="#about"]');
  await page.waitForFunction(() => location.hash === '#about' && scrollY > 500, null, { timeout: 15000 });
  await page.click('#nav a[href="#projects"]');
  await page.waitForFunction(() => location.hash === '#projects' && scrollY > 1500, null, { timeout: 15000 });
  const projectsY = await y();
  await page.goBack();
  await page.waitForFunction(() => location.hash === '#about', null, { timeout: 15000 });
  await page.waitForFunction((py) => scrollY < py - 500, projectsY, { timeout: 15000 });
  await page.goForward();
  await page.waitForFunction(() => location.hash === '#projects', null, { timeout: 15000 });
  await ctx.close();
});

test('contact form: validation messages, then a successful dry-run submission', async (t) => {
  if (guard(t)) return;
  const ctx = await browser.newContext({ bypassCSP: true, viewport: { width: 1280, height: 800 } });
  const { page } = await openSite(ctx);
  await page.evaluate(() => document.getElementById('contact').scrollIntoView());
  await page.waitForTimeout(1500);
  await page.locator('#sendBtn').click({ force: true });
  await page.waitForFunction(() => document.querySelectorAll('.err:not(:empty)').length === 4);
  assert.equal(await page.locator('#formStatus').getAttribute('data-kind'), 'error');
  await page.fill('#cName', 'E2E Tester');
  await page.fill('#cEmail', 'e2e@example.com');
  await page.fill('#cSubject', 'End to end');
  await page.fill('#cMessage', 'This message comes from the automated browser test.');
  await page.waitForTimeout(3500); // the form has a minimum-fill-time spam check
  await page.locator('#sendBtn').click({ force: true });
  await page.waitForFunction(() => document.getElementById('formStatus').dataset.kind === 'ok', null, { timeout: 15000 });
  assert.match(await page.locator('#formStatus').textContent(), /Test mode/);
  assert.equal(await page.inputValue('#cName'), '');
  await ctx.close();
});

test('CV is served as a real PDF', async (t) => {
  if (guard(t)) return;
  const r = await fetch(`${BASE}/Hasan_Abbasi_CV.pdf`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /pdf/);
  assert.equal(Buffer.from(await r.arrayBuffer()).subarray(0, 5).toString(), '%PDF-');
});

test('project popup opens, shows the model viewer and closes with Escape', async (t) => {
  if (guard(t)) return;
  const ctx = await browser.newContext({ bypassCSP: true, viewport: { width: 1280, height: 800 } });
  const { page } = await openSite(ctx);
  await page.evaluate(() => document.getElementById('projects').scrollIntoView());
  await page.waitForTimeout(2500);
  await page.locator('#queue .card', { hasText: 'Helper Bot' }).first().click({ force: true });
  await page.waitForSelector('#pm[open] #pmMedia canvas', { timeout: 20000 });
  assert.equal(await page.locator('#pmTitle').textContent(), 'Helper Bot');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.getElementById('pm').open);
  await ctx.close();
});

test('smallest phone (320 px): no sideways scroll and the menu button is on screen', async (t) => {
  if (guard(t)) return;
  const ctx = await browser.newContext({ bypassCSP: true, viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  const { page } = await openSite(ctx);
  const m = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, vw: innerWidth, burgerRight: document.querySelector('.burger').getBoundingClientRect().right }));
  assert.ok(m.scrollW <= m.vw, `page is ${m.scrollW}px wide in a ${m.vw}px window`);
  assert.ok(m.burgerRight <= m.vw, `menu button ends at ${m.burgerRight}px`);
  await ctx.close();
});

test('chat assistant answers a question about the portfolio (skipped when the assistant is not ready)', async (t) => {
  if (guard(t)) return;
  const status = await (await fetch(`${BASE}/api/chat/status`)).json();
  if (!status.ready) { t.skip('the assistant index is not built here'); return; }
  const ctx = await browser.newContext({ bypassCSP: true, viewport: { width: 1280, height: 800 } });
  const { page } = await openSite(ctx);
  await page.click('#chatBtn');
  await page.fill('#chatInput', 'What is he studying?');
  await page.press('#chatInput', 'Enter');
  await page.waitForFunction(() => document.querySelectorAll('.chat-msg.bot').length >= 2 && !document.querySelector('.chat-msg.wait'), null, { timeout: 60000 });
  const last = await page.locator('.chat-msg.bot').last().textContent();
  assert.ok(last.length > 20, 'the assistant gave an answer');
  await ctx.close();
});
