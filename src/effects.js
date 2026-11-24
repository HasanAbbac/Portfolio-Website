// VISUAL EFFECTS: soft blob cursor, tilting project cards, ripple section transition and the hero name that scatters into particles.
const $ = (s, r = document) => r.querySelector(s);
const root = document.documentElement;
const css = (n) => getComputedStyle(root).getPropertyValue(n).trim() || '#888';
const mk = (tag, cls, parent = document.body) => { const e = document.createElement(tag); if (cls) e.className = cls; e.setAttribute('aria-hidden', 'true'); parent.appendChild(e); return e; }; // purely decorative layers: hidden from screen readers
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;

const flags = { cursor: !coarse, tilt: !coarse, trans: !reduce, hero: !reduce }; // pointer effects are for mouse devices; motion effects respect reduced-motion
const mouse = { x: innerWidth / 2, y: innerHeight / 2, target: null, down: false, inside: false };
let VW = innerWidth, VH = innerHeight;

/* ============ soft blob cursor: one coral circle that sticks to the pointer with no lag and keeps its colour ============ */
const blob = mk('div', 'fx-blob');
blob.innerHTML = '<i></i><span class="fx-blob-l"></span>';
const blobLabel = $('.fx-blob-l', blob);
let curMode = '';
function modeOf(t) {
  if (!t || !t.closest) return '';
  if (t.closest('#promoBtn, .btn-play, video')) return 'Play';
  if (t.closest('input,textarea')) return 'text';
  if (t.closest('a,button,select,label,[role=button]')) return 'link';
  return '';
}
function drawCursor() {
  const on = flags.cursor && mouse.inside;
  blob.style.opacity = on ? '1' : '0';
  if (!on) return;
  const m = modeOf(mouse.target);
  if (m !== curMode) { curMode = m; blob.dataset.m = m; blobLabel.textContent = m === 'Play' ? m : ''; }
  blob.classList.toggle('down', mouse.down);
}

/* ============ tilting project cards ============ */
function resetCard(c) { c.classList.remove('fx-tilting'); c.style.transform = ''; const g = c.querySelector('.fx-glare'); if (g) g.style.opacity = '0'; const im = c.querySelector('.card-t img'); if (im) im.style.transform = ''; }
const queue = $('#queue');
if (queue) {
  queue.addEventListener('pointermove', (e) => {
    if (!flags.tilt || e.pointerType === 'touch') return;
    const c = e.target.closest('.card'); if (!c) return;
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.classList.add('fx-tilting');
    c.style.transform = `perspective(800px) rotateX(${((0.5 - y) * 14).toFixed(2)}deg) rotateY(${((x - 0.5) * 18).toFixed(2)}deg) translateY(-4px) scale(1.025)`;
    let g = c.querySelector('.fx-glare'); if (!g) { g = document.createElement('span'); g.className = 'fx-glare'; c.appendChild(g); }
    g.style.opacity = '1'; g.style.background = `radial-gradient(circle at ${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%, rgba(255,255,255,0.34), rgba(255,255,255,0) 55%)`;
    const im = c.querySelector('.card-t img'); if (im) im.style.transform = `translate(${((0.5 - x) * 12).toFixed(1)}px,${((0.5 - y) * 9).toFixed(1)}px) scale(1.12)`;
  });
  queue.addEventListener('pointerout', (e) => { const c = e.target.closest('.card'); if (c && !c.contains(e.relatedTarget)) resetCard(c); });
}

