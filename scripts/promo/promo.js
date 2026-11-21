import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const FPS = 30;
export const OFFSET = 2.5; // seconds of cold open before the build starts
export const DUR = 54.5;
const MAIN = 52; // length of the main part
const W = 1920, H = 1080;

/* ------------------------------------------------------------------ helpers */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const E = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  expo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  lin: (t) => t,
};
const p = (t, a, d, e = E.out) => e(clamp((t - a) / d));
const lerp = (a, b, k) => a + (b - a) * k;
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, cls, parent, html = '', style = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; if (style) e.style.cssText = style; if (parent) parent.appendChild(e); return e; };
const put = (el, o = 1, x = 0, y = 0, s = 1, extra = '') => { el.style.opacity = o; el.style.visibility = o <= 0.002 ? 'hidden' : 'visible'; el.style.transform = `translate(${x}px, ${y}px) scale(${s}) ${extra}`; };
const ui = $('#ui');

/* ------------------------------------------------------------------ 3D */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;
scene.background = (() => { const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; const x = c.getContext('2d'); const g = x.createRadialGradient(1498, 432, 0, 1498, 432, 1200); g.addColorStop(0, '#1a3a4a'); g.addColorStop(0.6, '#0f1d26'); g.addColorStop(1, '#0a141b'); x.fillStyle = g; x.fillRect(0, 0, 1920, 1080); const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex; })();
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
const hemi = new THREE.HemisphereLight(0xcfe6f0, 0x0f1d26, 0.7);
const key = new THREE.DirectionalLight(0xfff0e0, 1.9); key.position.set(3, 5, 4);
const rim = new THREE.DirectionalLight(0x8ab8ff, 2.2); rim.position.set(-4, 3, -4);
const fill = new THREE.DirectionalLight(0xff9f7e, 1.0); fill.position.set(-3, -1, 3);
scene.add(hemi, key, rim, fill);

// Blender-style floor, as on the site
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  uniforms: { uCenter: { value: new THREE.Vector3(1.85, 0, 0) }, uInk: { value: new THREE.Color(0.56, 0.7, 0.75) }, uAlpha: { value: 1 } },
  vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: `varying vec3 vW; uniform vec3 uCenter; uniform float uAlpha; uniform vec3 uInk;
    float grid(vec2 p, float s){ vec2 q = p / s; vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q); return 1.0 - min(min(g.x, g.y), 1.0); }
    float line(float v){ return 1.0 - min(abs(v) / fwidth(v), 1.0); }
    void main(){ vec2 p = vW.xz; float fade = smoothstep(18.0, 1.5, length(p - uCenter.xz));
      float a = (grid(p, 0.5) * 0.13 + grid(p, 2.5) * 0.22) * fade; vec3 col = uInk;
      float ax = line(p.y) * fade; float az = line(p.x) * fade;
      col = mix(col, vec3(0.92, 0.25, 0.3), ax); col = mix(col, vec3(0.5, 0.78, 0.1), az);
      a = max(a, max(ax, az) * 0.55); gl_FragColor = vec4(col, a * uAlpha); }`,
}));
floor.rotation.x = -Math.PI / 2; floor.renderOrder = -2;
scene.add(floor);

// drifting dust and wire primitives behind everything
const dustN = 900, dpos = new Float32Array(dustN * 3), dcol = new Float32Array(dustN * 3);
for (let i = 0; i < dustN; i++) {
  dpos.set([(Math.random() - 0.5) * 22, Math.random() * 7 - 0.5, (Math.random() - 0.5) * 14 - 2], i * 3);
  const c = Math.random() > 0.78 ? [1, 0.62, 0.48] : [0.5, 0.72, 1]; dcol.set(c, i * 3);
}
const dgeo = new THREE.BufferGeometry();
dgeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
dgeo.setAttribute('color', new THREE.BufferAttribute(dcol, 3));
const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const dust = new THREE.Points(dgeo, new THREE.PointsMaterial({ size: 0.06, map: dotTex, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(dust);
const floaters = [];
const fMat = new THREE.LineBasicMaterial({ color: 0x6f95a3, transparent: true, opacity: 0.3 });
[[new THREE.BoxGeometry(0.8, 0.8, 0.8), -5.4, 2.4, -3.5], [new THREE.TorusGeometry(0.5, 0.18, 8, 14), 5.9, 0.9, -4], [new THREE.ConeGeometry(0.5, 1, 6), -4.6, 0.6, -2.5], [new THREE.IcosahedronGeometry(0.55, 0), 5.4, 3.3, -5], [new THREE.OctahedronGeometry(0.5, 0), -1.2, 3.6, -6]].forEach(([g, x, y, z], i) => {
  const m = new THREE.LineSegments(new THREE.EdgesGeometry(g), fMat); m.position.set(x, y, z); m.userData.s = [0.12 + i * 0.03, 0.18 + i * 0.02]; scene.add(m); floaters.push(m);
});

const MODEL_X = 1.85;
const stageG = new THREE.Group(); stageG.position.x = MODEL_X; scene.add(stageG);
const pedMat = new THREE.MeshStandardMaterial({ color: 0x21424f, roughness: 0.5, metalness: 0.35 });
const pedestal = new THREE.Group();
const pedBody = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.52, 0.1, 64), pedMat); pedBody.position.y = -0.05;
const pedRing = new THREE.Mesh(new THREE.TorusGeometry(1.47, 0.012, 8, 120), new THREE.MeshBasicMaterial({ color: 0xff9f7e, transparent: true, opacity: 0.95 })); pedRing.rotation.x = Math.PI / 2;
pedestal.add(pedBody, pedRing); stageG.add(pedestal);
const shadow = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(0,0,0,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.005; return m; })();
stageG.add(shadow);
const scanMat = new THREE.MeshBasicMaterial({ color: 0xff9f7e, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
const scanRing = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.012, 6, 96), scanMat); scanRing.rotation.x = Math.PI / 2; stageG.add(scanRing);
const scanRing2 = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.012, 6, 96), new THREE.MeshBasicMaterial({ color: 0x8ab8ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); scanRing2.rotation.x = Math.PI / 2; stageG.add(scanRing2);

const draco = new DRACOLoader(); draco.setDecoderPath('/public/draco/');
const gltf = new GLTFLoader(); gltf.setDRACOLoader(draco);
const MODELS = {
  bot: { file: 'helper-bot.glb', fit: 'max', size: 2.9 },
  chess: { file: 'chess.glb', fit: 'max', size: 3.2 },
  eau: { file: 'eau-da-parfum.glb', fit: 'h', size: 3.0 },
  mac: { file: 'macbook-air.glb', fit: 'max', size: 3.5 },
  obsidian: { file: 'raw-obsidian.glb', fit: 'max', size: 3.2 },
  ball: { file: 'basketball.glb', fit: 'max', size: 2.5 },
  girl: { file: 'fyp-character.glb', fit: 'h', size: 3.5 },
};
const models = {};
async function loadModels() {
  await Promise.all(Object.entries(MODELS).map(async ([k, cfg]) => {
    const g = await gltf.loadAsync(`/public/models/${cfg.file}`);
    const obj = g.scene;
    obj.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(obj); const size = box.getSize(new THREE.Vector3());
    const s = cfg.size / (cfg.fit === 'h' ? size.y : Math.max(size.x, size.y, size.z));
    obj.scale.multiplyScalar(s); obj.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(obj);
    const c = box.getCenter(new THREE.Vector3());
    obj.position.set(-c.x, -box.min.y, -c.z);
    const holder = new THREE.Group(); holder.add(obj); holder.visible = false; stageG.add(holder);
    holder.updateMatrixWorld(true);
    const height = box.max.y - box.min.y;
    const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);
    // the exported bottle has plain white shells; give them the look of the Blender render (amber glass and liquid)
    if (k === 'eau') obj.traverse((m) => {
      if (!m.isMesh) return;
      const n = m.material.name;
      if (n === 'Outer') m.material = new THREE.MeshPhysicalMaterial({ color: 0xffd08a, emissive: 0x4a2c08, emissiveIntensity: 0.55, transmission: 0.72, thickness: 0.12, roughness: 0.03, ior: 1.45, attenuationColor: new THREE.Color(0xe2a64a), attenuationDistance: 2.6, side: THREE.FrontSide, envMapIntensity: 2.0, specularIntensity: 1 });
      if (n === 'Inner') m.material = new THREE.MeshPhysicalMaterial({ color: 0xf0b45a, emissive: 0xb8741a, emissiveIntensity: 0.6, transmission: 0.85, thickness: 0.5, roughness: 0.08, ior: 1.33, attenuationColor: new THREE.Color(0xd9953a), attenuationDistance: 1.2 });
      m.material.name = n;
    });
    obj.traverse((m) => { if (m.isMesh) { [].concat(m.material).forEach((mt) => { mt.clippingPlanes = [plane]; mt.needsUpdate = true; }); } });
    models[k] = { holder, obj, height, plane, radius: Math.max(size.x, size.z) * s * 0.5 };
  }));
}

