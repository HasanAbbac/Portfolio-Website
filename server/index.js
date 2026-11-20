import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import { validate, isTooFast, buildMail, clean } from './mail.js';
import { loadIndex } from './rag/store.js';
import { embed, warmup } from './rag/embed.js';
import { createLlm } from './rag/llm.js';
import { pickAnswerer } from './rag/gemini.js';
import { createBrevo } from './brevo.js';
import { answerQuestion } from './rag/answer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const num = (name, fallback) => { const n = Number(process.env[name]); return Number.isFinite(n) && n > 0 ? n : fallback; };
const PORT = Number(process.env.PORT) || 3001;
const MAIL_TO = process.env.MAIL_TO || 'hasan.x.abbasi@gmail.com';
const DRY_RUN = String(process.env.MAIL_DRY_RUN).toLowerCase() === 'true';
const IS_PROD = process.env.NODE_ENV === 'production';
// Email goes through Brevo when BREVO_API_KEY and BREVO_SENDER_EMAIL are set, otherwise through SMTP when that is set up.
const brevo = createBrevo();
// HTTPS-only headers (HSTS, upgrade-insecure-requests) are on in production, off for local http testing.
const HTTPS_ONLY = process.env.HTTPS_ONLY ? String(process.env.HTTPS_ONLY).toLowerCase() === 'true' : IS_PROD;

// How many reverse proxies sit in front of this server (Render, Railway and similar hosts add exactly one).
// Only then may the X-Forwarded-For header be believed. Without a proxy it can be forged, which would let a visitor
// dodge the per-visitor limits, so locally the default is to ignore it. Override with TRUST_PROXY=0, 1, 2...
function trustProxySetting() {
  const v = process.env.TRUST_PROXY;
  if (v === undefined || v === '') return IS_PROD ? 1 : false;
  const s = String(v).toLowerCase();
  if (s === 'false' || s === '0') return false;
  const n = Number(s);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

const app = express();
app.set('trust proxy', trustProxySetting());
app.disable('x-powered-by');

// Browser features this site never uses stay switched off, even if a script tried to use them.
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
  next();
});

// The playable games in public/games are the site owner's own code. They get their own, slightly looser policy than the
// site itself: inline scripts (an import map) and WebAssembly. They still cannot talk to other websites. A Unity WebGL
// build may additionally need 'unsafe-eval' in script-src; add it here only if you ship one.
const distDir = path.join(__dirname, '..', 'dist');
const GAMES_CSP = {
  useDefaults: false,
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'blob:'],
    'connect-src': ["'self'", 'blob:', 'data:'],
    'media-src': ["'self'", 'blob:', 'data:'],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'frame-ancestors': ["'self'"],
  },
};
app.use('/games', helmet({ contentSecurityPolicy: GAMES_CSP, crossOriginEmbedderPolicy: false, strictTransportSecurity: HTTPS_ONLY }), express.static(path.join(distDir, 'games'), { maxAge: '1h' }));
app.use(
  helmet({
    strictTransportSecurity: HTTPS_ONLY,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // 'wasm-unsafe-eval' lets the Draco decoder (WebAssembly) read the compressed 3D models; it does not allow eval() of strings
        'script-src': ["'self'", "'wasm-unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
        'img-src': ["'self'", 'data:', 'blob:'],
        'connect-src': ["'self'", 'blob:', 'data:'],
        'frame-src': ["'self'", 'https://www.youtube-nocookie.com'], // the games in the project popup (same site) and YouTube trailers
        'media-src': ["'self'", 'blob:', 'data:'],
        'worker-src': ["'self'", 'blob:'],
        'upgrade-insecure-requests': HTTPS_ONLY ? [] : null,
      },
    },
  }),
);
app.use(express.json({ limit: '10kb' }));

// ---- mail transport (credentials come from environment variables only)
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 465,
    secure: (Number(SMTP_PORT) || 465) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

// Contact form limits (all adjustable in .env). The main limit counts only requests that were accepted, so a visitor who
// mistypes a field does not use up their attempts. A second, looser limit still caps how often anyone can hammer the endpoint.
const CONTACT_WINDOW = num('CONTACT_WINDOW_MINUTES', 15) * 60 * 1000;
const contactLimiter = rateLimit({
  windowMs: CONTACT_WINDOW,
  limit: num('CONTACT_LIMIT', 5),
  skipFailedRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages from this connection. Try again in a few minutes.' },
});
const contactAbuseLimiter = rateLimit({
  windowMs: CONTACT_WINDOW,
  limit: num('CONTACT_LIMIT', 5) * 8,
  standardHeaders: false,
  legacyHeaders: false,
  message: { error: 'Too many messages from this connection. Try again in a few minutes.' },
});

