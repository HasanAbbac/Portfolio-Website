// RENDER-PROGRESS LOADING SCREEN. The page "renders" in tiles like Blender's Cycles, with a progress bar
// and a "Sampling 64/128" counter. It finishes when the page, fonts and 3D scene have had time to load.
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAMPLES = 128, TW = 40, COLS = 16, ROWS = 9, W = COLS * TW, H = ROWS * TW;
const Q = 2; // render at double resolution so the avatar and text stay sharp on big and high-density screens
const col = (n) => getComputedStyle(root).getPropertyValue(n).trim();

function buildBg() {
  const c = document.createElement('canvas'); c.width = W * Q; c.height = H * Q; const x = c.getContext('2d'); x.scale(Q, Q);
  paintSiteBackdrop(x, W, H);
  // wire cube
  x.strokeStyle = '#6f95a3'; x.globalAlpha = 0.5; x.strokeRect(70, 60, 56, 56); x.strokeRect(82, 48, 56, 56); x.beginPath(); x.moveTo(70, 60); x.lineTo(82, 48); x.moveTo(126, 60); x.lineTo(138, 48); x.moveTo(70, 116); x.lineTo(82, 104); x.moveTo(126, 116); x.lineTo(138, 104); x.stroke(); x.globalAlpha = 1;
  x.fillStyle = '#ff9f7e'; x.globalAlpha = 0.9; x.font = '800 54px Unbounded, sans-serif'; x.fillText('Hasan', 40, H - 90); x.fillStyle = '#fff4ea'; x.fillText('Abbasi', 40, H - 36); x.globalAlpha = 1;
  return c;
}
// stand-in drawn until the real 3D avatar has loaded
function drawSilhouette(x) {
  const hz = H * 0.62;
  // the avatar silhouette with a coral rim light
  const ax = W * 0.66, base = hz + (H - hz) * 0.55;
  x.fillStyle = '#1b1c25'; x.strokeStyle = '#ff9f7e'; x.lineWidth = 3;
  x.beginPath(); x.arc(ax, base - 190, 26, 0, 7); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(ax - 44, base - 150); x.quadraticCurveTo(ax - 52, base - 40, ax - 36, base); x.lineTo(ax + 36, base); x.quadraticCurveTo(ax + 52, base - 40, ax + 44, base - 150); x.quadraticCurveTo(ax, base - 172, ax - 44, base - 150); x.closePath(); x.fill(); x.stroke();
}

// The very same avatar the site shows: built by the same loader (avatarGlb.js), in the same idle pose, with the same lights
// reflections and platform as the finished render on the page. Rendered live into its own transparent canvas.
async function loadAvatar() {
  const THREE = await import('three');
  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
  const { loadAvatarGlb } = await import('./avatarGlb.js');
  const { POSES } = await import('./avatar.js');
  // same size and floor level as the 3D stage uses (see stage.js), so the figure matches the page exactly
  const rig = await loadAvatarGlb('/models/avatar-hero.glb?v=6', { height: 2.102, minY: -0.049 }); // keep the ?v= number in step with AVATAR_URL in stage.js
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(W * Q, H * Q, false); r.setClearColor(0x000000, 0);
  const pm = new THREE.PMREMGenerator(r); const envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
  rig.finalMeshes.forEach((m) => { m.material.envMap = envTex; m.material.envMapIntensity = 0.55; m.material.needsUpdate = true; });
  rig.apply(POSES.idle, 0);
  const scene = new THREE.Scene(), pivot = new THREE.Group(); pivot.add(rig.root); scene.add(pivot);
  // the finished-render lights from the stage (hemisphere, key, blue rim, coral fill)
  const hemi = new THREE.HemisphereLight(0xcfe6f0, 0x0f1d26, 0.42);
  const key = new THREE.DirectionalLight(0xfff0e0, 2.7); key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight(0x8ab8ff, 2.2); rim.position.set(-4, 3, -4);
  const fill = new THREE.DirectionalLight(0xff9f7e, 0.9); fill.position.set(-3, -1, 3);
  scene.add(hemi, key, rim, fill);
  // the platform under the feet, same shape and colours as the site's
  const feetY = rig.box.min.y, top = rig.box.max.y;
  const ped = new THREE.Group();
  const pedBody = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.94, 0.1, 56), new THREE.MeshStandardMaterial({ color: 0x21424f, roughness: 0.5, metalness: 0.35 })); pedBody.position.y = -0.05;
  const pedRing = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.012, 8, 96), new THREE.MeshBasicMaterial({ color: 0xff9f7e, transparent: true, opacity: 0.95 })); pedRing.rotation.x = Math.PI / 2;
  ped.add(pedBody, pedRing); ped.position.y = feetY; scene.add(ped);
  // framed so the whole figure AND its platform fit inside the frame, with the figure about 70% of the frame height
  const cam = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
  const midY = (feetY - 0.12 + top) / 2, span = top - feetY + 0.12;
  cam.position.set(0, midY + 0.45, (span / 2) / Math.tan((16 * Math.PI) / 180) * 1.27); cam.lookAt(0, midY, 0);
  return {
    canvas: r.domElement,
    update(t) { pivot.rotation.y = Math.sin(t * 0.9) * 0.45; r.render(scene, cam); },
    dispose() { rig.dispose && rig.dispose(); r.dispose(); r.forceContextLoss(); },
  };
}