// the helper bot also exists as points and as a wireframe, for the Vertices -> Wireframe -> Material build
const PT_VERT = `uniform float uForm; uniform float uTime; uniform float uScale; attribute vec3 aScatter; attribute float aRand; varying float vRand;
  #include <clipping_planes_pars_vertex>
  void main(){ float f = smoothstep(0.0, 1.0, clamp(uForm * 1.7 - aRand * 0.7, 0.0, 1.0)); vec3 p = mix(aScatter, position, f);
    p += (1.0 - f) * 0.2 * vec3(sin(uTime * 1.3 + aRand * 40.0), cos(uTime * 1.1 + aRand * 31.0), sin(uTime * 0.9 + aRand * 17.0));
    p += f * 0.01 * vec3(sin(uTime * 2.0 + aRand * 60.0), cos(uTime * 2.3 + aRand * 50.0), sin(uTime * 1.7 + aRand * 21.0));
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition; gl_PointSize = 0.035 * uScale * (0.55 + aRand * 0.9) / -mvPosition.z; vRand = aRand;
    #include <clipping_planes_vertex>
  }`;
const PT_FRAG = `varying float vRand;
  #include <clipping_planes_pars_fragment>
  void main(){
    #include <clipping_planes_fragment>
   
    vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; float a = smoothstep(0.5, 0.05, d);
    vec3 col = mix(vec3(0.38, 0.6, 1.0), vec3(1.0, 0.56, 0.42), step(0.7, vRand)); gl_FragColor = vec4(col, a * 0.95); }`;
const girlRig = { bones: {}, rest: {} };
function prepGirl() {
  const m = models.girl; m.holder.updateMatrixWorld(true);
  m.obj.traverse((o) => { if (o.isBone) { girlRig.bones[o.name] = o; girlRig.rest[o.name] = o.quaternion.clone(); } });
}
const _q = new THREE.Quaternion(), _r = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _ax = new THREE.Vector3();
const Z = [0, 0, 1];
// Forward kinematics: turn a bone by a list of rotations about the world axes, on top of wherever its parent has moved it,
// so forearm, hand and fingers inherit the movement of the shoulder and elbow like a real arm.
function rel(name, ops) {
  const b = girlRig.bones[name]; if (!b) return;
  b.parent.updateWorldMatrix(true, false);
  b.parent.getWorldQuaternion(_pq);
  _r.identity();
  for (const [axis, deg] of ops) { _q.setFromAxisAngle(_ax.set(...axis), (deg * Math.PI) / 180); _r.premultiply(_q); }
  // local = parentWorld^-1 * R * parentWorld * restLocal
  b.quaternion.copy(_pq.clone().invert().multiply(_r).multiply(_pq).multiply(girlRig.rest[name]));
  b.updateMatrixWorld(true);
}
export const GIRL = { arm: 64 };
function poseGirl() {
  // a relaxed standing pose: both arms down at her sides (the model's rest pose is a T-pose), no animation
  models.girl.holder.updateMatrixWorld(true);
  rel('UpperArmL', [[Z, -GIRL.arm]]);
  rel('UpperArmR', [[Z, GIRL.arm]]);
  rel('ForearmL', [[Z, -4]]);
  rel('ForearmR', [[Z, 4]]);
}
const botParts = { pts: null, ptsPlane: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), wireLo: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), wireHi: new THREE.Plane(new THREE.Vector3(0, -1, 0), 100), wire: null };
function buildBotLayers() {
  const m = models.bot; const meshes = [];
  m.holder.updateMatrixWorld(true);
  m.obj.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const COUNT = 16000; const target = new Float32Array(COUNT * 3); const scatter = new Float32Array(COUNT * 3); const rand = new Float32Array(COUNT);
  const samplers = meshes.map((o) => { const s = new MeshSurfaceSampler(o).build(); const tri = (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; return { o, s, tri }; });
  const totalTri = samplers.reduce((a, b) => a + b.tri, 0);
  const v = new THREE.Vector3(); const tmp = new THREE.Vector3(); let i = 0;
  for (const { o, s, tri } of samplers) {
    const n = Math.round((tri / totalTri) * COUNT);
    for (let k = 0; k < n && i < COUNT; k++, i++) { s.sample(v); v.applyMatrix4(o.matrixWorld); v.x -= MODEL_X; target.set([v.x, v.y, v.z], i * 3); }
  }
  for (; i < COUNT; i++) target.copyWithin(i * 3, 0, 3);
  for (let j = 0; j < COUNT; j++) { tmp.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(2.4 + Math.random() * 4.5); tmp.y += 1.6; scatter.set([tmp.x, tmp.y, tmp.z], j * 3); rand[j] = Math.random(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(target, 3)); g.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3)); g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  const mat = new THREE.ShaderMaterial({ vertexShader: PT_VERT, fragmentShader: PT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, clipping: true, clippingPlanes: [botParts.ptsPlane], uniforms: { uForm: { value: 0 }, uTime: { value: 0 }, uScale: { value: (H) / (2 * Math.tan((camera.fov * Math.PI) / 360)) } } });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false;
  // positions are in the holder's space already (world, relative to the stage group), so the points are not rotated with the bot: they are rotated by their own holder
  const ptHolder = new THREE.Group(); ptHolder.add(pts); stageG.add(ptHolder);
  botParts.pts = pts; botParts.ptHolder = ptHolder; botParts.mat = mat;
  const wireMat = new THREE.LineBasicMaterial({ color: 0xff9f7e, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, clippingPlanes: [botParts.wireLo, botParts.wireHi] });
  meshes.forEach((o) => { const w = new THREE.LineSegments(new THREE.WireframeGeometry(o.geometry), wireMat); o.add(w); });
  botParts.wireMat = wireMat;
}

