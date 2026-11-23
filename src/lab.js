// VISUAL FEATURES (formerly the sandbox "Feature Lab"). Twelve features, all ON. Everything lives in this file and lab.css.
// To bring back the on/off panel (bottom-left "Lab" button) for testing, set SHOW_PANEL to true.
const SHOW_PANEL = false;
import './lab.css';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const root = document.documentElement;
const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const GROUPS = ['Text and typography', 'Motion', 'Cards and images', 'Polish'];
const FEATURES = [
  { g: 0, id: 'words', title: 'Word-by-word headings', desc: 'Headings rise in one word at a time.' },
  { g: 0, id: 'assemble', title: 'Hero name assembles', desc: 'After the loader, "Hasan Abbasi" resolves from scrambled letters.' },
  { g: 0, id: 'mixed', title: 'Mixed-style headlines', desc: 'The last word of each heading is slanted, filled with a warm gradient and underlined.' },
  { g: 1, id: 'avatarIn', title: 'Avatar flies in from the side', desc: 'After the loader the avatar slides in from the right, rising and spinning into place, instead of appearing static.' },
  { g: 1, id: 'slide', title: 'Slide-up panels', desc: 'Every panel and card rises from below with a clear, medium-speed slide.' },
  { g: 2, id: 'imgs', title: 'Image reveals', desc: 'Project thumbnails unmask with a wipe and a slight zoom-out.' },
  { g: 2, id: 'skeleton', title: 'Skeleton shimmers', desc: 'Project images show a soft shimmer while they load.' },
  { g: 3, id: 'noglare', title: 'No white glare on card hover', desc: 'Removes the white highlight that follows the cursor over project cards.' },
  { g: 3, id: 'cursorHome', title: 'Cursor starts near the bottom', desc: 'On load the coral cursor dot waits at a set spot (lower middle-right) until you move the mouse.' },
  { g: 3, id: 'select', title: 'Accent selection and scrollbar', desc: 'Text selection, scrollbar and form caret use the accent colour.' },
  { g: 3, id: 'micro', title: 'Springy controls', desc: 'Buttons, tabs and the theme button respond with small springy motions.' },
  { g: 3, id: 'intro', title: 'Page-load choreography', desc: 'After the loader, the menu, name, text and buttons arrive in a planned order.' },
];
const KEY = 'lab.flags.v4';
const flags = {};
function loadFlags() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* private mode */ }
  FEATURES.forEach((f) => { flags[f.id] = SHOW_PANEL && f.id in saved ? saved[f.id] === true : true; });
}
function saveFlags() { try { localStorage.setItem(KEY, JSON.stringify(flags)); } catch { /* ignore */ } }

const modules = {};

/* ================================================================== TEXT AND TYPOGRAPHY */

/* ---------- headings: word-by-word (words) and mixed style (mixed) share one splitter ---------- */
const heads = () => $$('main h2');
let headIO = null;
function splitHead(h) {
  if (h.querySelector('.lw')) return;
  const perChar = /^(zh|ja|ko)/.test(root.lang);
  if (perChar) h.dataset.chars = '1';
  let n = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        (perChar ? [...c.textContent] : c.textContent.split(/(\s+)/)).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const o = document.createElement('span'); o.className = 'lw';
          const i = document.createElement('span'); i.className = 'lwi'; i.style.setProperty('--i', n++); i.textContent = part;
          o.appendChild(i); frag.appendChild(o);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
    });
  };
  walk(h);
}
function unsplitHead(h) { $$('.lw', h).forEach((w) => w.replaceWith(document.createTextNode(w.textContent))); h.normalize(); h.classList.remove('lw-in'); delete h.dataset.chars; }
function rebuildHeads() {
  const need = flags.words || flags.mixed;
  heads().forEach((h) => (need ? splitHead(h) : unsplitHead(h)));
  if (headIO) { headIO.disconnect(); headIO = null; }
  if (flags.words) {
    headIO = new IntersectionObserver((entries) => entries.forEach((en) => en.target.classList.toggle('lw-in', en.isIntersecting && en.intersectionRatio > 0.4)), { threshold: [0, 0.4, 0.7] });
    heads().forEach((h) => headIO.observe(h));
  } else heads().forEach((h) => h.classList.remove('lw-in'));
}
modules.words = { on: rebuildHeads, off: rebuildHeads };
modules.mixed = { on: rebuildHeads, off: rebuildHeads };

