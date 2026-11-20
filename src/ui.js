import { POSES, mixPose } from './poses.js';
import { initProjects } from './projects.js';
import { t, tr } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const smooth = (t) => t * t * (3 - 2 * t);
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initUI(content, _stats) {
  const sections = $$('.sec');
  let starts = sections.map(() => 0);

  function measure() {
    starts = sections.map((s) => s.getBoundingClientRect().top + window.scrollY);
  }

  // Fractional section index: 2.5 means halfway from Skills to Projects.
  function getIdx() {
    const y = window.scrollY;
    let i = 0;
    for (let k = 0; k < sections.length - 1; k++) if (y >= starts[k] - 1) i = k;
    const last = sections.length - 1;
    if (y >= starts[last] - 1) return last;
    const span = starts[i + 1] - starts[i];
    if (!(span > 0)) return i;
    let p = (y - starts[i]) / span;
    // A tall Projects section: hold the finished render while browsing, ease out over the last screen.
    if (sections[i].dataset.hold && span > innerHeight * 1.3) p = (y - (starts[i + 1] - innerHeight)) / innerHeight;
    return i + Math.min(1, Math.max(0, p));
  }

  /* ---------- nav, burger, pipeline ---------- */
  const navLinks = $$('#nav a');
  const burger = $('#burger');
  const burgerLabel = () => burger.setAttribute('aria-label', t(document.documentElement.classList.contains('menu-open') ? 'burger.close' : 'burger.open'));
  burgerLabel();
  window.addEventListener('langchange', burgerLabel);
  burger.addEventListener('click', () => {
    const open = document.documentElement.classList.toggle('menu-open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', t(open ? 'burger.close' : 'burger.open'));
  });
  navLinks.forEach((a) => a.addEventListener('click', () => {
    document.documentElement.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
  }));
  const pipeBtns = $$('#pipe button');
  pipeBtns.forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.i;
    window.scrollTo({ top: starts[i], behavior: reduceMotion ? 'auto' : 'smooth' });
  }));
  const pipeFill = $('#pipeFill');
  let lastActive = -1;
  function updateChrome(idx) {
    const a = Math.min(5, Math.max(0, Math.round(idx)));
    pipeFill.style.setProperty('--p', `${(idx / 5) * 100}%`);
    if (a !== lastActive) {
      lastActive = a;
      navLinks.forEach((l) => l.classList.toggle('on', +l.dataset.i === a));
      navLinks.forEach((l) => (+l.dataset.i === a ? l.setAttribute('aria-current', 'true') : l.removeAttribute('aria-current')));
      pipeBtns.forEach((b) => b.classList.toggle('on', +b.dataset.i === a));
      document.documentElement.dataset.stage = String(a);
    }
  }

  /* ---------- reveal on scroll ---------- */
  const rvs = $$('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rvs.forEach((el) => io.observe(el));
  } else rvs.forEach((el) => el.classList.add('in'));

  /* ---------- skills node graph ---------- */
  const graph = $('#graph');
  const groups = [...new Set(content.skills.map((s) => s.group))];
  const groupLabel = (g) => tr('g.' + g, g);
  let gInner, wires;

  function sockPos(node, kind) {
    const s = $(`.sock.${kind}`, node);
    const r = s.getBoundingClientRect();
    const o = gInner.getBoundingClientRect();
    return { x: r.left + r.width / 2 - o.left, y: r.top + r.height / 2 - o.top };
  }
  function drawWires() {
    if (!wires) return;
    wires.innerHTML = '';
    if (getComputedStyle(wires).display === 'none') return;
    const o = gInner.getBoundingClientRect();
    wires.setAttribute('viewBox', `0 0 ${o.width} ${o.height}`);
    const mk = (a, b, cls, attrs) => {
      const dx = Math.max(40, (b.x - a.x) * 0.5);
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`);
      p.setAttribute('class', cls);
      Object.entries(attrs).forEach(([k, v]) => p.setAttribute(k, v));
      wires.appendChild(p);
      p.style.setProperty('--len', Math.ceil(p.getTotalLength()));
    };
    $$('.node[data-skill]', gInner).forEach((n) => {
      const mixNode = $(`.node[data-mix="${CSS.escape(n.dataset.group)}"]`, gInner);
      mk(sockPos(n, 'out'), sockPos(mixNode, 'in'), 'wire', { 'data-skill': n.dataset.skill, 'data-mix': n.dataset.group });
    });
    $$('.node[data-mix]', gInner).forEach((n) => {
      mk(sockPos(n, 'out'), sockPos($('#outNode'), 'in'), 'wire w2', { 'data-mix': n.dataset.mix });
    });
  }
  function highlight(node, on) {
    const skill = node.dataset.skill, mix = node.dataset.mix, isOut = node.id === 'outNode';
    $$('.wire', wires).forEach((w) => {
      const hit = isOut || (skill && (w.dataset.skill === skill || (w.classList.contains('w2') && w.dataset.mix === node.dataset.group))) || (mix && w.dataset.mix === mix);
      w.classList.toggle('hl', on && !!hit);
    });
    $$('.node', gInner).forEach((n) => {
      const rel = n === node || (skill && n.dataset.mix === node.dataset.group) || (mix && (n.dataset.group === mix)) || n.id === 'outNode';
      n.classList.toggle('dim', on && !rel);
    });
  }
  let graphRO = null;
  function buildGraph() {
    if (graphRO) graphRO.disconnect();
    graph.innerHTML = `
    <div class="g-inner" id="gInner">
      <svg class="wires" id="wires" aria-hidden="true"></svg>
      ${groups.map((g, gi) => `
        <div class="g-src" style="grid-row:${gi + 1}">
          <p class="g-label">${esc(groupLabel(g))}</p>
          ${content.skills.filter((s) => s.group === g).map((s) => `
            <article class="node" tabindex="0" data-skill="${esc(s.name)}" data-group="${esc(g)}" aria-label="${esc(s.name)}">
              <div class="nrow"><i class="dot"></i><span class="nname fbox">${esc(s.name)}</span></div>
              <span class="sock out" data-sock="out"></span>
            </article>`).join('')}
        </div>
        <article class="node mix" style="grid-row:${gi + 1}" tabindex="0" data-mix="${esc(g)}" aria-label="${esc(groupLabel(g))} ${esc(t('g.aria'))}">
          <span class="sock in" data-sock="in"></span>
          <div class="nrow"><i class="dot"></i><span class="nname">${esc(groupLabel(g))}</span><span class="mono mixtag">${esc(t('node.mix'))}</span></div>
          <span class="sock out" data-sock="out"></span>
        </article>`).join('')}
      <article class="node out-node" id="outNode" tabindex="0" aria-label="${esc(t('out.aria'))}">
        <span class="sock in" data-sock="in"></span>
        <header><i class="dot"></i><span class="nname">${esc(t('out.title'))}</span></header>
        <div class="nb"><span>${esc(t('out.surface'))}</span><b class="val">Hasan Abbasi</b></div>
        <div class="nb"><span>${esc(t('out.volume'))}</span><b class="val">${esc(t('out.v2'))}</b></div>
        <div class="nb"><span>${esc(t('out.displace'))}</span><b class="val">${esc(t('out.v3'))}</b></div>
      </article>
    </div>`;
    gInner = $('#gInner');
    wires = $('#wires');
    // one Tab stop for the whole graph; arrow keys move between nodes (roving tabindex)
    const gNodes = $$('.node', gInner);
    gNodes.forEach((n, i) => n.setAttribute('tabindex', i === 0 ? '0' : '-1'));
    graph.setAttribute('role', 'group');
    gInner.addEventListener('keydown', (e) => {
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      const at = gNodes.indexOf(document.activeElement);
      if (at < 0) return;
      let next = at;
      if (e.key in step) next = Math.min(gNodes.length - 1, Math.max(0, at + step[e.key]));
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = gNodes.length - 1;
      else return;
      e.preventDefault();
      gNodes[at].setAttribute('tabindex', '-1');
      gNodes[next].setAttribute('tabindex', '0');
      gNodes[next].focus();
    });
    $$('.node', gInner).forEach((n) => {
      n.addEventListener('mouseenter', () => highlight(n, true));
      n.addEventListener('mouseleave', () => highlight(n, false));
      n.addEventListener('focus', () => highlight(n, true));
      n.addEventListener('blur', () => highlight(n, false));
    });
    if ('ResizeObserver' in window) { graphRO = new ResizeObserver(() => { drawWires(); measure(); }); graphRO.observe(gInner); }
    drawWires();
  }
  buildGraph();
  window.addEventListener('langchange', () => { buildGraph(); requestAnimationFrame(() => { drawWires(); measure(); }); });

  /* ---------- projects ---------- */
  const projects = initProjects(content, () => measure());

  /* ---------- dope sheet (education and experience) ---------- */
  const dope = $('#dope');
  const keys = [...content.timeline].sort((a, b) => a.pos - b.pos);
  const channels = [...new Set(keys.map((k) => k.channel))];
  const kt = (k, f) => tr(`tl.${k.id}.${f}`, k[f] || '');
  const chanName = (c) => tr('ch.' + c, c);

  const tl = { t: 0, playing: false, touched: false, holdUntil: 0 };
  let scrub, playhead, detail, tlTime, playBtn;
  let shownId = null;

  function buildDope() {
    dope.innerHTML = `
    <header class="dope-top">
      <button class="btn btn-small" id="tlPlay" type="button" aria-pressed="false"><i class="ico-play" aria-hidden="true"></i><span>${esc(t('tl.play'))}</span></button>
      <output class="mono" id="tlTime" aria-hidden="true">0000</output>
      <span class="mono hint">${esc(t('tl.hint'))}</span>
    </header>
    <div class="dope-grid">
      <div class="channels">
        <div class="ruler-spacer"></div>
        ${channels.map((c) => `<div class="chan"><i></i>${esc(chanName(c))}</div>`).join('')}
      </div>
      <div class="tracks" id="tracks">
        <div class="ruler" aria-hidden="true">${Array.from({ length: 11 }, (_, i) => `<span style="left:${i * 10}%">${i * 10}</span>`).join('')}</div>
        ${channels.map((c) => `
          <div class="trow">
            ${keys.filter((k) => k.channel === c).map((k) => `
              <button class="kf" type="button" data-id="${esc(k.id)}" style="left:${k.pos * 100}%" aria-label="${esc(t('tl.jump', { t: kt(k, 'short') || kt(k, 'title') }))}"><i></i><span>${esc(kt(k, 'short') || kt(k, 'title'))}</span></button>`).join('')}
          </div>`).join('')}
        <div class="playhead" id="playhead" aria-hidden="true"><i></i></div>
        <input class="scrub" id="scrub" type="range" min="0" max="1000" step="1" value="0" aria-label="${esc(t('tl.aria'))}">
      </div>
    </div>
    <article class="kf-detail" id="kfDetail" aria-live="polite"></article>`;
    scrub = $('#scrub');
    playhead = $('#playhead');
    detail = $('#kfDetail');
    tlTime = $('#tlTime');
    playBtn = $('#tlPlay');
    shownId = null;
    scrub.addEventListener('input', () => setT(+scrub.value / 1000, true));
    playBtn.addEventListener('click', () => {
      tl.touched = true;
      if (!tl.playing && tl.t >= 0.999) setT(0);
      setPlaying(!tl.playing);
    });
    $$('.kf', dope).forEach((b) => b.addEventListener('click', () => {
      const k = keys.find((x) => x.id === b.dataset.id);
      setT(k.pos, true);
    }));
    setPlaying(tl.playing);
    setT(tl.t);
  }

  function showDetail(k) {
    if (shownId === k.id) return;
    shownId = k.id;
    $$('.kf', dope).forEach((b) => b.classList.toggle('on', b.dataset.id === k.id));
    detail.classList.remove('swap');
    void detail.offsetWidth;
    detail.classList.add('swap');
    detail.innerHTML = `
      <p class="mono kf-chan">${esc(chanName(k.channel))}</p>
      <h3>${esc(kt(k, 'title'))}</h3>
      <p class="kf-place">${esc(kt(k, 'place'))}</p>
      <p>${esc(kt(k, 'text'))}</p>
      ${k.certs ? `
        <ul class="certs">${k.certs.map((c) => `<li><a href="/certs/${esc(c.file)}" target="_blank" rel="noopener">${esc(c.label)}</a></li>`).join('')}</ul>
        <p class="links"><a href="${esc(k.verify)}" target="_blank" rel="noopener">${esc(t('tl.verify'))}</a></p>` : ''}`;
  }
  function setT(v, fromUser) {
    tl.t = Math.min(1, Math.max(0, v));
    scrub.value = Math.round(tl.t * 1000);
    playhead.style.left = `${tl.t * 100}%`;
    tlTime.textContent = String(Math.round(tl.t * 1000)).padStart(4, '0');
    let cur = keys[0];
    keys.forEach((k) => { if (k.pos <= tl.t + 0.015) cur = k; });
    showDetail(cur);
    if (fromUser) { tl.touched = true; setPlaying(false); }
  }
  function setPlaying(p) {
    tl.playing = p;
    playBtn.setAttribute('aria-pressed', String(p));
    $('span', playBtn).textContent = t(p ? 'tl.pause' : 'tl.play');
    playBtn.classList.toggle('playing', p);
  }
  buildDope();
  window.addEventListener('langchange', buildDope);

  function timelinePose() {
    const t = tl.t;
    const idle = POSES.idle;
    if (t <= keys[0].pos) return mixPose(idle, POSES[keys[0].pose] || idle, smooth(t / keys[0].pos));
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], b = keys[i + 1];
      if (t <= b.pos) return mixPose(POSES[a.pose] || idle, POSES[b.pose] || idle, smooth((t - a.pos) / (b.pos - a.pos)));
    }
    return POSES[keys[keys.length - 1].pose] || idle;
  }

  /* ---------- contact form ---------- */
  const wa = `https://wa.me/${content.whatsapp}?text=${encodeURIComponent(content.whatsappText || '')}`;
  $('#rEmailT').textContent = content.email;
  $('#rEmail').href = `mailto:${content.email}?subject=${encodeURIComponent('Hello Hasan')}`;
  $('#rPhoneT').textContent = content.phone;
  $('#rPhone').href = wa;
  $('#waBtn').href = wa;
  $('#rGit').href = content.github;
  $('#rLin').href = content.linkedin;
  $('#yr').textContent = new Date().getFullYear();

  const form = $('#contactForm');
  const status = $('#formStatus');
  const bar = $('#expBar');
  const sendBtn = $('#sendBtn');
  // timing for the spam check starts when the visitor first touches the form, not when the page loaded
  let startedAt = 0;
  form.addEventListener('focusin', () => { if (!startedAt) startedAt = Date.now(); });
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const rules = {
    name: (v) => (v.length < 2 ? t('err.name') : ''),
    email: (v) => (!emailRe.test(v) ? t('err.email') : ''),
    subject: (v) => (v.length < 3 ? t('err.subject') : ''),
    message: (v) => (v.length < 10 ? t('err.message') : ''),
  };
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  function showErr(name, msg) {
    const input = form.elements[name];
    $(`#e${cap(name)}`).textContent = msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (msg) input.setAttribute('aria-describedby', `e${cap(name)}`); else input.removeAttribute('aria-describedby');
  }
  Object.keys(rules).forEach((n) => form.elements[n].addEventListener('blur', () => showErr(n, rules[n](form.elements[n].value.trim()))));
  function setStatus(msg, kind) {
    status.textContent = msg;
    status.dataset.kind = kind || '';
  }
  // If the mail server is not set up (or unreachable), open the visitor's own email app with the message filled in.
  function mailtoFallback(d) {
    const body = `${d.message}\n\n${d.name} (${d.email})`;
    setStatus(t('form.mailto'), 'ok');
    window.location.href = `mailto:${content.email}?subject=${encodeURIComponent(d.subject)}&body=${encodeURIComponent(body)}`;
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {};
    let bad = null;
    Object.keys(rules).forEach((n) => {
      data[n] = form.elements[n].value.trim();
      const m = rules[n](data[n]);
      showErr(n, m);
      if (m && !bad) bad = n;
    });
    if (bad) { form.elements[bad].focus(); setStatus(t('err.fix'), 'error'); return; }
    data.company = form.elements.company.value;
    data.elapsed = startedAt ? Date.now() - startedAt : 0;
    sendBtn.disabled = true;
    setStatus(t('form.sending'), 'busy');
    bar.style.transition = 'width 2.5s ease-out';
    bar.style.width = '85%';
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      let body = {};
      try { body = await res.json(); } catch { /* not json */ }
      if (res.ok) {
        bar.style.transition = 'width .35s ease';
        bar.style.width = '100%';
        setStatus(t('form.ok'), 'ok');
        form.reset();
        Object.keys(rules).forEach((n) => showErr(n, ''));
        setTimeout(() => { bar.style.transition = 'none'; bar.style.width = '0'; }, 2600);
      } else {
        bar.style.width = '0';
        if (body.errors) Object.entries(body.errors).forEach(([k, v]) => form.elements[k] && showErr(k, v));
        if (body.code === 'too_fast') { setStatus(t('form.wait'), 'error'); return; }
        if (res.status === 503 || res.status === 502) { mailtoFallback(data); return; }
        setStatus(res.status === 429 ? t('form.rate') : t('form.fail'), 'error');
      }
    } catch {
      bar.style.width = '0';
      setStatus(t('form.offline'), 'error'); // network problem: keep what the visitor typed
    } finally {
      sendBtn.disabled = false;
    }
  });

  /* ---------- keep the viewport HUD out of the way of content ---------- */
  const hudEls = [$('#gizmo')].filter(Boolean);
  const avoidSel = '.sec .col, .sec .props, .sec .graph, .sec .skills-head, .sec .proj-head, .sec .pf, .sec .queue, .sec .pmore, .sec .exp-head, .sec .dope, .sec .export, .scroll-cue, .pipe';
  let hudFrame = 0;
  function updateHud() {
    const avoid = $$(avoidSel).filter((el) => !(el.classList.contains('rv') && !el.classList.contains('in')));
    const rects = avoid.map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight);
    hudEls.forEach((h) => {
      const r = h.getBoundingClientRect();
      if (!r.width) return;
      const hit = rects.some((a) => a.left < r.right + 14 && a.right > r.left - 14 && a.top < r.bottom + 10 && a.bottom > r.top - 10);
      h.classList.toggle('hide', hit);
    });
  }

  /* ---------- per-frame hook ---------- */
  let seen = false;
  function tick(dt, idx) {
    updateChrome(idx);
    if (++hudFrame % 8 === 0) updateHud();
    const inRange = idx > 3.55 && idx < 4.5;
    if (inRange && !seen && !tl.touched && !reduceMotion) { seen = true; setPlaying(true); }
    if (!inRange && tl.playing && !tl.touched) setPlaying(false);
    if (tl.playing) {
      if (performance.now() < tl.holdUntil) return;
      let t = tl.t + dt / 16;
      if (t >= 1) { t = 1; tl.holdUntil = performance.now() + 1800; setT(1); setTimeout(() => { if (tl.playing) setT(0); }, 1800); return; }
      setT(t);
    }
  }

  window.addEventListener('resize', () => { measure(); drawWires(); });
  window.addEventListener('load', () => { measure(); drawWires(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); drawWires(); });
  measure();

  return { getIdx, tick, measure, timelinePose, projects, starts: () => starts, scrollToIdx: (i) => window.scrollTo({ top: starts[i], behavior: reduceMotion ? 'auto' : 'smooth' }) };
}