/* ------------------------------------------------------------------ DOM: HUD */
const hud = h('div', 'abs', ui, '', 'inset:0');
const top = h('div', 'abs', hud, '', 'left:90px;right:90px;top:46px;height:44px;display:flex;justify-content:space-between;align-items:center');
h('div', '', top, '<svg viewBox="0 0 32 32" width="34" height="34"><path d="M16 4l10 5.8v12.4L16 28 6 22.2V9.8z" fill="none" stroke="#ff9f7e" stroke-width="2"/><path d="M16 4v12m0 0l10 6.2M16 16L6 22.2" fill="none" stroke="#ff9f7e" stroke-width="1.5"/></svg><span>Hasan Abbasi</span>', "display:flex;align-items:center;gap:14px;font:500 22px 'Unbounded',sans-serif");
const clock = h('div', 'mono', top, '', 'font-size:19px;color:#8fb2bf');
const pipe = h('div', 'abs', hud, '', 'left:90px;right:90px;bottom:44px;height:64px;border-radius:999px;background:rgba(12,28,38,.86);border:1px solid rgba(185,212,222,.22);display:flex;align-items:center;padding:0 26px');
const STEPS = ['Vertices', 'Wireframe', 'Material', 'Render', 'Animation', 'Export'];
const stepEls = STEPS.map((n, i) => h('div', 'mono', pipe, `<b style="display:grid;place-items:center;width:38px;height:38px;border-radius:50%;font:500 16px 'DM Mono';letter-spacing:0">0${i + 1}</b><span>${n}</span>`, "flex:1;display:flex;align-items:center;gap:12px;font-size:17px;letter-spacing:.18em;color:#8fb2bf"));
const pipeFill = h('div', 'abs', pipe, '', 'left:26px;bottom:0;height:3px;background:#ff9f7e;border-radius:3px;width:0');
function stepOf(t) { return t < 2.7 ? 0 : t < 5.2 ? 1 : t < 14 ? 2 : t < 24 ? 3 : t < 42 ? 4 : 5; }

/* ------------------------------------------------------------------ DOM: scenes */
const S = (a, b) => ({ a, b, el: h('div', 'sc', ui) });
const s0 = S(-OFFSET, 0), s1 = S(0, 8), s2 = S(8, 14), s3 = S(14, 24), s4 = S(24, 36), s5 = S(36, 42), s6 = S(42, MAIN);
const scenes = [s0, s1, s2, s3, s4, s5, s6];

const eyebrow = (parent, text, x, y) => h('div', 'mono coral', parent, text, `left:${x}px;top:${y}px;position:absolute;font-size:24px`);
function kinetic(parent, text, size, x, y, cls = 'disp', color = '') {
  const line = h('div', 'mask ' + cls, parent, '', `position:absolute;left:${x}px;top:${y}px;font-size:${size}px;white-space:nowrap;${color ? 'color:' + color + ';text-shadow:0 0 60px rgba(255,159,126,.28)' : ''}`);
  const spans = [...text].map((c) => h('span', '', line, c === ' ' ? '&nbsp;' : c));
  return { line, spans };
}
function revealK(k, t, start, step = 0.035, dur = 0.55) { k.spans.forEach((s, i) => { const q = p(t, start + i * step, dur, E.out); s.style.transform = `translateY(${(1 - q) * 150}%)`; s.style.visibility = q <= 0.001 ? 'hidden' : 'visible'; }); }

// S0: cold open
const s0a = kinetic(s0.el, 'Every 3D model', 104, 0, 380); const s0b = kinetic(s0.el, 'starts as a point.', 104, 0, 510, 'disp', '#ff9f7e');
[s0a, s0b].forEach((k) => { k.line.style.width = '1920px'; k.line.style.textAlign = 'center'; k.line.style.left = '0'; });
const s0dot = h('div', '', s0.el, '', 'position:absolute;left:944px;top:700px;width:32px;height:32px;border-radius:50%;background:#8ab8ff;box-shadow:0 0 40px 10px rgba(138,184,255,.55)');
const s0lab = h('div', 'mono blue', s0.el, 'Hasan Abbasi &middot; portfolio', 'position:absolute;left:0;width:1920px;text-align:center;top:260px;font-size:24px');

// S1: title block
const s1tag = h('div', 'mono blue', s1.el, '3D artist &middot; animator &middot; game developer', 'position:absolute;left:120px;top:300px;font-size:26px');
const s1a = kinetic(s1.el, 'Hasan', 210, 112, 350);
const s1b = kinetic(s1.el, 'Abbasi', 210, 112, 560, 'disp', '#ff9f7e');
const s1sub = h('div', '', s1.el, 'I model and animate 3D characters and worlds,<br>then build them into games in Unity and Unreal Engine.', "position:absolute;left:124px;top:800px;font-size:32px;line-height:1.45;color:#b9d4de;font-weight:400");
const s1meta = h('div', 'mono', s1.el, 'BS Computer Science &middot; Gaming and Animation &middot; NED University', 'position:absolute;left:124px;top:930px;font-size:19px;color:#8fb2bf');
const s1big = h('div', 'mono coral', s1.el, '', 'position:absolute;left:120px;top:210px;font-size:24px');

// S2: node graph
const s2eb = eyebrow(s2.el, '03 &middot; Material', 120, 150);
const s2h = kinetic(s2.el, 'Skills, wired together', 76, 112, 195);
const GROUPS = [
  { name: '3D', items: ['Blender'], x: 120, y: 360, w: 500 },
  { name: 'Game engines', items: ['Unity', 'Unreal Engine', 'VR Development'], x: 120, y: 500, w: 500 },
  { name: 'Programming and tools', items: ['C++', 'C#', 'Python', 'JavaScript', 'HTML', 'Three.js', 'MySQL', 'Git and GitHub'], x: 120, y: 700, w: 640 },
];
const gEls = GROUPS.map((g) => {
  const card = h('div', '', s2.el, `<div class="mono" style="padding:12px 22px;background:#21424f;border-radius:22px 22px 0 0;font-size:17px;color:#8fb2bf"><i style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff9f7e;margin-right:12px"></i>${g.name}</div>`, `position:absolute;left:${g.x}px;top:${g.y}px;width:${g.w}px;background:#183240;border-radius:22px;box-shadow:0 12px 0 rgba(0,0,0,.18);border:1px solid rgba(185,212,222,.18)`);
  const body = h('div', '', card, '', 'padding:16px 20px 18px;display:flex;flex-wrap:wrap;gap:10px');
  const chips = g.items.map((n) => h('span', 'chip', body, n));
  return { card, chips, g };
});
const outNode = h('div', '', s2.el, '<div class="mono" style="padding:12px 22px;background:#21424f;border-radius:22px 22px 0 0;font-size:17px;color:#8fb2bf">Material output</div><div style="padding:22px;display:grid;gap:16px"><div style="display:flex;align-items:center;gap:14px;font-size:26px"><i style="width:18px;height:18px;border-radius:50%;background:#8fe8d0"></i>Surface</div><div style="display:flex;align-items:center;gap:14px;font-size:26px"><i style="width:18px;height:18px;border-radius:50%;background:#8ab8ff"></i>Volume</div><div style="display:flex;align-items:center;gap:14px;font-size:26px"><i style="width:18px;height:18px;border-radius:50%;background:#ff9f7e"></i>Displacement</div></div>', 'position:absolute;left:1340px;top:520px;width:430px;background:#183240;border-radius:22px;box-shadow:0 12px 0 rgba(0,0,0,.18);border:1px solid rgba(185,212,222,.18)');
const svgNS = 'http://www.w3.org/2000/svg';
const wires = h('div', '', s2.el, '', 'position:absolute;inset:0;pointer-events:none');
const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('width', W); svg.setAttribute('height', H); wires.appendChild(svg);
const wirePaths = GROUPS.map((g, i) => {
  const x1 = g.x + g.w, y1 = g.y + 48, x2 = 1340, y2 = 520 + 100 + i * 46;
  const path = document.createElementNS(svgNS, 'path'); path.setAttribute('d', `M ${x1} ${y1} C ${x1 + 260} ${y1}, ${x2 - 260} ${y2}, ${x2} ${y2}`);
  path.setAttribute('fill', 'none'); path.setAttribute('stroke', ['#8fe8d0', '#8ab8ff', '#ff9f7e'][i]); path.setAttribute('stroke-width', '4'); path.setAttribute('stroke-linecap', 'round'); svg.appendChild(path);
  path.__len = path.getTotalLength(); path.setAttribute('stroke-dasharray', path.__len); return path;
});