/* ---------- hero name assembles from scrambled letters ---------- */
modules.assemble = (() => {
  const GL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#%&*+<>/';
  let timer = 0, mo = null, wait = 0;
  const done = (now) => { if (now) root.classList.remove('lab-assembling'); else setTimeout(() => root.classList.remove('lab-assembling'), 1000); }; // the hero's particle scatter is blocked (CSS) until the name has assembled
  const words = () => $$('.sec-home h1 .w');
  function restore() { clearInterval(timer); timer = 0; words().forEach((w) => { if (w.dataset.labTxt) { w.textContent = w.dataset.labTxt; delete w.dataset.labTxt; } w.style.minWidth = ''; }); }
  function run() {
    restore();
    if (reduce()) { done(); return; }
    const ws = words();
    if (!ws.length) { done(); return; }
    ws.forEach((w) => { w.dataset.labTxt = w.textContent; w.style.minWidth = `${w.offsetWidth}px`; });
    const t0 = performance.now(), dur = 1500;
    timer = setInterval(() => {
      const el = performance.now() - t0;
      let all = true;
      ws.forEach((w, wi) => {
        const txt = w.dataset.labTxt;
        const p = clamp((el - wi * 280) / (dur - 400), 0, 1);
        if (p < 1) all = false;
        const keep = Math.floor(p * p * txt.length * 1.05);
        w.textContent = [...txt].map((ch, i) => (i < keep || ch === ' ' ? ch : GL[Math.floor(Math.random() * GL.length)])).join('');
      });
      if (all) { restore(); done(); }
    }, 55);
  }
  return {
    on() {
      if (!root.classList.contains('fx-loading')) { run(); return; }
      mo = new MutationObserver(() => { if (!root.classList.contains('fx-loading')) { mo.disconnect(); mo = null; wait = setTimeout(run, 600); } });
      mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    },
    off() { if (mo) mo.disconnect(); mo = null; clearTimeout(wait); restore(); done(true); },
  };
})();

/* ---------- avatar flies in from the side at page load ---------- */
modules.avatarIn = (() => {
  let mo = null, wait = 0, poll = 0;
  function play() {
    let tries = 0;
    clearInterval(poll);
    poll = setInterval(() => { // the 3D stage may still be starting
      const s = window.labStage;
      if (s && s.labArrive) { clearInterval(poll); if (!reduce()) s.labArrive(true); } else if (++tries > 80) clearInterval(poll);
    }, 100);
  }
  return {
    on() {
      if (!root.classList.contains('fx-loading')) { play(); return; }
      mo = new MutationObserver(() => { if (!root.classList.contains('fx-loading')) { mo.disconnect(); mo = null; wait = setTimeout(play, 450); } });
      mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    },
    off() { if (mo) mo.disconnect(); mo = null; clearTimeout(wait); clearInterval(poll); if (window.labStage && window.labStage.labArrive) window.labStage.labArrive(false); },
  };
})();

/* ================================================================== CARDS AND IMAGES */

/* ---------- card watcher shared by slide-ins, image reveals and skeletons ----------
   Order for every card: it scrolls into view (lab-seen, panel slides up) -> skeleton shimmer while the image is not ready (at least 0.7s)
   -> the shimmer is removed completely -> only then the image wipes in (lab-imgrdy). The two effects never run at the same time. */