/* ============ ripple section transition (the only style) ============ */
const ovc = mk('canvas', 'fx-ov'); const ov = ovc.getContext('2d');
let tr = null, lastClick = { x: VW / 2, y: VH / 2 };
function playTransition(jump) {
  if (tr) { jump(); return; }
  tr = { t0: performance.now(), dur: 1000, jumped: false, jump, ox: lastClick.x, oy: lastClick.y };
  ovc.style.display = 'block';
  window.dispatchEvent(new Event('fx:transition'));
}
function drawTransition(now) {
  if (!tr) return;
  const p = (now - tr.t0) / tr.dur;
  if (p >= 1) { if (!tr.jumped) tr.jump(); ov.clearRect(0, 0, VW, VH); ovc.style.display = 'none'; tr = null; return; }
  const c = p < 0.5 ? p * 2 : (1 - p) * 2, e = c * c * (3 - 2 * c);
  if (p >= 0.5 && !tr.jumped) { tr.jumped = true; tr.jump(); }
  ov.clearRect(0, 0, VW, VH);
  const col = css('--bg'), acc = css('--orange'), blu = css('--blue');
  const R = e * Math.hypot(VW, VH) * 1.05, ox = p < 0.5 ? tr.ox : VW / 2, oy = p < 0.5 ? tr.oy : VH / 2;
  ov.fillStyle = col; ov.beginPath(); ov.arc(ox, oy, R, 0, 7); ov.fill();
  for (let k = 0; k < 3; k++) { ov.globalAlpha = [0.9, 0.5, 0.25][k]; ov.strokeStyle = k === 1 ? blu : acc; ov.lineWidth = 4 - k; ov.beginPath(); ov.arc(ox, oy, R + k * 14, 0, 7); ov.stroke(); }
  ov.globalAlpha = 1;
}
const nativeScrollTo = window.scrollTo.bind(window);
window.scrollTo = function (a, b) {
  if (flags.trans && a && typeof a === 'object' && a.behavior === 'smooth' && !tr && Math.abs((a.top ?? scrollY) - scrollY) > innerHeight * 0.55) {
    const opts = { ...a, behavior: 'auto' };
    playTransition(() => { root.style.scrollBehavior = 'auto'; nativeScrollTo(opts); root.style.scrollBehavior = ''; });
    return;
  }
  return nativeScrollTo(a, b);
};
document.addEventListener('pointerdown', (e) => { lastClick = { x: e.clientX, y: e.clientY }; }, true);
document.addEventListener('click', (e) => {
  if (!flags.trans || tr) return;
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a || a.classList.contains('skip')) return;
  const id = a.getAttribute('href').slice(1), el = id && document.getElementById(id); if (!el) return;
  const top = el.getBoundingClientRect().top + scrollY;
  if (Math.abs(top - scrollY) < innerHeight * 0.55) return;
  e.preventDefault(); if (location.hash !== '#' + id) history.pushState(null, '', '#' + id); // a real history entry, so Back returns to the previous section like it does for short jumps
  window.scrollTo({ top, behavior: 'smooth' });
}, true);

// Browser Back / Forward: each long section jump is a real history entry (above), so go to the section named in the address.
// The browser's own scroll restoration is switched off for this page so the two never fight; the address is the single source of truth.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
addEventListener('popstate', () => {
  const id = location.hash.slice(1), el = id ? document.getElementById(id) : null;
  window.scrollTo({ top: el ? el.getBoundingClientRect().top + scrollY : 0, behavior: 'smooth' });
});

/* ============ hero particle name ============ */
// The heading looks exactly as normal. When the mouse comes onto the name it turns into round particles that drift away
// freely (no walls, they fade out with distance), and when the mouse leaves they fly back and the solid heading returns.
const heroH1 = $('.sec-home h1'), heroSec = $('.sec-home');
const hero = { c: null, ctx: null, parts: [], words: [], state: 'idle', w: 0, h: 0, ready: false, cols: [], calm: 0, auto: 0 };
const heroOk = () => heroH1 && heroSec && !reduce && flags.hero && !root.classList.contains('lab-assembling') && root.dir !== 'rtl' && !root.classList.contains('rtl');
const HPAD = 10;
// where the name box is right now (viewport coordinates), so particles follow the heading if the page has scrolled
function heroBase() {
  const rs = hero.words.map((wd) => wd.line.getBoundingClientRect());
  return { l: Math.min(...rs.map((r) => r.left)) - HPAD, t: Math.min(...rs.map((r) => r.top)) - HPAD };
}