// a Blender-style material preview ball that comes to life as the skills are wired in
const prevBox = h('div', '', s2.el, '', 'position:absolute;left:1440px;top:130px;width:290px;height:340px');
const prevRing = h('div', '', prevBox, '', 'position:absolute;left:-14px;top:-14px;width:318px;height:318px;border-radius:50%;border:2px dashed rgba(138,184,255,.45)');
const prevBall = h('div', '', prevBox, '', 'position:absolute;left:0;top:0;width:290px;height:290px;border-radius:50%;box-shadow:0 34px 60px rgba(0,0,0,.45), inset -26px -34px 60px rgba(0,0,0,.45)');
h('div', 'mono', prevBox, 'Material preview', 'position:absolute;left:0;width:290px;top:312px;text-align:center;font-size:17px;color:#8fb2bf');

// S3: models
// Three models, each shown as a Cycles turntable rendered from the original .blend file (scripts/promo/turntable.py).
// baseK = how many picture rows the base ellipse reaches above the lowest point (so the model stands on the pedestal); the centre column and lowest row of every frame come from meta.json (ttmeta.py); ped = pedestal size, frames = length of the sequence.
const MODEL_ITEMS = [
  { key: 'chess', dir: 'chess', a: 14, dur: 4, frames: 120, baseK: 55, ped: 1.35, zoom: 1.08, title: 'Chess Set', tags: ['Blender', 'Geometry Nodes', 'Cycles'], text: 'Chess board and pieces built with procedural geometry nodes.' },
  { key: 'eau', dir: 'eau', a: 18, dur: 3, frames: 90, baseK: 48, ped: 1.0, zoom: 1.0, title: 'Eau de Parfum', tags: ['Blender', 'Glass', 'Cycles'], text: 'Glass perfume bottle with a gold cap, built for refraction and studio lighting.' },
  { key: 'mac', dir: 'mac', a: 21, dur: 3, frames: 90, baseK: 63, ped: 1.2, zoom: 1.08, title: 'MacBook Air', tags: ['Blender', 'Hard surface', 'Product'], text: 'Laptop model built from 50 separate parts with metal and normal-map materials.' },
];
const mItems = MODEL_ITEMS.map((m, i) => {
  const root = h('div', '', s3.el, '', 'position:absolute;inset:0;display:none');
  const eb = eyebrow(root, '04 &middot; Render', 120, 210);
  const num = h('div', 'mono', root, `${String(i + 1).padStart(2, '0')} <span style="color:#8fb2bf">/ 03</span>`, 'position:absolute;left:120px;top:262px;font-size:26px;color:#fff4ea');
  const title = kinetic(root, m.title, m.title.length > 12 ? 84 : 100, 112, 330);
  const desc = h('div', '', root, m.text, 'position:absolute;left:124px;top:480px;width:760px;font-size:32px;line-height:1.5;color:#b9d4de');
  const tags = h('div', '', root, '', 'position:absolute;left:124px;top:660px;display:flex;gap:12px;flex-wrap:wrap;width:800px');
  const tagEls = m.tags.map((x, k) => h('span', 'chip' + (k === 0 ? ' c' : ''), tags, x));
  const badge = h('div', 'mono', root, 'Rendered in Blender (Cycles)', 'position:absolute;left:124px;top:780px;font-size:19px;color:#8fb2bf');
  return { m, root, eb, num, title, desc, tagEls, badge, a: m.a };
});

// the turntable picture sits under the text of S3 and above the 3D pedestal
const ttImg = document.createElement('img'); ttImg.style.cssText = 'position:absolute;left:0;top:0;width:1200px;height:1200px;display:none;will-change:transform';
s3.el.insertBefore(ttImg, s3.el.firstChild);
const ttScan = h('div', '', s3.el, '', 'position:absolute;height:3px;width:760px;background:linear-gradient(90deg,rgba(255,159,126,0),#ff9f7e,rgba(255,159,126,0));box-shadow:0 0 28px 6px rgba(255,159,126,.55);display:none');
const TT_PX = 300; // the renders were made at 300 px per scene unit
const ttMeta = {};
const _v3 = new THREE.Vector3();