const cardWatch = (() => {
  let io = null, mo = null, users = 0;
  const timers = new Set();
  const ready = (c) => requestAnimationFrame(() => c.classList.add('lab-imgrdy'));
  function seen(c) {
    c.classList.add('lab-seen');
    const box = $('.card-t', c), img = $('img', c);
    if (img) img.loading = 'eager';
    if (!flags.skeleton || !box || !img) { ready(c); return; }
    box.classList.add('lab-skel');
    img.loading = 'eager'; // the images are lazy-loaded and the wipe hides them, so without this they would never start loading and the shimmer would never end
    const t0 = performance.now();
    const finish = () => {
      const id = setTimeout(() => { timers.delete(id); box.classList.remove('lab-skel'); ready(c); }, Math.max(0, 700 - (performance.now() - t0)));
      timers.add(id);
    };
    let over = false;
    const end = () => { if (over) return; over = true; finish(); };
    if (img.complete) end(); else { img.addEventListener('load', end, { once: true }); img.addEventListener('error', end, { once: true }); const id = setTimeout(end, 2500); timers.add(id); } // 2.5s safety net
  }
  function track(c, i) {
    if (c.dataset.labTracked) return;
    c.dataset.labTracked = '1';
    c.style.setProperty('--lab-ci', String(i % 3));
    io.observe(c);
  }
  const scan = () => $$('#queue .card').forEach((c, i) => track(c, i));
  return {
    use() {
      if (users++) { scan(); return; }
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); seen(e.target); } }), { threshold: 0.12 });
      scan();
      const q = $('#queue');
      if (q) { mo = new MutationObserver(scan); mo.observe(q, { childList: true }); }
    },
    release() {
      if (--users > 0) return;
      users = 0;
      if (io) io.disconnect();
      if (mo) mo.disconnect();
      io = mo = null;
      timers.forEach(clearTimeout); timers.clear();
      $$('#queue .card').forEach((c) => { c.classList.remove('lab-seen', 'lab-imgrdy'); delete c.dataset.labTracked; c.style.removeProperty('--lab-ci'); $('.card-t', c)?.classList.remove('lab-skel'); });
    },
  };
})();
modules.slide = { on: () => cardWatch.use(), off: () => cardWatch.release() };
modules.imgs = { on: () => cardWatch.use(), off: () => cardWatch.release() };
modules.skeleton = { on: () => cardWatch.use(), off: () => cardWatch.release() };

/* ================================================================== POLISH */
modules.noglare = { on() {}, off() {} }; // pure CSS (html.lab-noglare)

/* ---------- the cursor dot waits at a default spot until the real mouse moves ----------
   Browsers send "fake" mouse-move events after the page loads, even if the mouse is still, so small jitters are swallowed (capture phase,
   before the site's cursor code sees them) and only a real movement of 10px or more releases the dot. */
modules.cursorHome = (() => {
  let mo = null, wait = 0, holding = false, anchor = null;
  const place = () => {
    document.body.dispatchEvent(new PointerEvent('pointermove', { clientX: Math.round(innerWidth * 0.608), clientY: Math.round(innerHeight * 0.968), bubbles: true, pointerType: 'mouse' }));
  };
  function hold(e) {
    if (!holding || !e.isTrusted) return;
    if (!anchor) anchor = { x: e.clientX, y: e.clientY };
    if (Math.hypot(e.clientX - anchor.x, e.clientY - anchor.y) < 10) { e.stopImmediatePropagation(); return; }
    holding = false; // a real movement: the dot follows the mouse again
  }
  function start() { if (!fine()) return; holding = true; anchor = null; place(); }
  return {
    on() {
      window.addEventListener('pointermove', hold, true);
      if (!root.classList.contains('fx-loading')) { start(); return; }
      mo = new MutationObserver(() => { if (!root.classList.contains('fx-loading')) { mo.disconnect(); mo = null; wait = setTimeout(start, 150); } });
      mo.observe(root, { attributes: true, attributeFilter: ['class'] });
    },
    off() { window.removeEventListener('pointermove', hold, true); holding = false; if (mo) mo.disconnect(); mo = null; clearTimeout(wait); },
  };
})();