// tile order: from the middle outward, like Blender's spiral buckets
const ORDER = Array.from({ length: COLS * ROWS }, (_, i) => i).sort((a, b) => {
  const da = Math.hypot((a % COLS) - COLS / 2 + 0.5, Math.floor(a / COLS) - ROWS / 2 + 0.5), db = Math.hypot((b % COLS) - COLS / 2 + 0.5, Math.floor(b / COLS) - ROWS / 2 + 0.5);
  return da - db;
});
const fmt = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return String(m).padStart(2, '0') + ':' + r.toFixed(1).padStart(4, '0'); };

// The website's own background, painted into a w x h area, using the page's exact values:
//  - the .backdrop of the page (base colour, the coral and blue glows, the vignette), and
//  - the 3D floor grid from stage.js: the same Blender-style grid (0.5 and 2.5 unit cells, the same alphas and fade), seen from the same
//    camera as the home section (fov 32, 7.4 units back, 0.55 up, floor under the avatar's feet), with the red X axis and the green Y axis.
function paintSiteBackdrop(c, w, h) {
  const ell = (cx, cy, rx, ry, stops) => { // an elliptical radial gradient, like CSS radial-gradient(rx ry at cx cy, ...)
    c.save(); c.translate(cx, cy); c.scale(rx, ry);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); stops.forEach(([o, colr]) => g.addColorStop(o, colr));
    c.fillStyle = g; c.fillRect(-cx / rx, -cy / ry, w / rx, h / ry); c.restore();
  };
  c.fillStyle = col('--bg') || '#0f1d26'; c.fillRect(0, 0, w, h);
  ell(w * 0.78, h * 0.38, w * 0.6, w * 0.45, [[0, 'rgba(255,159,126,0.09)'], [0.62, 'rgba(255,159,126,0)']]);
  ell(w * 0.1, h, w * 0.7, w * 0.6, [[0, 'rgba(138,184,255,0.07)'], [0.6, 'rgba(138,184,255,0)']]);
  const vig = (col('--vig-rgb') || '5, 14, 20');
  ell(w * 0.5, h * 0.4, w * 1.2, h * 0.9, [[0, `rgba(${vig},0)`], [0.55, `rgba(${vig},0)`], [1, `rgba(${vig},0.62)`]]);

  // the floor: project world-space grid lines through the home-section camera
  const ink = col('--stage-ink') || '#b4d2de', tanH = Math.tan((16 * Math.PI) / 180), asp = w / h;
  const CY = 0.55, CZ = 7.4, fl = Math.hypot(CY, CZ), fy = -CY / fl, fz = -CZ / fl, uy = -fz, uz = fy; // camera at (0, .55, 7.4) looking at the origin
  const FLOOR = -1.055, FADE_X = 2.07;                                                                  // the floor level under the avatar, and where the grid fade is centred
  const proj = (x, z) => { const vy = FLOOR - CY, vz = z - CZ, zc = vy * fy + vz * fz; if (zc < 0.05) return null; return [((x / zc) / (tanH * asp) + 1) / 2 * w, (1 - ((vy * uy + vz * uz) / zc) / tanH) / 2 * h]; };
  const fade = (x, z) => { const t = Math.min(1, Math.max(0, (Math.hypot(x - FADE_X, z) - 40) / (9 - 40))); return t * t * (3 - 2 * t); }; // smoothstep(40, 9, distance), as in the shader
  const seg = (x0, z0, x1, z1, alpha) => { const a = proj(x0, z0), b = proj(x1, z1); if (!a || !b) return; c.globalAlpha = alpha; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); };
  const isMajor = (v) => Math.abs(v / 2.5 - Math.round(v / 2.5)) < 1e-6;
  const R = 40;
  c.strokeStyle = ink; c.lineWidth = 1.1;
  for (let k = -R * 2; k <= 14; k++) { const z = k * 0.5, al = 0.24 + (isMajor(z) ? 0.42 : 0); for (let x = -R; x < R; x++) { const f = fade(x + 0.5, z); if (f > 0.01) seg(x, z, x + 1, z, al * f); } }
  for (let k = -R * 2; k <= R * 2; k++) { const x = k * 0.5, al = 0.24 + (isMajor(x) ? 0.42 : 0); for (let z = -R; z < 7; z++) { const f = fade(x, z + 0.5); if (f > 0.01) seg(x, z, x, z + 1, al * f); } }
  c.lineWidth = 1.2; c.strokeStyle = 'rgb(235,64,77)'; for (let x = -R; x < R; x++) { const f = fade(x + 0.5, 0); if (f > 0.01) seg(x, 0, x + 1, 0, 0.8 * f); }
  c.strokeStyle = 'rgb(128,199,26)'; for (let z = -R; z < 7; z++) { const f = fade(0, z + 0.5); if (f > 0.01) seg(0, z, 0, z + 1, 0.8 * f); }
  c.globalAlpha = 1;
}