// S4: gameplay
const VIDEO_PATH = { rage: '/clips/Rage Station.mp4', car: '/clips/Ultimate Car Racing.mp4' };
export const CLIPS = { rage: { start: 66, aspect: 1918 / 880 }, car: { start: 26, aspect: 1920 / 1164 } };
function videoWindow(parent, src, label, aspect) {
  const wh = Math.round(1160 / aspect) + 56; const wt = Math.round(120 + (800 - wh) / 2);
  const win = h('div', '', parent, '', `position:absolute;left:110px;top:${wt}px;width:1160px;height:${wh}px;border-radius:26px;overflow:hidden;background:#183240;border:1px solid rgba(185,212,222,.2);box-shadow:0 30px 80px rgba(0,0,0,.45), 0 14px 0 rgba(0,0,0,.2)`);
  h('div', 'mono', win, `<i style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#ff9f7e;margin-right:10px"></i><i style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#8ab8ff;margin-right:10px"></i><i style="display:inline-block;width:13px;height:13px;border-radius:50%;background:#8fe8d0;margin-right:22px"></i>${label}<span style="margin-left:auto;color:#ff9f7e">&#9679; Gameplay capture</span>`, 'height:56px;padding:0 24px;display:flex;align-items:center;font-size:17px;background:#21424f;color:#cfe0e6');
  const box = h('div', '', win, '', 'position:absolute;left:0;right:0;top:56px;bottom:0;overflow:hidden;background:#000');
  const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = src; v.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 50%';
  box.appendChild(v);
  return { win, v };
}
function infoColumn(parent, title, tag, text, chips) {
  const root = h('div', '', parent, '', 'position:absolute;left:1330px;top:150px;width:500px');
  const eb = h('div', 'mono coral', root, '05 &middot; Animation', 'font-size:22px;margin-bottom:26px');
  const t = h('div', 'disp', root, title, 'font-size:60px;line-height:1.08;margin-bottom:22px');
  const tg = h('div', 'mono blue', root, tag, 'font-size:21px;margin-bottom:26px');
  const d = h('div', '', root, text, 'font-size:28px;line-height:1.5;color:#b9d4de;margin-bottom:34px');
  const cs = h('div', '', root, '', 'display:flex;gap:10px;flex-wrap:wrap');
  const chipEls = chips.map((x, k) => h('span', 'chip' + (k === 0 ? ' c' : ''), cs, x));
  return { root, parts: [eb, t, tg, d, cs], chipEls };
}
const rageRoot = h('div', '', s4.el, '', 'position:absolute;inset:0;display:none');
const rageV = videoWindow(rageRoot, VIDEO_PATH.rage, 'Rage Station &middot; gameplay', CLIPS.rage.aspect);
const rageInfo = infoColumn(rageRoot, 'Rage Station', 'Unity &middot; VR &middot; Game', 'A rage room in space, built in Unity for VR. Pick up weapons, smash barrels and use the in-game music player.', ['Unity', 'VR', 'Game']);
const carRoot = h('div', '', s4.el, '', 'position:absolute;inset:0;display:none');
const carV = videoWindow(carRoot, VIDEO_PATH.car, 'Ultimate Car Racing &middot; gameplay', CLIPS.car.aspect);
const carInfo = infoColumn(carRoot, 'Ultimate Car Racing', 'Unreal Engine &middot; Racing &middot; Game', 'A 7-car, 3-lap racing game in Unreal Engine with live position, lap counter, speedometer and a track minimap.', ['Unreal Engine', 'Racing', 'Game']);
const gamesRoot = h('div', '', s4.el, '', 'position:absolute;inset:0;display:none');
const gEb = eyebrow(gamesRoot, '05 &middot; Animation', 120, 150);
const gH = kinetic(gamesRoot, 'Playable in the browser', 72, 112, 195);
function gameCard(x, img, title, tag, text) {
  const c = h('div', '', gamesRoot, `<div style="height:410px;background:#000 url(${img}) center/cover"></div><div style="padding:22px 28px 26px"><div class="disp" style="font-size:38px;margin-bottom:10px">${title}</div><div class="mono blue" style="font-size:18px;margin-bottom:12px">${tag}</div><div style="font-size:24px;line-height:1.45;color:#b9d4de">${text}</div></div>`, `position:absolute;left:${x}px;top:340px;width:790px;border-radius:26px;overflow:hidden;background:#183240;border:1px solid rgba(185,212,222,.2);box-shadow:0 30px 80px rgba(0,0,0,.4), 0 14px 0 rgba(0,0,0,.2)`);
  return c;
}
const gc1 = gameCard(120, '/public/projects/neon-collector.jpg', 'Neon Collector', 'Three.js &middot; JavaScript &middot; Game', 'Steer a robot, collect 35 coins in 90 seconds, dodge drones.');
const gc2 = gameCard(1010, '/public/projects/3d-target-clicker.jpg', '3D Target Clicker', 'Three.js &middot; Raycasting &middot; Game', 'Click 3D shapes before they vanish. Rarer shapes score more.');

// S5: character and achievements
const s5eb = eyebrow(s5.el, '05 &middot; Animation', 120, 170);
const s5t = kinetic(s5.el, 'FYP Character', 92, 112, 225);
const s5d = h('div', '', s5.el, 'Rigged stylised toon character with hand-painted textures.', 'position:absolute;left:124px;top:360px;width:800px;font-size:32px;line-height:1.5;color:#b9d4de');
// the real certificates (first page of each PDF in public/certs), shown as a fanned stack in the same frame as the character
const certLab1 = h('div', 'mono coral', s5.el, 'Certificates', 'position:absolute;left:124px;top:478px;font-size:22px');
const certLab2 = h('div', 'mono', s5.el, 'Google AI Professional Certificate &middot; Coursera, June 2026', 'position:absolute;left:124px;top:512px;font-size:17px;color:#b9d4de');
const certLab3 = h('div', 'mono', s5.el, 'Plus CEGA game development courses &middot; BS Computer Science, NED University', 'position:absolute;left:124px;top:538px;font-size:15px;color:#8fb2bf');
const CERTS = [
  { src: '/scripts/promo/assets/cert-ai-app-building.png', x: 440, y: 596, w: 300, rot: 9 },
  { src: '/scripts/promo/assets/cert-ai-fundamentals.png', x: 360, y: 586, w: 300, rot: 5 },
  { src: '/scripts/promo/assets/cert-google-ai.png', x: 124, y: 574, w: 470, rot: -1.5 },
];
const certEls = CERTS.map((c) => { const i = document.createElement('img'); i.src = c.src; i.style.cssText = `position:absolute;left:${c.x}px;top:${c.y}px;width:${c.w}px;border-radius:10px;box-shadow:0 26px 60px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.12)`; s5.el.appendChild(i); return i; });

// S6: outro
const logo = h('div', '', s6.el, '<svg viewBox="0 0 32 32" width="150" height="150" style="overflow:visible"><path id="lg1" d="M16 4l10 5.8v12.4L16 28 6 22.2V9.8z" fill="none" stroke="#ff9f7e" stroke-width="1.4" stroke-linejoin="round"/><path id="lg2" d="M16 4v12m0 0l10 6.2M16 16L6 22.2" fill="none" stroke="#ff9f7e" stroke-width="1"/></svg>', 'position:absolute;left:885px;top:190px');
const o1 = kinetic(s6.el, "Let's make", 150, 0, 360);
const o2 = kinetic(s6.el, 'something.', 150, 0, 520, 'disp', '#ff9f7e');
[o1, o2].forEach((k) => { k.line.style.width = '1920px'; k.line.style.textAlign = 'center'; k.line.style.left = '0'; });
const oSub = h('div', '', s6.el, 'Looking to bring 3D art and programming skills to a team building engaging games.', 'position:absolute;left:0;width:1920px;text-align:center;top:735px;font-size:34px;color:#b9d4de');
const oChips = h('div', '', s6.el, '', 'position:absolute;left:0;width:1920px;top:830px;display:flex;justify-content:center;gap:18px');
const oChipEls = ['hasan.x.abbasi@gmail.com', 'github.com/HasanAbbac', 'linkedin.com/in/hasan-abbac'].map((x, i) => h('span', 'chip' + (i === 0 ? ' c' : ''), oChips, x));
oChips.querySelectorAll('.chip').forEach((c) => { c.style.fontSize = '27px'; c.style.padding = '12px 26px'; });

