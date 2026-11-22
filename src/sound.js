// SOUND EFFECTS. Everything is synthesised with the Web Audio API: no audio files, no licences.
// There is no background music. Sound effects are ON by default; browsers only allow audio after the visitor's first click, tap or key press.
// The speaker button in the header mutes and unmutes the sound effects, and the choice is remembered.
const root = document.documentElement;
let ac = null, master, comp, sfx, rvbSend, dlySend, noiseBuf;
const MAKEUP = 4.2; // make-up gain after the compressor
const MASTER = 1.1; // overall level
const SFX_LEVEL = 0.56; // sound-effects bus (0.7 before, now 20% lower)
const flag = (k) => { try { return localStorage.getItem(k) !== 'off'; } catch { return true; } };
const st = { on: flag('sfx'), sfx: flag('sfx'), running: false };

/* ---------- audio graph: dry buses + a shared reverb and echo ---------- */
function ensure() {
  if (ac) return;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  comp = ac.createDynamicsCompressor(); comp.threshold.value = -26; comp.knee.value = 18; comp.ratio.value = 3; comp.attack.value = 0.015; comp.release.value = 0.3;
  const makeup = ac.createGain(); makeup.gain.value = MAKEUP;
  const limiter = ac.createDynamicsCompressor(); limiter.threshold.value = -4; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.002; limiter.release.value = 0.12;
  master = ac.createGain(); master.gain.value = 0; master.connect(comp); comp.connect(makeup); makeup.connect(limiter); const trim = ac.createGain(); trim.gain.value = 0.9; limiter.connect(trim); trim.connect(ac.destination); // trim keeps limiter overshoots below full scale
  sfx = ac.createGain(); sfx.gain.value = SFX_LEVEL; sfx.connect(master);
  // generated reverb: a 3 second decaying noise tail
  const len = Math.floor(ac.sampleRate * 3), ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  const conv = ac.createConvolver(); conv.buffer = ir;
  rvbSend = ac.createGain(); rvbSend.gain.value = 1; rvbSend.connect(conv);
  const rvbOut = ac.createGain(); rvbOut.gain.value = 0.55; conv.connect(rvbOut); rvbOut.connect(master);
  // soft echo
  const dly = ac.createDelay(1); dly.delayTime.value = 0.42; const fb = ac.createGain(); fb.gain.value = 0.38; const dlp = ac.createBiquadFilter(); dlp.type = 'lowpass'; dlp.frequency.value = 2200;
  dlySend = ac.createGain(); dlySend.gain.value = 1; dlySend.connect(dly); dly.connect(dlp); dlp.connect(fb); fb.connect(dly); dlp.connect(rvbSend);
  const dOut = ac.createGain(); dOut.gain.value = 0.4; dlp.connect(dOut); dOut.connect(master);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
}
const now = () => ac.currentTime;
const live = () => st.on && st.running && ac;
// connect a node to a bus and optionally to the reverb / echo
function route(node, bus, rv = 0, dl = 0) {
  node.connect(bus);
  if (rv) { const g = ac.createGain(); g.gain.value = rv; node.connect(g); g.connect(rvbSend); }
  if (dl) { const g = ac.createGain(); g.gain.value = dl; node.connect(g); g.connect(dlySend); }
}
function voice(type, f0, f1, dur, gain, bus, rv = 0, dl = 0, at = 0.006) {
  const t = now(), o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); route(g, bus, rv, dl); o.start(t); o.stop(t + dur + 0.05);
}
function noiseBurst(f0, f1, dur, gain, q, rv = 0, pan = 0, type = 'bandpass') {
  const t = now(), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), p = ac.createStereoPanner();
  s.buffer = noiseBuf; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  p.pan.setValueAtTime(pan, t); p.pan.linearRampToValueAtTime(-pan, t + dur);
  s.connect(f); f.connect(g); g.connect(p); route(p, sfx, rv); s.start(t); s.stop(t + dur + 0.05);
}

