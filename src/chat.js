// AI assistant panel. It sends the visitor's question to /api/chat, which retrieves passages from Hasan's own
// documents and answers from them (see docs/RAG-PIPELINE.md). Sources are shown under every answer.
import { t, getLang } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const SECTION_IDX = { '#home': 0, '#about': 1, '#skills': 2, '#projects': 3, '#experience': 4, '#contact': 5 };
const SECTION_KEY = { '#home': 'nav.home', '#about': 'nav.about', '#skills': 'nav.skills', '#projects': 'nav.projects', '#experience': 'nav.experience', '#contact': 'nav.contact' };
// Source buttons use the page language: section names come from the translations, project names stay as they are.
const sourceLabel = (s) => (s.projectIndex != null ? s.label : s.href in SECTION_KEY ? t(SECTION_KEY[s.href]) : (s.label || s.title));

export async function initChat({ ui }) {
  const panel = $('#chatPanel');
  const btn = $('#chatBtn');
  const fab = $('#chatFab');
  if (!panel || !btn) return;

  // Hide the assistant completely when there is no backend (for example a static host) or no index.
  let status = null;
  try {
    const r = await fetch('/api/chat/status', { headers: { Accept: 'application/json' } });
    if (r.ok) status = await r.json();
  } catch { /* offline */ }
  if (!status || !status.ready) { btn.hidden = true; if (fab) fab.hidden = true; return; }
  btn.hidden = false;
  if (fab) fab.hidden = false;

  const log = $('#chatLog');
  const form = $('#chatForm');
  const input = $('#chatInput');
  const send = $('#chatSend');
  const sugg = $('#chatSugg');
  const history = []; // plain-text turns sent back so follow-up questions make sense
  let busy = false;
  let opener = null;

  const add = (cls, node) => { const el = document.createElement('div'); el.className = `chat-msg ${cls}`; el.appendChild(node); log.appendChild(el); log.scrollTop = log.scrollHeight; return el; };
  const text = (s) => { const p = document.createElement('p'); p.textContent = s; return p; };

  function goToSource(src) {
    close(false);
    if (src.projectIndex != null) { ui.scrollToIdx(3); setTimeout(() => ui.projects.open(src.projectIndex), 380); return; }
    if (src.href in SECTION_IDX) { ui.scrollToIdx(SECTION_IDX[src.href]); return; }
    window.open(src.href, '_blank', 'noopener');
  }

  function addBot(answer, sources = []) {
    const wrap = document.createElement('div');
    wrap.appendChild(text(answer));
    if (sources.length) {
      const row = document.createElement('div');
      row.className = 'chat-src';
      const label = document.createElement('span');
      label.textContent = `${t('chat.source')}:`;
      row.appendChild(label);
      sources.forEach((s) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = sourceLabel(s);
        b.addEventListener('click', () => goToSource(s));
        row.appendChild(b);
      });
      wrap.appendChild(row);
    }
    return add('bot', wrap);
  }

  function hello() {
    log.innerHTML = '';
    addBot(t('chat.hello'));
    sugg.innerHTML = [1, 2, 3, 4].map((n) => `<button type="button" data-q="chat.s${n}"></button>`).join('');
    sugg.querySelectorAll('button').forEach((b) => { b.textContent = t(b.dataset.q); });
  }

  async function ask(question) {
    if (busy || !question.trim()) return;
    busy = true;
    send.disabled = true;
    sugg.hidden = true;
    add('me', text(question));
    const wait = add('bot wait', text(t('chat.thinking')));
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: question, history: history.slice(-6), lang: getLang() }) });
      let body = {};
      try { body = await res.json(); } catch { /* not json */ }
      wait.remove();
      if (res.ok && body.answer) {
        history.push({ role: 'user', content: question }, { role: 'assistant', content: body.answer });
        addBot(body.answer, body.sources || []);
      } else {
        addBot(res.status === 429 ? t('chat.rate') : res.status === 503 ? t('chat.unavailable') : (body.error || t('chat.error')));
      }
    } catch {
      wait.remove();
      addBot(t('chat.error'));
    } finally {
      busy = false;
      send.disabled = false;
      input.focus();
    }
  }

  function open() {
    opener = document.activeElement;
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('chat-open');
    if (!log.children.length) hello();
    input.focus();
  }
  function close(restore = true) {
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('chat-open');
    if (restore && opener && opener.isConnected) opener.focus();
  }
  const toggle = () => (panel.hidden ? open() : close());
  // the assistant panel covers part of the page: when the visitor starts typing in the contact form, tuck it away
  document.addEventListener('focusin', (e) => {
    if (!panel.hidden && e.target.closest && e.target.closest('#contact form, #contactForm') && !panel.contains(e.target)) close(false);
  });

  btn.addEventListener('click', toggle);
  if (fab) fab.addEventListener('click', toggle);
  $('#chatClose').addEventListener('click', () => close());
  panel.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q);
  });
  sugg.addEventListener('click', (e) => { const b = e.target.closest('button[data-q]'); if (b) ask(t(b.dataset.q)); });
  window.addEventListener('langchange', () => {
    if (!history.length && log.children.length <= 1) hello(); // refresh the greeting only if the visitor has not started chatting
    else sugg.querySelectorAll('button').forEach((b) => { b.textContent = t(b.dataset.q); });
  });
}