// end card (inside the last scene)
const endCard = h('div', '', s6.el, '', 'position:absolute;inset:0');
const endLogo = h('div', '', endCard, '<svg viewBox="0 0 32 32" width="190" height="190" style="overflow:visible"><path d="M16 4l10 5.8v12.4L16 28 6 22.2V9.8z" fill="none" stroke="#ff9f7e" stroke-width="1.4" stroke-linejoin="round"/><path d="M16 4v12m0 0l10 6.2M16 16L6 22.2" fill="none" stroke="#ff9f7e" stroke-width="1"/></svg>', 'position:absolute;left:865px;top:220px');
const endName = kinetic(endCard, 'Hasan Abbasi', 118, 0, 470); endName.line.style.width = '1920px'; endName.line.style.textAlign = 'center'; endName.line.style.left = '0';
const endTag = h('div', 'mono blue', endCard, '3D artist &middot; animator &middot; game developer', 'position:absolute;left:0;width:1920px;text-align:center;top:660px;font-size:28px');
const endThanks = h('div', 'mono', endCard, 'Thank you for watching', 'position:absolute;left:0;width:1920px;text-align:center;top:760px;font-size:22px;color:#8fb2bf');

// colour grade: a warm top light and cool bottom fill over everything, plus a stronger vignette
h('div', '', ui, '', 'position:absolute;inset:0;pointer-events:none;mix-blend-mode:soft-light;background:linear-gradient(180deg, rgba(255,170,130,.18) 0%, rgba(0,0,0,0) 45%, rgba(100,160,255,.2) 100%)');

// film grain (a small noise canvas, scaled up)
const grain = document.createElement('canvas'); grain.width = 480; grain.height = 270; grain.style.cssText = 'position:absolute;inset:0;width:1920px;height:1080px;mix-blend-mode:overlay;opacity:.07;pointer-events:none';
ui.appendChild(grain);
const gctx = grain.getContext('2d'); const gimg = gctx.createImageData(480, 270);
let seed = 1; const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
function drawGrain(n) { seed = Math.floor(n * 4) * 7919 + 13; const d = gimg.data; for (let i = 0; i < d.length; i += 4) { const v = 96 + rnd() * 128; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } gctx.putImageData(gimg, 0, 0); }

// wipes (above everything)
const wipeA = h('div', 'wipe', ui, '', 'position:absolute;top:0;bottom:0;left:0;width:1920px;background:#ff9f7e;transform:translateX(-100%)');
const wipeB = h('div', 'wipe wipe2', ui, '', 'position:absolute;top:0;bottom:0;left:0;width:1920px;background:#12303d;transform:translateX(-100%)');
const fade = h('div', '', ui, '', 'position:absolute;inset:0;background:#080f14;opacity:0');
const CUTS = [0, 8, 14, 18, 21, 24, 28, 32, 36, 42];
function wipe(t) {
  let a = -110, b = -110;
  for (const c of CUTS) {
    const q = (t - (c - 0.28)) / 0.56; if (q > 0 && q < 1) a = q < 0.5 ? -100 + (q / 0.5) * 100 : ((q - 0.5) / 0.5) * 100;
    const q2 = (t - (c - 0.2)) / 0.56; if (q2 > 0 && q2 < 1) b = q2 < 0.5 ? -100 + (q2 / 0.5) * 100 : ((q2 - 0.5) / 0.5) * 100;
  }
  wipeA.style.transform = `translateX(${a}%)`; wipeB.style.transform = `translateX(${b}%)`;
}

/* ------------------------------------------------------------------ frame */
const videoReady = (v, time) => new Promise((res) => {
  if (v.readyState >= 2 && Math.abs(v.currentTime - time) < 0.001) return res();
  let done = false; const fin = () => { if (done) return; done = true; v.removeEventListener('seeked', fin); requestAnimationFrame(() => requestAnimationFrame(res)); };
  v.addEventListener('seeked', fin); v.currentTime = time; setTimeout(fin, 4000);
});

function setSweep(m, prog, ringHeightScale = 1) {
  const b = prog * (m.height + 0.04);
  m.plane.constant = prog >= 0.999 ? 100 : b;
  const on = prog > 0.001 && prog < 0.999;
  scanRing.visible = on; scanRing2.visible = on;
  if (on) { scanRing.position.y = b; scanRing2.position.y = b; const r = m.radius * 1.05 * ringHeightScale; scanRing.scale.setScalar(r / 1.2); scanRing2.scale.setScalar(r / 1.2 * 0.92); scanRing2.position.y = b + 0.03; }
}