/* ---------- sound effects (chosen): click = Bubble pop, name scatter = Bubble burst, section change = Soft whoosh. No hover sound, no loading-screen sound. ---------- */
const chime = (f, g = 0.05) => { voice('sine', f, f, 2.2, g, sfx, 0.9, 0.35, 0.01); voice('sine', f * 2.01, f * 2.01, 1.1, g * 0.35, sfx, 0.9); };
const SFX = {
  // Bubble pop: a quick rising, playful pop
  click: () => { voice('sine', 420, 980, 0.07, 0.09, sfx, 0.35); voice('sine', 1180, 1180, 0.05, 0.02, sfx); },
  // Bubble burst: a quick spray of tiny pops
  scatter: () => { for (let i = 0; i < 9; i++) setTimeout(() => { if (!ac) return; const f = 500 + Math.random() * 1200; voice('sine', f, f * 1.5, 0.07, 0.05, sfx, 0.4); }, i * 28); },
  // Soft whoosh: an airy sweep with a low rise
  section: (a = 1) => { noiseBurst(180, 3200, 0.9, 0.2 * a, 0.8, 0.6, -0.7); voice('sine', 70, 190, 0.9, 0.05 * a, sfx, 0.3, 0, 0.3); },
};
// nothing plays while the starting loading screen is up
const fire = (kind, arg) => { if (!live() || !st.sfx || root.classList.contains('fx-loading')) return; SFX[kind](arg); };

/* ---------- speaker button: mute / unmute the sound effects ---------- */
const ICON_ON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const btn = document.createElement('button');
btn.type = 'button'; btn.className = 'tool-btn fx-snd';
const tools = document.querySelector('.tools');
if (tools) tools.insertBefore(btn, tools.firstChild); else document.body.appendChild(btn);
function syncUi() {
  btn.innerHTML = st.sfx ? ICON_ON : ICON_OFF;
  btn.setAttribute('aria-pressed', String(st.sfx));
  btn.setAttribute('aria-label', st.sfx ? 'Sound effects on, click to mute' : 'Sound effects off, click to unmute');
  btn.title = st.sfx ? 'Mute sound effects' : 'Unmute sound effects';
}
// try to start; resolves true when the browser lets us make sound
async function wake() {
  ensure();
  if (ac.state === 'suspended') { try { await ac.resume(); } catch { /* needs a gesture */ } }
  st.running = ac.state === 'running';
  if (st.running && st.sfx) { master.gain.cancelScheduledValues(now()); master.gain.setTargetAtTime(MASTER, now(), 0.15); }
  syncUi(); return st.running;
}
function applyMaster() {
  st.on = st.sfx;
  if (!ac) return;
  master.gain.cancelScheduledValues(now()); master.gain.setTargetAtTime(st.on && st.running ? MASTER : 0, now(), 0.2);
}
function setSfx(v) {
  st.sfx = v; try { localStorage.setItem('sfx', v ? 'on' : 'off'); } catch { /* storage blocked */ }
  applyMaster();
  if (v) { if (st.running) chime(784, 0.04); else wake().then((ok) => { if (ok) chime(784, 0.04); }); }
  syncUi();
}
btn.addEventListener('click', (e) => { e.stopPropagation(); setSfx(!st.sfx); });
// the first click, tap or key press anywhere unlocks audio (browser rule)
const unlock = () => { if (st.sfx) wake(); if (st.running) { ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => removeEventListener(ev, unlock, true)); } };
['pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, unlock, true));
if (st.sfx) wake(); // works at once if the browser already trusts the page
syncUi();

/* ---------- triggers ---------- */
document.addEventListener('click', (e) => { if (live() && e.target.closest && e.target.closest('a,button,.card,[role=button]') && !e.target.closest('.fx-snd')) fire('click'); }, true);
let lastSection = 0;
const sectionSound = (a) => { const n = performance.now(); if (n - lastSection < 1400) return; lastSection = n; fire('section', a); };
addEventListener('fx:transition', () => sectionSound(1));
addEventListener('fx:scatter', () => fire('scatter'));
let lastStage = root.dataset.stage;
new MutationObserver(() => { if (root.dataset.stage !== lastStage) { lastStage = root.dataset.stage; sectionSound(0.55); } }).observe(root, { attributes: true, attributeFilter: ['data-stage'] });
let lastY = scrollY, lastW = 0;
addEventListener('scroll', () => { const d = Math.abs(scrollY - lastY); lastY = scrollY; const n = performance.now(); if (live() && d > 70 && n - lastW > 900) { lastW = n; sectionSound(0.35); } }, { passive: true });