app.post('/api/contact', contactAbuseLimiter, contactLimiter, async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  // honeypot: a hidden field that people never fill. Bots get a fake success so they learn nothing.
  if (clean(body.company, 50) !== '') return res.status(200).json({ ok: true });

  // speed check: reject (not silently drop) a form filled in faster than a person could, so a real visitor can simply press Send again
  if (isTooFast(body)) return res.status(400).json({ error: 'Please wait a moment and try again.', code: 'too_fast' });

  const { data, errors } = validate(body);
  if (Object.keys(errors).length) return res.status(400).json({ error: 'Check the highlighted fields.', errors });

  const mail = buildMail(data, { from: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'portfolio@localhost', to: MAIL_TO });

  if (DRY_RUN) {
    console.log('[contact] DRY RUN, nothing was sent. The message would go to', MAIL_TO);
    return res.status(200).json({ ok: true, dryRun: true });
  }

  if (brevo) {
    try {
      const r = await brevo(mail);
      // delivery evidence for your own records: Brevo's message id. Check what happened to it with: npm run mail:status -- <id>
      // (the visitor's name, email and text are deliberately not written to the log)
      console.log(`[contact] sent via Brevo: messageId=${r.messageId} http=${r.status}`);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('[contact] Brevo send failed:', err.status || '', err.code || '', err.message);
      return res.status(502).json({ error: 'The message could not be delivered right now. Please try again, or email me directly.' });
    }
  }

  const tx = getTransporter();
  if (!tx) {
    console.error('[contact] No mail service is configured. Copy .env.example to .env and fill it in.');
    return res.status(503).json({ error: 'The mail service is not set up yet. Please email me directly.' });
  }
  try {
    const info = await tx.sendMail(mail);
    console.log(`[contact] sent: messageId=${info.messageId} accepted=${(info.accepted || []).length} rejected=${(info.rejected || []).length}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[contact] send failed:', err.message);
    return res.status(502).json({ error: 'The message could not be delivered right now. Please try again, or email me directly.' });
  }
});

// ---- AI assistant (RAG): answers questions about Hasan from his own documents. See docs/RAG-PIPELINE.md
const chatLimiter = rateLimit({
  windowMs: num('CHAT_WINDOW_MINUTES', 10) * 60 * 1000,
  limit: num('CHAT_LIMIT', 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many questions in a short time. Please try again in a few minutes.' },
});
const KEYWORD_ONLY = process.env.RAG_RETRIEVAL === 'lexical'; // skip the embedding model (used by the tests)
let answerer;
const getAnswerer = () => (answerer === undefined ? (answerer = pickAnswerer(createLlm)) : answerer); // Gemini, else Claude, else none
const getLlm = () => { const a = getAnswerer(); return a ? a.fn : null; };

// Shared budget for the language model across ALL visitors in the last hour. When it is used up the assistant keeps
// answering, but by quoting the best passage from the documents instead of calling the model (no quota, no cost).
const MODEL_CALLS_PER_HOUR = num('CHAT_LLM_PER_HOUR', 300);
const modelCalls = [];
function modelAllowed() {
  const now = Date.now();
  while (modelCalls.length && modelCalls[0] < now - 3600000) modelCalls.shift();
  if (modelCalls.length >= MODEL_CALLS_PER_HOUR) return false;
  modelCalls.push(now);
  return true;
}

// the page only needs to know whether the assistant exists; no provider name, model or document counts are exposed
app.get('/api/chat/status', (_req, res) => {
  res.json({ ready: !!loadIndex() });
});

app.post('/api/chat', chatLimiter, async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const question = clean(body.message, 400).replace(/\s+/g, ' ');
  if (question.length < 2) return res.status(400).json({ error: 'Type a question first.' });
  const lang = typeof body.lang === 'string' ? body.lang.slice(0, 5) : 'en';
  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-6)
    .map((m) => ({ role: m.role, content: clean(m.content, 600) }));
  const index = loadIndex();
  if (!index) return res.status(503).json({ error: 'The assistant is not set up yet. Please use the contact form instead.' });
  const deps = { index, embedFn: KEYWORD_ONLY ? null : embed, llm: modelAllowed() ? getLlm() : null };
  try {
    let r;
    try {
      r = await answerQuestion({ question, history, lang }, deps);
    } catch (err) {
      // the LLM failed (bad key, busy, network): still answer from the documents instead of showing an error
      console.error('[chat] LLM step failed:', err.code || err.message);
      r = await answerQuestion({ question, history, lang }, { ...deps, llm: null });
    }
    return res.json({ answer: r.answer, sources: r.sources, mode: r.mode });
  } catch (err) {
    console.error('[chat] failed:', err.message);
    return res.status(500).json({ error: 'The assistant could not answer right now. Please use the contact form instead.' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// In production the same process serves the built site. The site is one page, so only real files and "/" exist:
// every other URL gets a proper 404 status (not the home page with a 200).
const dist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: 'index.html' }));
  app.use((_req, res) => {
    const page = path.join(dist, '404.html');
    res.status(404);
    if (fs.existsSync(page)) res.sendFile(page);
    else res.type('text/plain').send('Not found');
  });
}

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Message is too large.' });
  if (err instanceof SyntaxError) return res.status(400).json({ error: 'Invalid request.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong.' });
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}${DRY_RUN ? ' (mail DRY RUN)' : ''}`);
  console.log(`[server] email: ${DRY_RUN ? 'dry run' : brevo ? 'Brevo' : process.env.SMTP_HOST ? 'SMTP' : 'not configured'}`);
  if (IS_PROD) {
    const missing = [];
    if (!DRY_RUN && !brevo && !process.env.SMTP_HOST) missing.push('email (BREVO_API_KEY and BREVO_SENDER_EMAIL)');
    if (!getAnswerer()) missing.push('chat answers (GEMINI_API_KEY); the assistant will quote your documents instead');
    if (missing.length) console.warn(`[server] WARNING: not configured: ${missing.join('; ')}`);
    if (!fs.existsSync(dist)) console.warn('[server] WARNING: dist/ not found. Run "npm run build" before "npm start".');
  }
  if (!KEYWORD_ONLY && loadIndex()) warmup().then(() => console.log(`[chat] ready (${getAnswerer() ? getAnswerer().name : 'extractive'} answers)`)).catch((e) => console.warn('[chat] embedding model not available yet, using keyword search:', e.message));
});