async function renderFrame(n) {
  const T = n / FPS; const t = T - OFFSET; // t is time within the main part (negative during the cold open)
  /* scene switching */
  scenes.forEach((s) => { s.el.style.display = t >= s.a && t < s.b ? 'block' : 'none'; });
  const inScene = (s) => t >= s.a && t < s.b;

  /* hud */
  const hudIn = p(t, 0.4, 0.8) * (1 - p(t, 47.6, 0.5));
  hud.style.opacity = hudIn;
  const tc = Math.max(0, t); clock.textContent = `Rendering ${Math.floor(tc / 60)}:${String(Math.floor(tc % 60)).padStart(2, '0')} / 0:${MAIN}`;
  const act = stepOf(t);
  stepEls.forEach((e, i) => { const on = i <= act; e.style.color = i === act ? '#fff' : on ? '#cfe0e6' : '#8fb2bf'; e.style.opacity = i <= act ? 1 : 0.7; const b = e.firstChild; b.style.background = i === act ? '#ff9f7e' : '#25505f'; b.style.color = i === act ? '#2a1608' : '#e7f2f3'; });
  pipeFill.style.width = `${(clamp(t / MAIN)) * (1920 - 180 - 52)}px`;

  /* background motion */
  dust.rotation.y = t * 0.025; dust.position.y = Math.sin(t * 0.4) * 0.1;
  floaters.forEach((m) => { m.rotation.x = t * m.userData.s[0]; m.rotation.y = t * m.userData.s[1]; });
  let camZ = 8.2 + Math.sin(t * 0.18) * 0.12, camX = Math.sin(t * 0.12) * 0.25, camY = 1.9;
  if (t >= 0 && t < 8) camZ = lerp(9.0, 8.0, E.inOut(t / 8));                        // slow push-in on the build
  if (t >= 14 && t < 24) { const k = t < 18 ? 0 : t < 21 ? 1 : 2; const a0 = [14, 18, 21][k], d0 = [4, 3, 3][k]; const lt = (t - a0) / d0; camZ = 8.8 - 0.9 * E.out(lt); camX = (k % 2 ? 1 : -1) * 0.7 * (1 - E.out(lt)); camY = 1.9 + 0.25 * (1 - E.out(lt)); } // each model: a short push-in with a side drift
  if (t >= 36 && t < 42) { camZ = lerp(8.8, 8.0, E.inOut((t - 36) / 6)); camX = lerp(-0.5, 0.3, (t - 36) / 6); }
  if (t >= 42) camZ = lerp(8.3, 8.8, E.inOut(clamp((t - 42) / 10)));
  camera.position.set(camX, camY, camZ); camera.lookAt(0.0, 1.45, 0);
  let fov = 32; for (const hit of [3.1, 8, 14, 24, 36, 42]) if (t >= hit) fov -= 1.4 * Math.exp(-(t - hit) * 7); // a small zoom punch on every big beat
  if (Math.abs(camera.fov - fov) > 1e-4) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.updateMatrixWorld();

  /* models off by default */
  Object.values(models).forEach((m) => { m.holder.visible = false; });
  pedestal.visible = false; shadow.visible = false; scanRing.visible = false; scanRing2.visible = false;
  if (botParts.ptHolder) botParts.ptHolder.visible = false;
  if (botParts.wireMat) botParts.wireMat.visible = false;

  /* ---------------- S0 cold open */
  if (inScene(s0)) {
    put(s0lab, p(T, 0.2, 0.5)); revealK(s0a, T, 0.4, 0.03, 0.5); revealK(s0b, T, 0.85, 0.03, 0.5);
    const pulse = 1 + 0.18 * Math.sin(T * 9);
    put(s0dot, p(T, 1.4, 0.3) * (1 - p(T, 2.35, 0.15)), 0, 0, pulse * (1 + p(T, 2.0, 0.5) * 2));
    s0.el.style.opacity = 1 - p(T, 2.3, 0.2);
  } else s0.el.style.opacity = 1;

  /* ---------------- S1 */
  if (inScene(s1)) {
    const bot = models.bot; const T = botParts.mat;
    bot.holder.visible = true; pedestal.visible = true; shadow.visible = true;
    const rot = -0.7 + t * 0.55; bot.holder.rotation.y = rot; botParts.ptHolder.rotation.y = rot; botParts.ptHolder.visible = true;
    pedestal.scale.set(1, 1, 1); pedRing.material.opacity = p(t, 3.2, 1.2);
    pedestal.visible = t > 3.0; shadow.material.opacity = p(t, 2.6, 2.0) * 0.8;
    T.uniforms.uForm.value = p(t, 0.2, 2.6, E.lin); T.uniforms.uTime.value = t;
    const hh = bot.height + 0.05;
    const b0 = hh * p(t, 2.7, 1.5, E.inOut); const b1 = hh * p(t, 3.7, 1.5, E.inOut);
    botParts.ptsPlane.constant = -b0; botParts.wireLo.constant = -b1; botParts.wireHi.constant = b0; bot.plane.constant = b1 >= hh ? 100 : b1;
    botParts.pts.visible = b0 < hh - 0.001; botParts.wireMat.visible = b1 < hh - 0.001 && b0 > 0.001;
    const sw = (b0 > 0.01 && b0 < hh - 0.01) ? b0 : (b1 > 0.01 && b1 < hh - 0.01) ? b1 : null;
    scanRing.visible = scanRing2.visible = sw !== null;
    if (sw !== null) { scanRing.position.y = sw; scanRing2.position.y = sw + 0.03; scanRing.scale.setScalar(1.0); scanRing2.scale.setScalar(0.9); }
    // text
    put(s1tag, p(t, 3.0, 0.7), 0, (1 - p(t, 3.0, 0.7)) * 24);
    revealK(s1a, t, 3.15, 0.05, 0.6); revealK(s1b, t, 3.45, 0.05, 0.6);
    put(s1sub, p(t, 4.6, 0.8), 0, (1 - p(t, 4.6, 0.8)) * 26);
    put(s1meta, p(t, 5.4, 0.8), 0, (1 - p(t, 5.4, 0.8)) * 16);
    const stage = t < 2.7 ? '01 vertices' : t < 5.2 ? '02 wireframe' : '03 material';
    s1big.textContent = stage;
    put(s1big, p(t, 0.5, 0.6) * (1 - p(t, 7.2, 0.5)));
  }

  /* ---------------- S2 */
  if (inScene(s2)) {
    const lt = t - s2.a;
    put(s2eb, p(lt, 0.3, 0.5)); revealK(s2h, lt, 0.4, 0.03, 0.5);
    gEls.forEach((g, gi) => {
      const st = 0.7 + gi * 0.45; const q = p(lt, st, 0.5, E.back);
      put(g.card, p(lt, st, 0.35), 0, (1 - q) * 40, 1);
      g.chips.forEach((c, ci) => { const qq = p(lt, st + 0.25 + ci * 0.07, 0.35, E.back); put(c, clamp(qq * 1.5), 0, 0, 0.6 + 0.4 * qq); });
    });
    put(outNode, p(lt, 1.6, 0.5), (1 - p(lt, 1.6, 0.5)) * 60, 0);
    const wq = (p(lt, 2.2, 0.9, E.inOut) + p(lt, 2.5, 0.9, E.inOut) + p(lt, 2.8, 0.9, E.inOut)) / 3;
    put(prevBox, p(lt, 1.3, 0.6), 0, (1 - p(lt, 1.3, 0.6)) * 40, lerp(0.9, 1, p(lt, 1.3, 0.6)));
    prevBall.style.background = `radial-gradient(circle at ${34 + 7 * Math.sin(lt * 1.3)}% ${28 + 5 * Math.cos(lt * 1.1)}%, #fff1e8 0%, #ffb391 22%, #ff9f7e 38%, #b4501f 68%, #2f1208 100%)`;
    prevBall.style.filter = `grayscale(${1 - wq}) brightness(${0.75 + 0.25 * wq})`;
    prevRing.style.transform = `rotate(${lt * 24}deg)`;
    wirePaths.forEach((pa, i) => { const q = p(lt, 2.2 + i * 0.3, 0.9, E.inOut); pa.setAttribute('stroke-dashoffset', String(pa.__len * (1 - q))); });
    put(s2.el, 1 - p(lt, 5.5, 0.5));
  }

  /* ---------------- S3 */
  ttImg.style.display = 'none'; ttScan.style.display = 'none';
  if (inScene(s3)) {
    for (const it of mItems) {
      const lt = t - it.a; const on = lt >= 0 && lt < it.m.dur;
      it.root.style.display = on ? 'block' : 'none';
      if (!on) continue;
      put(it.eb, p(lt, 0.15, 0.4)); put(it.num, p(lt, 0.2, 0.4)); revealK(it.title, lt, 0.2, 0.03, 0.45);
      put(it.desc, p(lt, 0.55, 0.45), 0, (1 - p(lt, 0.55, 0.45)) * 20);
      it.tagEls.forEach((c, k) => { const q = p(lt, 0.75 + k * 0.1, 0.35, E.back); put(c, clamp(q * 1.5), 0, 0, 0.7 + 0.3 * q); });
      put(it.badge, p(lt, 1.1, 0.4));
      pedestal.visible = true; shadow.visible = true; pedRing.material.opacity = 0.95; shadow.material.opacity = 0.8; pedestal.scale.setScalar(it.m.ped);
      // place the picture: its centre goes to where the middle of the model would be on the pedestal
      _v3.set(MODEL_X, 0, 0);
      const dist = camera.position.distanceTo(_v3); const ppu = H / (2 * Math.tan((camera.fov * Math.PI) / 360) * dist);
      _v3.project(camera);
      const fr0 = clamp(Math.floor(lt * FPS), 0, it.m.frames - 1); const mt = ttMeta[it.m.dir];
      const sc2 = (ppu / TT_PX) * it.m.zoom;
      // the silhouette is centred on the pedestal and its base stands on it, whatever the turn angle
      const cx = (_v3.x * 0.5 + 0.5) * W - (mt.cx[fr0] - 600) * sc2; const cy = (-_v3.y * 0.5 + 0.5) * H - (mt.rb[fr0] - it.m.baseK - 600) * sc2;
      const fr = clamp(Math.floor(lt * FPS), 0, it.m.frames - 1);
      const url = `/tt/${it.m.dir}/t${String(fr).padStart(4, '0')}.png`;
      if (!ttImg.src.endsWith(url)) { ttImg.src = url; try { await ttImg.decode(); } catch { /* frame missing */ } }
      const q = p(lt, 0.2, 0.7, E.inOut);                     // the model is scanned in from the pedestal upwards
      ttImg.style.display = 'block';
      ttImg.style.transform = `translate(${cx - 600}px, ${cy - 600}px) scale(${sc2}) `; ttImg.style.transformOrigin = '600px 600px';
      ttImg.style.clipPath = `inset(${(1 - q) * 100}% 0 0 0)`;
      const imgTop = cy - 600 * sc2, imgH = 1200 * sc2;
      if (q > 0.005 && q < 0.995) { ttScan.style.display = 'block'; ttScan.style.left = `${cx - 380}px`; ttScan.style.top = `${imgTop + (1 - q) * imgH}px`; }
    }
  }

  /* ---------------- S4 */
  let pendingSeek = null;
  if (inScene(s4)) {
    const lt = t - s4.a;
    const seg = lt < 4 ? 0 : lt < 8 ? 1 : 2; const sl = lt - seg * 4;
    rageRoot.style.display = seg === 0 ? 'block' : 'none'; carRoot.style.display = seg === 1 ? 'block' : 'none'; gamesRoot.style.display = seg === 2 ? 'block' : 'none';
    const vid = (V, info, clip) => {
      put(V.win, p(sl, 0.1, 0.55), 0, (1 - p(sl, 0.1, 0.55)) * 60, lerp(0.95, 1, p(sl, 0.1, 0.55)));
      V.v.style.transform = `scale(${1 + sl * 0.012})`;
      info.parts.forEach((e, i) => put(e, p(sl, 0.3 + i * 0.12, 0.45), (1 - p(sl, 0.3 + i * 0.12, 0.45)) * 50, 0));
      info.chipEls.forEach((c, k) => { const q = p(sl, 0.9 + k * 0.1, 0.35, E.back); put(c, clamp(q * 1.5), 0, 0, 0.7 + 0.3 * q); });
      pendingSeek = [V.v, CLIPS[clip].start + sl];
    };
    if (seg === 0) vid(rageV, rageInfo, 'rage');
    if (seg === 1) vid(carV, carInfo, 'car');
    if (seg === 2) {
      put(gEb, p(sl, 0.15, 0.4)); revealK(gH, sl, 0.2, 0.02, 0.5);
      put(gc1, p(sl, 0.5, 0.5), 0, (1 - p(sl, 0.5, 0.5)) * 70, lerp(0.96, 1, p(sl, 0.5, 0.5)));
      put(gc2, p(sl, 0.75, 0.5), 0, (1 - p(sl, 0.75, 0.5)) * 70, lerp(0.96, 1, p(sl, 0.75, 0.5)));
    }
  }

  /* ---------------- S5 */
  if (inScene(s5)) {
    const lt = t - s5.a; const m = models.girl;
    m.holder.visible = true; pedestal.visible = true; shadow.visible = true; pedRing.material.opacity = 0.95; shadow.material.opacity = 0.8; pedestal.scale.setScalar(1);
    m.holder.rotation.y = -0.2 + lt * 0.1; poseGirl(); setSweep(m, p(lt, 0.2, 0.9, E.inOut));
    put(s5eb, p(lt, 0.2, 0.4)); revealK(s5t, lt, 0.25, 0.03, 0.5); put(s5d, p(lt, 0.7, 0.5), 0, (1 - p(lt, 0.7, 0.5)) * 20);
    put(certLab1, p(lt, 1.0, 0.4)); put(certLab2, p(lt, 1.15, 0.4)); put(certLab3, p(lt, 1.3, 0.4));
    certEls.forEach((e, i) => { const q = p(lt, 1.2 + i * 0.22, 0.7, E.out); const fl = Math.sin(lt * 1.3 + i) * 3; put(e, q, (1 - q) * -120, fl, 1, `rotate(${CERTS[i].rot * q}deg)`); });
  }

  /* ---------------- S6 */
  if (inScene(s6)) {
    const lt = t - s6.a;
    const l1 = $('#lg1', logo), l2 = $('#lg2', logo);
    [l1, l2].forEach((l) => { const len = l.getTotalLength(); l.setAttribute('stroke-dasharray', len); l.setAttribute('stroke-dashoffset', len * (1 - p(lt, 0.2, 1.0, E.inOut))); });
    put(logo, p(lt, 0.1, 0.3), 0, 0, 1 + 0.04 * Math.sin(lt * 2));
    endCard.style.display = 'none';
    revealK(o1, lt, 0.9, 0.04, 0.6); revealK(o2, lt, 1.3, 0.04, 0.6);
    put(oSub, p(lt, 2.4, 0.6), 0, (1 - p(lt, 2.4, 0.6)) * 20);
    oChipEls.forEach((c, k) => { const q = p(lt, 3.0 + k * 0.2, 0.45, E.back); put(c, clamp(q * 1.5), 0, (1 - q) * 30, 1); });
    const ex = p(lt, 5.3, 0.5, E.inOut);
    [logo, o1.line, o2.line, oSub, oChips].forEach((e) => { e.style.opacity = String(Number(e.style.opacity === '' ? 1 : e.style.opacity) * (1 - ex)); });
    endCard.style.display = lt >= 5.2 ? 'block' : 'none';
    put(endLogo, p(lt, 5.6, 0.6), 0, (1 - p(lt, 5.6, 0.6)) * 30);
    revealK(endName, lt, 5.8, 0.035, 0.55); put(endTag, p(lt, 6.4, 0.5), 0, (1 - p(lt, 6.4, 0.5)) * 18); put(endThanks, p(lt, 7.1, 0.5));
  }
  fade.style.opacity = Math.max(p(t, 51.0, 1.0, E.lin), 1 - p(T, 0.0, 0.5, E.lin));
  drawGrain(n);
  wipe(t);

  /* 3D render */
  const hh = 1;
  floor.material.uniforms.uAlpha.value = (inScene(s2) || inScene(s4) || inScene(s6)) ? 0.85 : 1;
  if (pendingSeek) await videoReady(pendingSeek[0], pendingSeek[1]);
  renderer.render(scene, camera);
  return hh;
}

window.renderFrame = renderFrame;
window.PROMO = { FPS, DUR, CLIPS, GIRL, girlRig, videos: { rage: rageV.v, car: carV.v } };
(async () => {
  await loadModels();
  for (const it of MODEL_ITEMS) ttMeta[it.dir] = await (await fetch(`/tt/${it.dir}/meta.json`)).json();
  buildBotLayers();
  prepGirl();
  await Promise.all(certEls.map((i) => i.decode().catch(() => {})));
  await document.fonts.ready;
  await Promise.all([rageV.v, carV.v].map((v) => new Promise((res) => { if (v.readyState >= 1) res(); else v.addEventListener('loadedmetadata', res, { once: true }); setTimeout(res, 8000); })));
  window.__ready = true;
})();
