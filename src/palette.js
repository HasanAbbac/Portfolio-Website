import { t, LANG_MENU, setLang, getLang } from './i18n.js';

// "Quick menu": press K (or Ctrl/Cmd+K) to jump to a section or project, run an action, or change language.
export function initPalette({ content, ui, theme }) {
  const dlg = document.getElementById('cmd');
  const input = document.getElementById('cmdQ');
  const list = document.getElementById('cmdList');
  const btn = document.getElementById('cmdBtn');
  if (!dlg || !input || !list) return;

  const SECTIONS = ['home', 'about', 'skills', 'projects', 'experience', 'contact'];
  let items = [];
  let shown = [];
  let sel = 0;

  const cvLink = (dl) => { const a = document.createElement('a'); a.href = '/Hasan_Abbasi_CV.pdf'; if (dl) a.download = 'Hasan_Abbasi_CV.pdf'; else { a.target = '_blank'; a.rel = 'noopener'; } document.body.appendChild(a); a.click(); a.remove(); };
  const ext = (url) => window.open(url, '_blank', 'noopener');

  function build() {
    const wa = `https://wa.me/${content.whatsapp}?text=${encodeURIComponent(content.whatsappText || '')}`;
    items = [];
    SECTIONS.forEach((k, i) => items.push({ g: 'cmd.sections', label: t('nav.' + k), hint: String(i + 1).padStart(2, '0'), run: () => ui.scrollToIdx(i) }));
    items.push(
      { g: 'cmd.actions', label: t('about.view'), run: () => cvLink(false) },
      { g: 'cmd.actions', label: t('about.download'), run: () => cvLink(true) },
      { g: 'cmd.actions', label: t('contact.wa'), run: () => ext(wa) },
      { g: 'cmd.actions', label: t('act.email'), run: () => { window.location.href = `mailto:${content.email}`; } },
      { g: 'cmd.actions', label: t('act.github'), run: () => ext(content.github) },
      { g: 'cmd.actions', label: t('act.linkedin'), run: () => ext(content.linkedin) },
      { g: 'cmd.actions', label: t('theme.toggle'), run: () => theme.toggle() },
    );
    (content.projects || []).forEach((p, i) => items.push({ g: 'cmd.projects', label: p.title, hint: p.type, run: () => { ui.scrollToIdx(3); setTimeout(() => ui.projects.open(i), 350); } }));
    LANG_MENU.forEach((l) => items.push({ g: 'cmd.lang', label: l.name, hint: l.code === getLang() ? '✓' : l.code, key: l.code, run: () => setLang(l.code) }));
  }

  function render() {
    const q = input.value.trim().toLowerCase();
    shown = items.filter((it) => !q || (it.label + ' ' + (it.key || '') + ' ' + t(it.g)).toLowerCase().includes(q));
    if (sel >= shown.length) sel = 0;
    if (!shown.length) { list.innerHTML = `<li class="cmd-none" role="presentation">${t('cmd.none')}</li>`; return; }
    let html = '';
    let lastG = '';
    shown.forEach((it, i) => {
      if (it.g !== lastG) { html += `<li class="cmd-h" role="presentation">${t(it.g)}</li>`; lastG = it.g; }
      const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      html += `<li role="option" id="cmd-o${i}" data-i="${i}" aria-selected="${i === sel}"><span>${esc(it.label)}</span>${it.hint ? `<small>${esc(it.hint)}</small>` : ''}</li>`;
    });
    list.innerHTML = html;
    input.setAttribute('aria-activedescendant', `cmd-o${sel}`);
    const cur = $(`#cmd-o${sel}`);
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }
  const $ = (s) => list.querySelector(s);

  function open() {
    if (dlg.open) return;
    build();
    input.value = '';
    sel = 0;
    render();
    dlg.showModal();
    input.focus();
  }
  function run(i) {
    const it = shown[i];
    if (!it) return;
    dlg.close();
    it.run();
  }

  input.addEventListener('input', () => { sel = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
  });
  list.addEventListener('click', (e) => { const li = e.target.closest('[data-i]'); if (li) run(+li.dataset.i); });
  list.addEventListener('mousemove', (e) => { const li = e.target.closest('[data-i]'); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; list.querySelectorAll('[role=option]').forEach((o) => o.setAttribute('aria-selected', String(+o.dataset.i === sel))); } });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  if (btn) btn.addEventListener('click', open);

  window.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || '')) || e.target.isContentEditable;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); open(); return; }
    if (k === 'k' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && !document.querySelector('dialog[open]')) { e.preventDefault(); open(); }
  });
}
