// RENDER-PROGRESS LOADING SCREEN. The page "renders" in tiles like Blender's Cycles, with a progress bar
// and a "Sampling 64/128" counter. It finishes when the page, fonts and 3D scene have had time to load.
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAMPLES = 128, TW = 40, COLS = 16, ROWS = 9, W = COLS * TW, H = ROWS * TW;
const Q = 2; // render at double resolution so the avatar and text stay sharp on big and high-density screens
const col = (n) => getComputedStyle(root).getPropertyValue(n).trim();

function buildBg() {
  const c = document.createElement('canvas'); c.width = W * Q; c.height = H * Q; const x = c.getContext('2d'); x.scale(Q, Q);
  const sky = x.createLinearGradient(0, 0, 0, H * 0.62); sky.addColorStop(0, '#173343'); sky.addColorStop(1, '#0f1d26');
  x.fillStyle = sky; x.fillRect(0, 0, W, H);
  const hz = H * 0.62; x.fillStyle = '#0c1a23'; x.fillRect(0, hz, W, H - hz);
  x.lineWidth = 1; x.strokeStyle = '#2d5766';
  for (let i = -12; i <= 12; i++) { x.beginPath(); x.moveTo(W / 2 + i * 14, hz); x.lineTo(W / 2 + i * 120, H); x.stroke(); }
  for (let k = 1; k < 8; k++) { const y = hz + (H - hz) * Math.pow(k / 8, 1.8); x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
  x.strokeStyle = '#b3414d'; x.beginPath(); x.moveTo(0, hz + (H - hz) * 0.36); x.lineTo(W, hz + (H - hz) * 0.36); x.stroke();
  x.strokeStyle = '#6fae48'; x.beginPath(); x.moveTo(W / 2, hz); x.lineTo(W / 2 - 14, H); x.stroke();
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

// the real avatar, rendered live with Three.js into its own transparent canvas (same file the site uses, so the browser reuses the download)
async function loadAvatar() {
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');
  const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
  const draco = new DRACOLoader().setDecoderPath('/draco/');
  const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync('/models/avatar-hero.glb?v=4'); draco.dispose(); // keep the ?v= number in step with AVATAR_URL in stage.js
  const model = gltf.scene;
  model.traverse((o) => {
    if (o.name === 'Avatar_Wire') o.visible = false;
    if (o.isSkinnedMesh) { o.frustumCulled = false; const m = o.material; if (m.roughnessMap) { m.metalnessMap = null; m.metalness = 0; } else { m.roughness = 0.72; m.metalness = 0; } }
  });
  const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
  const scene = new THREE.Scene(), pivot = new THREE.Group(); model.position.sub(ctr); pivot.add(model); scene.add(pivot);
  scene.add(new THREE.HemisphereLight(0xcfe6f0, 0x0f1d26, 0.9));
  const key = new THREE.DirectionalLight(0xfff4ea, 2.6); key.position.set(2.5, 3, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff9f7e, 2.6); rim.position.set(-3, 2, -2.5); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x8ab8ff, 0.8); fill.position.set(-3, 0.5, 3); scene.add(fill);
  const cam = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
  cam.position.set(0, 0, (size.y * 1.1) / 2 / Math.tan((16 * Math.PI) / 180));
  const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(W * Q, H * Q, false);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
  const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.45; pm.dispose();
  const aniso = r.capabilities.getMaxAnisotropy();
  model.traverse((o) => { if (o.isSkinnedMesh && o.material) [o.material.map, o.material.normalMap, o.material.roughnessMap].forEach((t) => { if (t) { t.anisotropy = aniso; t.needsUpdate = true; } }); });
  return {
    canvas: r.domElement,
    update(t) { pivot.rotation.y = Math.sin(t * 0.9) * 0.55; r.render(scene, cam); },
    dispose() { r.dispose(); r.forceContextLoss(); },
  };
}

// tile order: from the middle outward, like Blender's spiral buckets
const ORDER = Array.from({ length: COLS * ROWS }, (_, i) => i).sort((a, b) => {
  const da = Math.hypot((a % COLS) - COLS / 2 + 0.5, Math.floor(a / COLS) - ROWS / 2 + 0.5), db = Math.hypot((b % COLS) - COLS / 2 + 0.5, Math.floor(b / COLS) - ROWS / 2 + 0.5);
  return da - db;
});
const fmt = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return String(m).padStart(2, '0') + ':' + r.toFixed(1).padStart(4, '0'); };

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
  const cv = el.querySelector('canvas'), g = cv.getContext('2d'), bar = el.querySelector('.ll-bar i'), sTxt = el.querySelector('.ll-s'), tTxt = el.querySelector('.ll-t'), meta = el.querySelector('.ll-m'), logEl = el.querySelector('.ll-log');
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
        const age = tilesDone - i;
        if (age < 14 && phase === 'render') { // fresh tiles are still noisy until they are "denoised"
          const n = Math.floor(70 * (1 - age / 14));
          for (let k = 0; k < n; k++) { g.fillStyle = Math.random() < 0.5 ? '#ff9f7e' : '#8ab8ff'; g.globalAlpha = 0.55; g.fillRect(tx + Math.random() * TW, ty + Math.random() * TW, 1.3, 1.3); }
          g.globalAlpha = 1;
        }
      } else { g.strokeStyle = '#183240'; g.lineWidth = 1; g.strokeRect(tx + 0.5, ty + 0.5, TW - 1, TW - 1); }
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