async function heroBuild() {
  if (!heroH1 || !heroSec) return;
  if (!hero.c) { hero.c = mk('canvas', 'fx-hero'); hero.ctx = hero.c.getContext('2d'); }
  hero.c.width = VW; hero.c.height = VH;
  const lines = [...heroH1.querySelectorAll('.line')]; if (!lines.length) return;
  try { await document.fonts.load('800 80px Unbounded'); await document.fonts.load('700 80px Unbounded'); } catch { /* fonts API missing */ }
  const rects = lines.map((l) => l.getBoundingClientRect());
  const left = Math.min(...rects.map((r) => r.left)) - HPAD, top = Math.min(...rects.map((r) => r.top)) - HPAD;
  const right = Math.max(...rects.map((r) => r.left + Math.min(r.width, 1400))) + HPAD, bottom = Math.max(...rects.map((r) => r.bottom)) + HPAD;
  const w = Math.round(right - left), h = Math.round(bottom - top); if (w < 50 || h < 50) return;
  hero.w = w; hero.h = h;
  const off = document.createElement('canvas'); off.width = w; off.height = h; const x = off.getContext('2d');
  hero.words = [];
  lines.forEach((l, i) => {
    const wEl = l.querySelector('.w'); if (!wEl) return;
    const cs = getComputedStyle(wEl), fs = parseFloat(cs.fontSize);
    x.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; x.letterSpacing = cs.letterSpacing; x.textBaseline = 'alphabetic'; x.textAlign = 'left';
    const m = x.measureText(wEl.textContent), fa = m.fontBoundingBoxAscent || fs * 0.95, fd = m.fontBoundingBoxDescent || fs * 0.25;
    const lh = parseFloat(cs.lineHeight) || fs * 0.9, r = rects[i];
    x.fillStyle = '#fff'; x.fillText(wEl.textContent, r.left - left, r.top - top + (lh - (fa + fd)) / 2 + fa);
    hero.words.push({ el: wEl, line: l, tw: m.width, t: r.top - top, b: r.bottom - top });
  });
  const d = x.getImageData(0, 0, w, h).data, pts = [], step = w > 700 ? 4 : 3;
  for (let yy = 0; yy < h; yy += step) for (let xx = 0; xx < w; xx += step) {
    if (d[(yy * w + xx) * 4 + 3] > 140) { const li = hero.words.findIndex((wd) => yy >= wd.t - 4 && yy < wd.b + 4); pts.push([xx, yy, Math.max(0, li)]); }
  }
  if (!pts.length) return;
  hero.parts = pts.map((p) => ({ x: left + p[0], y: top + p[1], rx: p[0], ry: p[1], li: p[2], vx: 0, vy: 0 }));
  hero.cols = hero.words.map((wd) => getComputedStyle(wd.el).color);
  hero.ready = true;
}
function heroSettle() { hero.state = 'idle'; hero.auto = 0; root.classList.remove('fx-morph-hide'); if (hero.c) { hero.c.style.opacity = '0'; hero.ctx.clearRect(0, 0, hero.c.width, hero.c.height); } }
function heroScatter() {
  if (!hero.ready) return;
  const b = heroBase();
  if (hero.state === 'idle') for (const p of hero.parts) { p.x = b.l + p.rx; p.y = b.t + p.ry; }
  for (const p of hero.parts) { const a = Math.atan2(p.y - mouse.y, p.x - mouse.x) + (Math.random() - 0.5) * 1.4, s = 5 + Math.random() * 13; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s; }
  window.dispatchEvent(new Event('fx:scatter'));
  hero.state = 'scatter'; hero.auto = performance.now() + 3000; hero.lastSY = scrollY; root.classList.add('fx-morph-hide'); hero.c.style.opacity = '1';
}
function heroOver(x, y, m) { return hero.words.some((wd) => { const r = wd.line.getBoundingClientRect(); return x > r.left - m && x < r.left + wd.tw + m && y > r.top - m && y < r.bottom + m; }); }
function heroDraw(now) {
  if (!hero.ready || hero.state === 'idle') return;
  // scrolling on to section 2 also clears the particles at once
  if (Number(root.dataset.stage || 0) >= 1) { heroSettle(); return; }
  const { ctx } = hero; ctx.clearRect(0, 0, hero.c.width, hero.c.height);
  const dsy = scrollY - hero.lastSY; hero.lastSY = scrollY;
  const b = heroBase(), cxn = b.l + hero.w / 2, cyn = b.t + hero.h / 2; let moving = 0;
  for (const p of hero.parts) {
    let alpha = 1;
    if (hero.state === 'scatter') {
      const dxn = p.x - cxn, dyn = p.y - cyn, dn = Math.hypot(dxn, dyn);
      p.vx = p.vx * 0.94 + (Math.random() - 0.5) * 0.16; p.vy = p.vy * 0.94 + (Math.random() - 0.5) * 0.16;
      p.x += p.vx; p.y += p.vy - dsy;
      if (mouse.inside) { const dx = p.x - mouse.x, dy = p.y - mouse.y, dd = Math.hypot(dx, dy); if (dd < 90 && dd > 0) { p.x += (dx / dd) * (90 - dd) * 0.3; p.y += (dy / dd) * (90 - dd) * 0.3; } }
      alpha = dn < 280 ? 1 : Math.max(0, 1 - (dn - 280) / 300);
    } else {
      const tx = b.l + p.rx, ty = b.t + p.ry;
      p.x += (tx - p.x) * 0.1; p.y += (ty - p.y) * 0.1;
      if (Math.abs(tx - p.x) + Math.abs(ty - p.y) > 1.5) moving++;
    }
    if (alpha <= 0.02) continue;
    ctx.globalAlpha = alpha; ctx.fillStyle = hero.cols[p.li] || '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  if (hero.state === 'return') { hero.calm = moving === 0 ? hero.calm + 1 : 0; if (hero.calm > 8) heroSettle(); }
  else if (hero.auto && now > hero.auto) { hero.auto = 0; hero.state = 'return'; hero.calm = 0; }
}
addEventListener('pointermove', (e) => {
  if (!heroOk() || !hero.ready || e.pointerType === 'touch') return;
  // burst only when the mouse enters the name; after 3 seconds the particles fly back by themselves
  const over = heroOver(e.clientX, e.clientY, 0), entered = over && !hero.wasOver; hero.wasOver = over;
  if (entered && (hero.state === 'idle' || hero.state === 'return')) heroScatter();
}, { passive: true });
addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch' || !heroOk() || !hero.ready) return; if (heroOver(e.clientX, e.clientY, 0)) { mouse.x = e.clientX; mouse.y = e.clientY; heroScatter(); hero.wasOver = true; } });
if (heroH1 && !reduce) heroBuild();
let heroT; const heroRebuild = () => { clearTimeout(heroT); heroT = setTimeout(() => { if (hero.state === 'idle') heroBuild(); }, 250); };
addEventListener('resize', heroRebuild); addEventListener('langchange', heroRebuild);
new MutationObserver(() => { if (hero.ready) hero.cols = hero.words.map((wd) => getComputedStyle(wd.el).color); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

root.classList.toggle('fx-cursor-on', flags.cursor);

/* ============ global events and loop ============ */
addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.target = e.target; mouse.inside = true; blob.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`; }, { passive: true });
document.addEventListener('pointerdown', () => { mouse.down = true; }, true);
addEventListener('pointerup', () => { mouse.down = false; });
document.documentElement.addEventListener('mouseleave', () => { mouse.inside = false; });
function resizeAll() { VW = innerWidth; VH = innerHeight; ovc.width = VW; ovc.height = VH; }
addEventListener('resize', resizeAll);
ovc.width = VW; ovc.height = VH;
ovc.style.display = 'none';

function loop(now) {
  drawCursor(); drawTransition(now); heroDraw(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
