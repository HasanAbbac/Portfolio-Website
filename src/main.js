import './style.css';
import './effects.css';
import './effects.js';
import './sound.js';
import './loader.js';
import { CONTENT } from './content.js';
import { initUI } from './ui.js';
import { setLang, initialLang, LANG_MENU } from './i18n.js';
import { initTheme, getTheme } from './theme.js';
import { initPalette } from './palette.js';
import { initChat } from './chat.js';
import { initPromo } from './promo.js';

const canvas = document.getElementById('stage');
const gizmo = document.getElementById('gizmo');

let stage = null;
// Skills and Projects: keep the avatar exactly midway between the left menu and the text column (desktop only).
function centerAvatar() {
  if (!stage || !stage.setLayoutX) return;
  const W = window.innerWidth;
  const nav = document.getElementById('nav'), sk = document.querySelector('.skills-head'), pj = document.querySelector('.proj-head');
  if (W < 1100 || document.documentElement.classList.contains('rtl') || !nav || !sk || !pj) { stage.setLayoutX(null); return; }
  const navRight = nav.getBoundingClientRect().right;
  const frac = (textLeft) => ((navRight + textLeft) / 2 - W / 2) / (W / 2); // the stage measures x as a fraction of half the screen width
  stage.setLayoutX({ 2: frac(sk.getBoundingClientRect().left), 3: frac(pj.getBoundingClientRect().left) });
}
// The 3D stage (Three.js) is loaded as its own chunk after the first paint, so the text and navigation appear immediately.
async function startStage() {
  try {
    const { createStage } = await import('./stage.js');
    stage = createStage(canvas);
    stage.setTheme(getTheme());
    stage.resize();
    centerAvatar();
    setTimeout(centerAvatar, 1200); // again once fonts and images have settled the layout
  } catch (err) {
    console.warn('WebGL unavailable, showing the page without the 3D stage.', err);
    document.documentElement.classList.add('no-webgl');
  }
}

// language first, so everything builds in the right language
const sel = document.getElementById('langSel');
sel.innerHTML = LANG_MENU.map((l) => `<option value="${l.code}" lang="${l.code}">${l.name}</option>`).join('');
setLang(initialLang(), false);
sel.value = document.documentElement.lang;
const ui = initUI(CONTENT);
const theme = initTheme(() => stage);
// The promo popup, the quick menu (K) and the AI chat are not needed for the first paint, so they are set up when the browser is idle
// (at most about a second later). This keeps the first load responsive.
const whenIdle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 300));
whenIdle(() => {
  const promo = initPromo();
  initPalette({ content: CONTENT, ui, theme, promo });
  initChat({ ui });
});
sel.addEventListener('change', () => setLang(sel.value));
window.addEventListener('langchange', (e) => { sel.value = e.detail; ui.measure(); });
// layout can shift when text length changes
window.addEventListener('langchange', () => setTimeout(() => ui.measure(), 120));

const mouse = { x: 0, y: 0 };
window.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
}, { passive: true });
window.addEventListener('resize', () => { if (stage) { stage.resize(); centerAvatar(); } });
window.addEventListener('langchange', () => setTimeout(centerAvatar, 150));

// Pointer handling for dragging the avatar. Ignore presses that land on UI.
const UI_SEL = 'a,button,input,textarea,select,label,dialog,.props,.node,.card,.export,.dope,.graph,.pipe,.top,.skills-head,.proj-head,.exp-head,.col,.queue,.pf';
let dragged = false; // true while a drag on the avatar is happening, so letting go does not also count as a click

// Drag the avatar sideways to turn it around its vertical axis; it eases back to its default rotation when released.
let orbiting = null; // pointer id of the active drag
let dragStartX = 0;
window.addEventListener('pointerdown', (e) => {
  if (!stage || orbiting !== null || (e.pointerType === 'mouse' && e.button !== 0) || e.target.closest(UI_SEL)) return;
  if (stage.orbitStart(e.clientX, e.clientY)) { orbiting = e.pointerId; dragStartX = e.clientX; dragged = false; }
});
window.addEventListener('pointermove', (e) => {
  if (orbiting !== e.pointerId) return;
  if (!dragged && Math.abs(e.clientX - dragStartX) > 4) { dragged = true; document.documentElement.classList.add('avatar-drag'); }
  if (dragged) stage.orbitMove(e.clientX);
});
const endOrbit = (e) => {
  if (orbiting !== e.pointerId) return;
  orbiting = null;
  document.documentElement.classList.remove('avatar-drag');
  if (stage) stage.orbitEnd();
  if (e.type === 'pointercancel') dragged = false;
  else setTimeout(() => { dragged = false; }, 0); // the click event fires right after pointerup: skip it, then reset
};
window.addEventListener('pointerup', endOrbit);
window.addEventListener('pointercancel', endOrbit);
window.addEventListener('blur', () => { if (orbiting !== null) endOrbit({ pointerId: orbiting, type: 'pointercancel' }); });
let hoverT = 0;
window.addEventListener('pointermove', (e) => {
  const n = performance.now();
  if (!stage || n - hoverT < 60) return;
  hoverT = n;
  const over = !e.target.closest(UI_SEL) && stage.pick(e.clientX, e.clientY);
  document.documentElement.classList.toggle('avatar-hover', over);
}, { passive: true });

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const idx = ui.getIdx();
  ui.tick(dt, idx);
  // the 3D scene sleeps while the promo video plays, so the video gets the whole GPU
  if (stage && !document.documentElement.classList.contains('promo-open')) {
    stage.update(dt, now / 1000, idx, mouse, ui.timelinePose());
    stage.drawGizmo(gizmo);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// start the 3D stage right after the first paint
// On phones the heavy 3D setup waits until the browser is idle (or the visitor touches the page), so reading and scrolling are not blocked.
requestAnimationFrame(() => setTimeout(() => {
  if (!window.matchMedia('(max-width: 860px)').matches) return startStage();
  let started = false;
  const go = () => { if (started) return; started = true; startStage(); };
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
  window.addEventListener('pointerdown', go, { once: true, passive: true });
  window.addEventListener('scroll', go, { once: true, passive: true });
  idle(go, { timeout: 4500 });
}, 0));
