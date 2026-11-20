// Projects gallery: filter tabs, card grid, and a popup that can show an interactive
// 3D model (.glb), a playable game (iframe), a video, or just an image.
import { t } from './i18n.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const TYPES = ['model', 'web', 'unity', 'unreal'];
const PAGE = () => (window.matchMedia('(max-width: 860px)').matches ? 4 : 6);

const isLocalVideo = (u) => /^\/.+\.(mp4|webm)$/i.test(String(u));
function ytId(url) {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

// Returns { list, open(i) } so the quick menu can list and open projects.
export function initProjects(content, onLayout) {
  const list = content.projects || [];
  const queue = $('#queue');
  const api = { list, open: () => {} };

  if (!list.length) {
    const ghosts = () => {
      queue.innerHTML = [1, 2, 3].map((n) => `
      <article class="ghost" aria-label="${esc(t('ghost.aria', { n }))}">
        <div class="ghost-view" aria-hidden="true">
          <div class="cube"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
        <div class="ghost-meta">
          <p><b>${esc(t('ghost.frame'))} ${String(n).padStart(3, '0')}</b><span>${esc(t('ghost.waiting'))}</span></p>
          <div class="bar" aria-hidden="true"><i style="--d:${n * 0.7}s"></i></div>
          <p class="mono">${esc(t('ghost.samples'))}</p>
        </div>
      </article>`).join('');
    };
    ghosts();
    window.addEventListener('langchange', ghosts);
    return api;
  }

  queue.classList.add('has-projects');
  const heading = () => {
    $('#h-projects').textContent = t('projects.h2b');
    $('#projLead').textContent = t('projects.leadb');
  };
  heading();
  $('#h-projects').removeAttribute('data-i18n');
  $('#projLead').removeAttribute('data-i18n');

  /* ----- filters ----- */
  const counts = { all: list.length };
  TYPES.forEach((k) => { counts[k] = list.filter((p) => p.type === k).length; });
  const pf = $('#pf');
  pf.hidden = false;
  let filter = 'all';
  let expanded = false;
  const more = $('#pmore');
  const moreBtn = $('#pmoreBtn');
  const typeLabel = (p) => (TYPES.includes(p.type) ? t('t.' + p.type) : t('t.project'));

  function renderFilters() {
    pf.innerHTML = ['all', ...TYPES.filter((k) => counts[k])]
      .map((k) => `<button type="button" data-f="${k}" aria-pressed="${k === filter}">${k === 'all' ? esc(t('f.all')) : esc(t('tab.' + k))}<sup>${counts[k]}</sup></button>`).join('');
  }

  /* ----- search and technique filter (works together with the category tabs above) ----- */
  const ptools = $('#ptools');
  ptools.hidden = false;
  let q = '';
  let tag = '';
  // the Technique dropdown uses the short curated list from content.js (tools are covered by the category tabs)
  const allTags = (content.techniques || [])
    .map((x) => [x, list.filter((p) => (p.tags || []).includes(x)).length])
    .filter(([, n]) => n > 0);
  function renderTools() {
    ptools.innerHTML = `
      <label class="pt-search"><span class="vh">${esc(t('f.search'))}</span><input type="search" id="pSearch" placeholder="${esc(t('f.searchph'))}" value="${esc(q)}" maxlength="60" autocomplete="off"></label>
      <label class="pt-sel"><span>${esc(t('f.tag'))}</span><select id="pTag"><option value="">${esc(t('f.alltags'))}</option>${allTags.map(([x, n]) => `<option value="${esc(x)}"${x === tag ? ' selected' : ''}>${esc(x)} (${n})</option>`).join('')}</select></label>
      <p class="pt-count mono" id="pCount" role="status" aria-live="polite"></p>
      <button type="button" class="btn btn-small pt-clear" id="pClear" hidden>${esc(t('f.clear'))}</button>`;
  }
  const norm = (x) => String(x).toLowerCase();
  function visible() {
    const terms = norm(q).split(/\s+/).filter(Boolean);
    let items = list.filter((p) => (filter === 'all' || p.type === filter)
      && (!tag || (p.tags || []).includes(tag))
      && terms.every((w) => norm([p.title, p.text, (p.tags || []).join(' '), typeLabel(p), p.year, p.role].filter(Boolean).join(' ')).includes(w)));
    return items;
  }

  const thumb = (p) => (p.image
    ? `<img src="${esc(p.image)}" alt="" loading="lazy" decoding="async">`
    : `<div class="noimg" aria-hidden="true"><div class="cube"><i></i><i></i><i></i><i></i><i></i><i></i></div></div>`);
  const badge = (p) => (p.model ? t('b.model') : p.play ? t('b.play') : p.video ? t('b.video') : '');

  function render(animate = true) {
    const items = visible();
    const limit = PAGE();
    const shown = expanded ? items : items.slice(0, limit);
    const countEl = $('#pCount');
    if (countEl) countEl.textContent = t('f.count', { n: items.length, total: list.length });
    const clearEl = $('#pClear');
    if (clearEl) clearEl.hidden = !(q || tag || filter !== 'all');
    queue.innerHTML = !items.length ? `<p class="p-none">${esc(t('f.none'))}</p>` : shown.map((p) => {
      const idx = list.indexOf(p);
      const inner = `
        <div class="card-t">${thumb(p)}<span class="tag-type" data-t="${esc(p.type)}">${esc(typeLabel(p))}</span>${badge(p) ? `<span class="tag-act">${esc(badge(p))}</span>` : ''}</div>
        <div class="card-b"><h3>${esc(p.title)}</h3>${p.text ? `<p>${esc(p.text)}</p>` : ''}<ul class="chips">${(p.tags || []).slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
      return p.href
        ? `<a class="card" href="${esc(p.href)}" target="_blank" rel="noopener" aria-label="${esc(t('pm.newtab', { title: p.title }))}">${inner}</a>`
        : `<button class="card" type="button" data-i="${idx}" aria-label="${esc(t('pm.open', { title: p.title }))}">${inner}</button>`;
    }).join('');
    if (animate) {
      queue.classList.remove('swap');
      void queue.offsetWidth;
      queue.classList.add('swap');
    }
    const rest = items.length - limit;
    more.hidden = rest <= 0;
    moreBtn.textContent = expanded ? t('more.fewer') : t('more.show', { n: rest });
    if (onLayout) requestAnimationFrame(onLayout);
  }
  pf.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-f]');
    if (!b) return;
    filter = b.dataset.f;
    expanded = false;
    pf.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  });
  moreBtn.addEventListener('click', () => { expanded = !expanded; render(); });
  let searchTimer = 0;
  ptools.addEventListener('input', (e) => {
    if (e.target.id !== 'pSearch') return;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { q = e.target.value.trim(); expanded = false; render(false); }, 120);
  });
  ptools.addEventListener('change', (e) => {
    if (e.target.id !== 'pTag') return;
    tag = e.target.value;
    expanded = false;
    render(false);
  });
  ptools.addEventListener('click', (e) => {
    if (!e.target.closest('#pClear')) return;
    q = ''; tag = ''; filter = 'all'; expanded = false;
    renderTools();
    renderFilters();
    render();
    $('#pSearch').focus();
  });
  renderTools();
  renderFilters();
  render();

  /* ----- popup ----- */
  const dlg = $('#pm');
  const media = $('#pmMedia');
  const tabs = $('#pmTabs');
  let current = null;
  let currentView = null;
  let viewer = null;
  let opener = null;
  let fitObs = null;

  function clearMedia() {
    if (viewer) { viewer.dispose(); viewer = null; }
    if (fitObs) { fitObs.disconnect(); fitObs = null; }
    media.innerHTML = '';
    media.classList.remove('is-model');
    media.classList.remove('is-video');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }
  function showImage(p) {
    media.innerHTML = p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)}">` : `<div class="pm-empty">${esc(t('pm.noimg'))}</div>`;
  }
  const ICON = {
    play: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>',
    vol: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    full: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  // Local video: a title cover with a big play button first, then the video with its own control bar underneath
  // (so the controls never sit on top of the picture).
  function mountVideo(p) {
    const cover = p.cover || p.image || '';
    media.classList.add('is-video');
    media.innerHTML = `
      <div class="pm-vid" id="pmVid">
        <div class="pm-vid-stage">
          <video id="pmVideo" src="${esc(p.video)}" playsinline preload="metadata" aria-label="${esc(p.title)}"></video>
          <button type="button" class="pm-cover" id="pmCover" aria-label="${esc(t('pm.playvideo', { title: p.title }))}"${cover ? ` style="background-image:url('${esc(cover)}')${p.coverPlayTop ? `;--play-top:${esc(p.coverPlayTop)}` : ''}"` : ''}><span class="pm-playicon" aria-hidden="true"></span></button>
        </div>
        <div class="pm-vbar" role="group" aria-label="${esc(p.title)}">
          <button type="button" class="vb" id="vPlay" aria-label="${esc(t('v.play'))}">${ICON.play}</button>
          <input type="range" id="vSeek" class="vseek" min="0" max="1000" value="0" step="1" aria-label="${esc(t('v.seek'))}">
          <span class="vtime mono" id="vTime">0:00 / 0:00</span>
          <button type="button" class="vb" id="vMute" aria-label="${esc(t('v.mute'))}">${ICON.vol}</button>
          <button type="button" class="vb" id="vFull" aria-label="${esc(t('v.full'))}">${ICON.full}</button>
        </div>
      </div>`;
    const vid = $('#pmVideo');
    const cov = $('#pmCover');
    const playB = $('#vPlay');
    const seek = $('#vSeek');
    const time = $('#vTime');
    const muteB = $('#vMute');
    const wrap = $('#pmVid');
    const fmt = (s) => { const n = Math.max(0, Math.floor(s || 0)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
    const update = () => {
      seek.value = vid.duration ? Math.round((vid.currentTime / vid.duration) * 1000) : 0;
      time.textContent = `${fmt(vid.currentTime)} / ${fmt(vid.duration)}`;
    };
    const toggle = () => (vid.paused ? vid.play().catch(() => {}) : vid.pause());
    cov.addEventListener('click', toggle);
    vid.addEventListener('click', toggle);
    playB.addEventListener('click', toggle);
    vid.addEventListener('play', () => { cov.hidden = true; playB.innerHTML = ICON.pause; playB.setAttribute('aria-label', t('v.pause')); });
    vid.addEventListener('pause', () => { playB.innerHTML = ICON.play; playB.setAttribute('aria-label', t('v.play')); });
    vid.addEventListener('ended', () => { cov.hidden = false; vid.currentTime = 0; update(); });
    vid.addEventListener('timeupdate', update);
    vid.addEventListener('loadedmetadata', update);
    seek.addEventListener('input', () => { if (vid.duration) vid.currentTime = (vid.duration * seek.value) / 1000; });
    muteB.addEventListener('click', () => {
      vid.muted = !vid.muted;
      muteB.innerHTML = vid.muted ? ICON.mute : ICON.vol;
      muteB.setAttribute('aria-label', t(vid.muted ? 'v.unmute' : 'v.mute'));
    });
    $('#vFull').addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (wrap.requestFullscreen) wrap.requestFullscreen();
    });
  }

  const STAGE_KEYS = { 1: 'st.wireframe', 2: 'st.matprev' };

  function modelControls() {
    return `
      <p class="pm-state mono" id="pmState">${esc(t('pm.loading'))}</p>
      <div class="pm-ctrl" id="pmCtrl" hidden>
        <div class="pm-sl pm-stage"><span>${esc(t('pm.stage'))}</span>
          <div class="pm-seg" role="group" aria-label="${esc(t('pm.stage'))}">
            <button type="button" class="btn" data-s="1" aria-pressed="false">${esc(t(STAGE_KEYS[1]))}</button>
            <button type="button" class="btn" data-s="2" aria-pressed="true">${esc(t(STAGE_KEYS[2]))}</button>
          </div></div>
      </div>
      <span class="pm-hint mono">${esc(t('pm.hint'))}</span>`;
  }

  function showView(p, kind) {
    clearMedia();
    currentView = kind;
    tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.v === kind)));
    if (kind === 'model') {
      media.classList.add('is-model');
      media.insertAdjacentHTML('beforeend', modelControls());
      const state = $('#pmState');
      const ctrl = $('#pmCtrl');
      import('./viewer.js').then(({ mountViewer }) => mountViewer(media, p.model, (s) => {
        if (s === 'ready') { state.remove(); ctrl.hidden = false; }
        else { state.textContent = t('pm.fail'); }
      }, p.view)).then((v) => {
        if (current !== p) { v.dispose(); return; }
        viewer = v;
        $('#pmCtrl').querySelector('.pm-seg').addEventListener('click', (e) => {
          const btn = e.target.closest('button[data-s]');
          if (!btn) return;
          $('#pmCtrl').querySelectorAll('.pm-seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === btn)));
          v.setStage(+btn.dataset.s);
        });
      }).catch(() => { state.textContent = t('pm.nowebgl'); });
    } else if (kind === 'play') {
      media.innerHTML = `
        <div class="pm-poster">${p.image ? `<img src="${esc(p.image)}" alt="">` : ''}<button class="btn btn-primary" type="button" id="pmPlay">${esc(t('pm.play', { title: p.title }))}</button></div>`;
      $('#pmPlay').addEventListener('click', () => {
        const sandbox = p.play.startsWith('/') ? '' : 'sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-forms allow-downloads"';
        if (p.fit) {
          // Games with a fixed-size layout: render at the design size, then scale to fill the popup.
          const [fw, fh] = p.fit;
          media.innerHTML = `<iframe class="pm-fit" src="${esc(p.play)}" title="${esc(p.title)}" width="${fw}" height="${fh}" allow="fullscreen; gamepad; autoplay; clipboard-write" ${sandbox}></iframe>`;
          const fr = media.querySelector('iframe');
          fr.style.width = `${fw}px`;
          fr.style.height = `${fh}px`;
          const place = () => {
            const k = Math.min(media.clientWidth / fw, media.clientHeight / fh);
            fr.style.transform = `scale(${k})`;
            fr.style.left = `${(media.clientWidth - fw * k) / 2}px`;
            fr.style.top = `${(media.clientHeight - fh * k) / 2}px`;
          };
          fitObs = new ResizeObserver(place);
          fitObs.observe(media);
          place();
        } else {
          media.innerHTML = `<iframe src="${esc(p.play)}" title="${esc(p.title)}" allow="fullscreen; gamepad; autoplay; clipboard-write" ${sandbox}></iframe>`;
        }
        const gf = media.querySelector('iframe');
        gf.focus();
        if (p.play.startsWith('/')) {
          // the game owns the keyboard once focused, so pass Escape back to the popup
          gf.addEventListener('load', () => { try { gf.contentWindow.addEventListener('keydown', (e) => { if (e.key === 'Escape') dlg.close(); }); } catch { /* cross-origin */ } });
        }
      });
    } else if (kind === 'video') {
      if (isLocalVideo(p.video)) mountVideo(p);
      else media.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${ytId(p.video)}" title="${esc(p.title)}" allow="fullscreen; picture-in-picture"></iframe>`;
    } else if (kind === 'shots') {
      const sh = p.shots;
      media.innerHTML = `<div class="pm-shots"><img class="pm-shot-main" src="${esc(sh[0])}" alt="${esc(p.title)} screenshot 1"><div class="pm-thumbs">${sh.map((u, i) => `<button type="button" data-i="${i}" aria-label="Screenshot ${i + 1}" aria-pressed="${i === 0}"><img src="${esc(u)}" alt="" loading="lazy"></button>`).join('')}</div></div>`;
      media.querySelector('.pm-thumbs').addEventListener('click', (e) => {
        const b = e.target.closest('button[data-i]');
        if (!b) return;
        media.querySelector('.pm-shot-main').src = sh[+b.dataset.i];
        media.querySelectorAll('.pm-thumbs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      });
    } else {
      showImage(p);
    }
  }

  let viewList = [];
  function fillInfo(p) {
    $('#pmType').textContent = [typeLabel(p), p.year, p.role].filter(Boolean).join(' · ');
    const links = [...(p.links || [])];
    if (p.play) links.unshift({ label: t('pm.full'), href: p.play });
    $('#pmLinks').innerHTML = links.map((l) => `<a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('');
    const views = [];
    if (p.model) views.push(['model', t('view.3d')]);
    if (p.play) views.push(['play', t('view.play')]);
    if (p.video && (ytId(p.video) || isLocalVideo(p.video))) views.push(['video', t('view.video')]);
    if (p.shots && p.shots.length) views.push(['shots', t('view.shots')]);
    else if (p.image && !p.play && !p.video) views.push(['image', t('view.image')]);
    if (!views.length) views.push(['image', t('view.image')]);
    viewList = views;
    tabs.hidden = views.length < 2;
    tabs.innerHTML = views.map(([v, l]) => `<button type="button" role="tab" data-v="${v}" aria-selected="${v === currentView}">${esc(l)}</button>`).join('');
  }
  function open(i, from) {
    const p = list[i];
    if (!p) return;
    current = p;
    currentView = null;
    opener = from || document.activeElement;
    $('#pmTitle').textContent = p.title;
    $('#pmText').textContent = p.text || '';
    $('#pmTags').innerHTML = (p.tags || []).map((x) => `<li>${esc(x)}</li>`).join('');
    fillInfo(p);
    document.documentElement.classList.add('modal-open');
    if (!dlg.open) dlg.showModal();
    showView(p, viewList[0][0]);
  }
  api.open = open;
  tabs.addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b && current) showView(current, b.dataset.v); });
  queue.addEventListener('click', (e) => { const b = e.target.closest('button.card[data-i]'); if (b) open(+b.dataset.i, b); });
  $('#pmClose').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => {
    clearMedia();
    current = null;
    document.documentElement.classList.remove('modal-open');
    if (opener && opener.isConnected) opener.focus();
  });

  window.addEventListener('langchange', () => {
    heading();
    renderTools();
    renderFilters();
    render(false);
    if (current && dlg.open) {
      fillInfo(current);
      // Keep the 3D viewer running; only refresh the translated labels around it.
      if (currentView !== 'model') showView(current, currentView);
      else {
        const seg = $('#pmCtrl .pm-seg'); if (seg) seg.querySelectorAll('button').forEach((x) => { x.textContent = t(STAGE_KEYS[+x.dataset.s]); });
      }
    }
  });
  return api;
}