modules.select = { on() {}, off() {} }; // pure CSS (html.lab-select)

modules.micro = (() => {
  const spin = (e) => { const b = e.target.closest && e.target.closest('#themeBtn'); if (!b) return; b.classList.remove('lab-spin'); void b.offsetWidth; b.classList.add('lab-spin'); };
  return { on() { document.addEventListener('click', spin); }, off() { document.removeEventListener('click', spin); $$('.lab-spin').forEach((b) => b.classList.remove('lab-spin')); } };
})();

modules.intro = { on() {}, off() {} }; // pure CSS (html.lab-intro plays once the loader's fx-loading class is gone; toggling it on replays it)

/* ================================================================== THE LAB PANEL */
function setFlag(id, on) {
  flags[id] = on;
  root.classList.toggle(`lab-${id}`, on);
  modules[id][on ? 'on' : 'off']();
  saveFlags();
}
function buildPanel() {
  const btn = document.createElement('button');
  btn.className = 'lab-btn'; btn.type = 'button'; btn.id = 'labBtn';
  btn.setAttribute('aria-haspopup', 'dialog'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'labPanel');
  const panel = document.createElement('section');
  panel.className = 'lab-panel'; panel.id = 'labPanel'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Feature lab');
  const list = GROUPS.map((gname, gi) => `<h3>${gname}</h3><ul>${FEATURES.filter((f) => f.g === gi).map((f) => `<li><button type="button" class="lab-sw" role="switch" data-id="${f.id}" aria-checked="false"><span class="lab-knob"></span></button><div><b>${f.title}</b><small>${f.desc}</small></div></li>`).join('')}</ul>`).join('');
  panel.innerHTML = `<header><b>Feature Lab</b><small>Sandbox only. Switch each feature on or off to compare with the original.</small></header>${list}<footer><button type="button" class="btn btn-small" data-all="1">All on</button><button type="button" class="btn btn-small" data-all="0">All off (original site)</button></footer>`;
  document.body.append(btn, panel);
  const sync = () => {
    $$('.lab-sw', panel).forEach((s) => s.setAttribute('aria-checked', String(!!flags[s.dataset.id])));
    const n = FEATURES.filter((f) => flags[f.id]).length;
    btn.innerHTML = `<span class="lab-dot"></span>Lab <b>${n}/${FEATURES.length}</b>`;
    btn.classList.toggle('all-off', n === 0);
  };
  btn.addEventListener('click', () => { panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden)); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden && !document.querySelector('dialog[open]')) { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); btn.focus(); } });
  panel.addEventListener('click', (e) => {
    const sw = e.target.closest('.lab-sw');
    if (sw) { setFlag(sw.dataset.id, !flags[sw.dataset.id]); sync(); return; }
    const all = e.target.closest('[data-all]');
    if (all) { FEATURES.forEach((f) => { if (flags[f.id] !== (all.dataset.all === '1')) setFlag(f.id, all.dataset.all === '1'); }); sync(); }
  });
  sync();
}

export function initLab() {
  loadFlags();
  if (SHOW_PANEL) buildPanel();
  // classes first (so CSS-only features like the intro are ready before the loader ends), the scripted parts once the page exists
  FEATURES.forEach((f) => root.classList.toggle(`lab-${f.id}`, flags[f.id]));
  if (flags.assemble) root.classList.add('lab-assembling'); // from the very start of the page load
  const start = () => {
    FEATURES.forEach((f) => { if (flags[f.id]) modules[f.id].on(); });
    window.addEventListener('langchange', () => setTimeout(rebuildHeads, 200)); // the language switch rewrites the heading text
  };
  if (document.readyState === 'complete') setTimeout(start, 400); else window.addEventListener('load', () => setTimeout(start, 400), { once: true });
}