let running = false;
function show() {
  if (running) return; running = true;
  root.classList.add('fx-loading');
  const el = document.createElement('div'); el.className = 'fx-load'; el.setAttribute('role', 'status'); el.setAttribute('aria-label', 'Loading portfolio');
  el.innerHTML = `<div class="ll-win"><div class="ll-head"><i></i><span>Render &middot; Hasan Abbasi</span><b>Cycles</b><button type="button" class="ll-skip">Skip</button></div>
    <canvas class="ll-cv" width="${W * Q}" height="${H * Q}"></canvas>
    <div class="ll-bar"><i></i></div>
    <div class="ll-txt"><span class="ll-s">Sampling 0/${SAMPLES}</span><span class="ll-t">00:00.0</span></div>
    <ul class="ll-log" aria-hidden="true"></ul>
    <div class="ll-meta"><span class="ll-m">Frame 1 &middot; Cycles</span></div></div>`;
  document.body.appendChild(el);
  const cv = el.querySelector('.ll-cv'), g = cv.getContext('2d'), bar = el.querySelector('.ll-bar i'), sTxt = el.querySelector('.ll-s'), tTxt = el.querySelector('.ll-t'), meta = el.querySelector('.ll-m'), logEl = el.querySelector('.ll-log');
  const bgImg = buildBg(), scene = document.createElement('canvas'), t0 = performance.now(); scene.width = W * Q; scene.height = H * Q; const sx = scene.getContext('2d'); sx.scale(Q, Q); sx.imageSmoothingQuality = 'high'; g.scale(Q, Q); g.imageSmoothingQuality = 'high'; let av = null, gone = false, avDone = false;
  // phones skip the 3D avatar here (the stage already waits for idle time there), so the first load stays light
  const heavy = !matchMedia('(max-width: 860px)').matches;
  if (!heavy) avDone = true;
  else loadAvatar().then((a) => { avDone = true; logLine('Avatar model loaded (avatar-hero.glb)'); if (gone) a.dispose(); else av = a; }).catch(() => { avDone = true; logLine('Avatar model not available, using stand-in'); });
  const composite = (t) => { sx.drawImage(bgImg, 0, 0, W, H); if (av) { av.update(t); sx.drawImage(av.canvas, 150, 0, W, H); } else drawSilhouette(sx); }; let p = 0, ready = false, phase = 'render', phaseT = 0, skip = false;
  const MIN = 4.4, MAX = 10; // about 7 seconds in total with the denoise, finish and iris steps
  const logLine = (msg) => { const li = document.createElement('li'); li.textContent = `${fmt((performance.now() - t0) / 1000)}  ${msg}`; logEl.appendChild(li); while (logEl.children.length > 4) logEl.firstChild.remove(); };
  logLine('Render started, device: your browser');
  const fontsP = (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => logLine('Fonts loaded'));
  const loadP = (document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true }))).then(() => logLine('Page assets loaded'));
  Promise.all([fontsP, loadP]).then(() => { ready = true; });
  const onKey = (e) => { if (e.key === 'Escape') skip = true; };
  addEventListener('keydown', onKey); el.querySelector('.ll-skip').addEventListener('click', () => { skip = true; });

  function draw(tilesDone) {
    g.fillStyle = '#0a1820'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < ORDER.length; i++) {
      const t = ORDER[i], tx = (t % COLS) * TW, ty = Math.floor(t / COLS) * TW;
      if (i < tilesDone) {
        g.drawImage(scene, tx * Q, ty * Q, TW * Q, TW * Q, tx, ty, TW, TW);
      } else { g.strokeStyle = '#183240'; g.lineWidth = 1; g.strokeRect(tx + 0.5, ty + 0.5, TW - 1, TW - 1); } // a solid dark block until its tile is rendered
    }
    if (tilesDone < ORDER.length && phase === 'render') { // the bucket that is being rendered right now
      const t = ORDER[tilesDone], tx = (t % COLS) * TW, ty = Math.floor(t / COLS) * TW;
      g.strokeStyle = col('--orange') || '#ff9f7e'; g.lineWidth = 2; g.strokeRect(tx + 1, ty + 1, TW - 2, TW - 2);
    }
  }
  let last = performance.now();
  function frame(nowMs) {
    const dt = Math.max(0, Math.min(0.05, (nowMs - last) / 1000)); last = nowMs;
    const el_s = Math.max(0, (nowMs - t0) / 1000); // the first frame's timestamp can be slightly earlier than t0
    composite(el_s);
    if (phase === 'render') {
      const target = (ready && avDone && el_s >= MIN) || el_s >= MAX || skip ? 1 : Math.min(0.93, 0.93 * Math.pow(Math.min(1, el_s / (MIN - 0.4)), 0.9));
      p += (target - p) * Math.min(1, dt * (target === 1 ? 7 : 4)); if (!Number.isFinite(p)) p = 0; if (target === 1 && p > 0.995) p = 1;
      const s = Math.min(SAMPLES, Math.round(p * SAMPLES));
      sTxt.textContent = `Sampling ${s}/${SAMPLES}`; tTxt.textContent = fmt(el_s); bar.style.transform = `scaleX(${p})`;
      draw(Math.floor(p * ORDER.length));
      if (p >= 1) { phase = 'denoise'; phaseT = nowMs; sTxt.textContent = 'Denoising...'; meta.textContent = 'Frame 1 · OpenImageDenoise'; logLine('Denoising final image'); }
    } else if (phase === 'denoise') {
      draw(ORDER.length);
      if (nowMs - phaseT > 700) { phase = 'done'; phaseT = nowMs; sTxt.textContent = 'Render finished'; meta.textContent = 'Frame 1 · saved'; logLine('Render finished, opening the site'); }
    } else if (phase === 'done') {
      if (nowMs - phaseT > 600) { phase = 'out'; phaseT = nowMs; el.classList.add('out'); root.classList.remove('fx-loading'); }
    } else if (nowMs - phaseT > 850) { removeEventListener('keydown', onKey); gone = true; if (av) av.dispose(); el.remove(); running = false; return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (reduce) root.classList.remove('fx-loading');
else if (root.classList.contains('fx-loading')) show();
