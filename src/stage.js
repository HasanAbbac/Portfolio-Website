import * as THREE from 'three';
import { buildAvatar, applyPose, POSES, mixPose, sampleSurface } from './avatar.js';

const ramp = (x, a, b) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a, b, t) => a + (b - a) * t;

// Where the avatar sits for each section (fractions of the half-screen), desktop first.
const LAYOUT = {
  x: [0.55, 0.0, -0.64, -0.7, 0.52, -0.56],
  y: [0, 0, 0, 0, 0.47, 0],
  s: [1.0, 1.0, 0.9, 0.86, 0.7, 1.0],
};
const LAYOUT_MID = {
  x: [0.66, 0.66, 0.66, 0.66, 0.6, 0.66],
  y: [0, 0, 0, 0, 0.47, 0],
  s: [0.85, 0.8, 0.75, 0.8, 0.62, 0.8],
};
function layoutAt(table, idx) {
  const i = Math.min(4, Math.max(0, Math.floor(idx)));
  const t = ramp(idx - i, 0.25, 0.75);
  // in right-to-left languages the text sits on the other side, so the avatar mirrors too
  const flip = document.documentElement.classList.contains('rtl') ? -1 : 1;
  return { x: lerp(table.x[i], table.x[i + 1], t) * flip, y: lerp(table.y[i], table.y[i + 1], t), s: lerp(table.s[i], table.s[i + 1], t) };
}

const AVATAR_URL = '/models/avatar-hero.glb';

const POINT_VERT = /* glsl */ `
  uniform float uTime; uniform float uForm; uniform float uSize; uniform float uScale;
  attribute vec3 aScatter; attribute float aRand;
  varying float vRand;
  #include <clipping_planes_pars_vertex>
  void main() {
    float f = smoothstep(0.0, 1.0, clamp(uForm * 1.7 - aRand * 0.7, 0.0, 1.0));
    vec3 p = mix(aScatter, position, f);
    p += (1.0 - f) * 0.18 * vec3(sin(uTime * 1.3 + aRand * 40.0), cos(uTime * 1.1 + aRand * 31.0), sin(uTime * 0.9 + aRand * 17.0));
    p += f * 0.008 * vec3(sin(uTime * 2.0 + aRand * 60.0), cos(uTime * 2.3 + aRand * 50.0), sin(uTime * 1.7 + aRand * 21.0));
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * uScale * (0.55 + aRand * 0.9) / -mvPosition.z;
    vRand = aRand;
    #include <clipping_planes_vertex>
  }
`;
const POINT_FRAG = /* glsl */ `
  varying float vRand;
  uniform float uLight; uniform float uFade;
  #include <clipping_planes_pars_fragment>
  void main() {
    #include <clipping_planes_fragment>
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.05, d);
    vec3 col = mix(vec3(0.38, 0.6, 1.0), vec3(1.0, 0.56, 0.42), step(0.7, vRand));
    col *= mix(1.0, 0.62, uLight);
    gl_FragColor = vec4(col, a * 0.6 * uFade);
  }
`;

const FLOOR_VERT = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
// A Blender-style floor: fine grid, coarse grid, red X axis, green Y axis, faded with distance.
const FLOOR_FRAG = /* glsl */ `
  varying vec3 vW;
  uniform vec3 uCenter; uniform float uAlpha; uniform vec3 uInk;
  float grid(vec2 p, float s) {
    vec2 q = p / s;
    vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  float line(float v) { return 1.0 - min(abs(v) / fwidth(v), 1.0); }
  void main() {
    vec2 p = vW.xz;
    float fade = smoothstep(16.0, 1.5, length(p - uCenter.xz));
    float a = (grid(p, 0.5) * 0.12 + grid(p, 2.5) * 0.2) * fade;
    vec3 col = uInk;
    float ax = line(p.y) * fade;
    float az = line(p.x) * fade;
    col = mix(col, vec3(0.92, 0.25, 0.3), ax);
    col = mix(col, vec3(0.5, 0.78, 0.1), az);
    a = max(a, max(ax, az) * 0.55);
    gl_FragColor = vec4(col, a * uAlpha);
  }
`;

function radialTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,0.85)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x000000, 0);
  const narrowScreen = Math.min(innerWidth, innerHeight) < 720;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrowScreen ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const CAM_DIST = 7.4;

  // ---- lights (all directional or hemisphere, so intensities stay easy to reason about)
  const hemi = new THREE.HemisphereLight(0xcfe6f0, 0x0f1d26, 0.9);
  const key = new THREE.DirectionalLight(0xfff0e0, 0.35);
  key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight(0x8ab8ff, 0);
  rim.position.set(-4, 3, -4);
  const fill = new THREE.DirectionalLight(0xff9f7e, 0);
  fill.position.set(-3, -1, 3);
  scene.add(hemi, key, rim, fill);

  // ---- avatar and its four layers. The built-in procedural character is shown first; the rigged .glb replaces
  // it as soon as it has loaded (mount() can run again with a new rig).
  const avatar = new THREE.Group();
  scene.add(avatar);

  const clayMat = new THREE.MeshStandardMaterial({ color: 0xf4d9c4, emissive: 0x6a5446, roughness: 0.95, metalness: 0, flatShading: true });
  const up = (c) => new THREE.Plane(new THREE.Vector3(0, 1, 0), c); // keeps y >= -c
  const down = (c) => new THREE.Plane(new THREE.Vector3(0, -1, 0), c); // keeps y <= c
  const planes = {
    pts: up(0),
    wireLo: up(0), wireHi: down(0),
    clayLo: up(0), clayHi: down(0),
    fin: down(0),
    rev: up(0), // keeps the part of the textured avatar that has not been swept into wireframe yet
  };
  clayMat.clippingPlanes = [planes.clayLo, planes.clayHi];
  const wireMat = new THREE.LineBasicMaterial({ color: 0xff9f7e, transparent: true, opacity: 0.8, clippingPlanes: [planes.wireLo, planes.wireHi] });

  const COUNT = narrowScreen ? 5500 : 10000;
  const pMat = new THREE.ShaderMaterial({
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    clipping: true,
    clippingPlanes: [planes.pts],
    uniforms: { uTime: { value: 0 }, uForm: { value: 0 }, uSize: { value: 0.03 }, uScale: { value: 500 }, uLight: { value: 0 }, uFade: { value: 1 } },
  });
  const bbox = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xb9d4de, transparent: true, opacity: 0 }));
  avatar.add(bbox);

  const MARGIN = 0.06;
  const stats = { vertices: 0, triangles: 0 };
  let rig = null;
  let yMin = 0, yMax = 1, H = 1, centerY = 0.5;
  let clayMeshes = [];
  let finalMatList = [];
  let wire = null;
  let points = null;

  // Size of the built-in character. The rigged avatar is scaled to this height, and the stage is laid out around it, so the
  // numbers are fixed here and the built-in character itself is only built if the .glb cannot be loaded.
  const FALLBACK_BOX = new THREE.Box3(new THREE.Vector3(-0.406, -0.049, -0.24), new THREE.Vector3(0.401, 2.053, 0.259));
  const placeholder = () => ({ root: new THREE.Group(), finalMeshes: [], baked: [], box: FALLBACK_BOX.clone(), stats: { vertices: 0, triangles: 0 }, apply() {}, makeClay: () => [] });

  // Building the layers (clay copy, wireframe, point cloud) is split into steps that hand control back to the browser in
  // between, so the page never freezes for one long stretch while the 3D avatar is being prepared.
  function* prepare(next) {
    const b = { rig: next };
    b.clay = next.makeClay
      ? next.makeClay(clayMat)
      : next.finalMeshes.map((m) => {
        const c = new THREE.Mesh(m.geometry, clayMat);
        c.position.copy(m.position);
        c.rotation.copy(m.rotation);
        c.scale.copy(m.scale);
        m.parent.add(c);
        return c;
      });
    b.mats = [...new Set(next.finalMeshes.map((m) => m.material))];
    // visible where either plane keeps it: below the last sweep (render stage) or above the first one (top of the page)
    b.mats.forEach((m) => { m.clippingPlanes = [planes.fin, planes.rev]; m.clipIntersection = true; });
    yield;

    // wireframe layer (the .glb ships a very light copy of the body for this)
    const wirePositions = (next.wireGeos || next.baked).map((g) => new THREE.WireframeGeometry(g).attributes.position.array);
    const wireArr = new Float32Array(wirePositions.reduce((n, a) => n + a.length, 0));
    let o = 0;
    wirePositions.forEach((a) => { wireArr.set(a, o); o += a.length; });
    const wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute('position', new THREE.BufferAttribute(wireArr, 3));
    b.wire = new THREE.LineSegments(wireGeo, wireMat);
    yield;

    // point cloud layer
    const target = sampleSurface(next.baked, COUNT);
    yield;
    const scatter = new Float32Array(COUNT * 3);
    const rand = new Float32Array(COUNT);
    const tmp = new THREE.Vector3();
    for (let i = 0; i < COUNT; i++) {
      tmp.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(2.2 + Math.random() * 4.5);
      tmp.y += 0.6;
      scatter.set([tmp.x, tmp.y, tmp.z], i * 3);
      rand[i] = Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(target, 3));
    pGeo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
    pGeo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    b.points = new THREE.Points(pGeo, pMat);
    b.points.frustumCulled = false;

    // export bounding box
    const size = new THREE.Vector3();
    next.box.getSize(size);
    b.bboxGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x * 1.35, size.y * 1.06, size.z * 1.9));
    return b;
  }

  // The quick, all-at-once swap: everything is already built, so the scene never shows a half-finished avatar.
  function commit(b) {
    if (rig) {
      avatar.remove(rig.root, wire, points);
      clayMeshes.forEach((c) => c.parent && c.parent.remove(c));
      wire.geometry.dispose();
      points.geometry.dispose();
      if (rig.dispose) rig.dispose();
      else { rig.finalMeshes.forEach((m) => m.geometry.dispose()); rig.baked.forEach((g) => g.dispose()); }
    }
    rig = b.rig;
    avatar.add(rig.root, b.wire, b.points);
    Object.assign(stats, rig.stats);
    yMin = rig.box.min.y;
    yMax = rig.box.max.y;
    H = yMax - yMin;
    centerY = yMin + H / 2;
    clayMeshes = b.clay;
    finalMatList = b.mats;
    wire = b.wire;
    points = b.points;
    bbox.geometry.dispose();
    bbox.geometry = b.bboxGeo;
    rig.box.getCenter(bbox.position);
  }

  const nextTask = () => new Promise((resolve) => { if (globalThis.scheduler && scheduler.yield) scheduler.yield().then(resolve); else setTimeout(resolve, 0); });
  function mount(next) { // synchronous (the placeholder and the built-in fallback)
    const g = prepare(next);
    let r;
    while (!(r = g.next()).done);
    commit(r.value);
  }
  async function mountAsync(next) { // used for the .glb: the browser stays responsive between the steps
    const g = prepare(next);
    let r;
    while (!(r = g.next()).done) await nextTask();
    commit(r.value);
    // compile the avatar's shaders in parallel now, instead of freezing the first frame that shows it
    if (typeof renderer.compileAsync === 'function') renderer.compileAsync(scene, camera).catch(() => {});
  }
  mount(placeholder());

  // Swap in the rigged .glb avatar. The point cloud waits (still scattered) until it is ready, up to a few seconds.
  let avatarReady = false;
  const readyTimer = setTimeout(() => { avatarReady = true; }, 6000);
  import('./avatarGlb.js')
    .then((m) => m.loadAvatarGlb(AVATAR_URL, { height: H, minY: yMin }))
    .then((glb) => mountAsync(glb))
    .catch((err) => {
      console.warn('Rigged avatar could not load, using the built-in character.', err);
      mount(buildAvatar());
    })
    .finally(() => { clearTimeout(readyTimer); avatarReady = true; });

  // ---- floor, shadow, pedestal, sweep ring, background primitives
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.ShaderMaterial({
      vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, transparent: true, depthWrite: false,
      uniforms: { uCenter: { value: new THREE.Vector3() }, uAlpha: { value: 1 }, uInk: { value: new THREE.Color(0.56, 0.7, 0.75) } },
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.renderOrder = -2;
  scene.add(floor);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 2.1),
    new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, opacity: 0 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.renderOrder = -1;
  scene.add(shadow);

  const pedestal = new THREE.Group();
  const pedMat = new THREE.MeshStandardMaterial({ color: 0x21424f, roughness: 0.5, metalness: 0.35 });
  const pedBody = new THREE.Mesh(new THREE.CylinderGeometry(0.88, 0.94, 0.1, 56), pedMat);
  pedBody.position.y = -0.05;
  const pedRing = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.012, 8, 96), new THREE.MeshBasicMaterial({ color: 0xff9f7e, transparent: true, opacity: 0 }));
  pedRing.rotation.x = Math.PI / 2;
  pedestal.add(pedBody, pedRing);
  scene.add(pedestal);

  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff9f7e, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const sweepRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.006, 6, 96), ringMat);
  sweepRing.rotation.x = Math.PI / 2;
  const sweepDisc = new THREE.Mesh(new THREE.CircleGeometry(0.72, 64), new THREE.MeshBasicMaterial({ color: 0xff9f7e, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  sweepDisc.rotation.x = -Math.PI / 2;
  scene.add(sweepRing, sweepDisc);

  const floaters = [];
  const fMat = new THREE.LineBasicMaterial({ color: 0x6f95a3, transparent: true, opacity: 0.28 });
  [
    [new THREE.BoxGeometry(0.8, 0.8, 0.8), -5.2, 1.9, -3.5],
    [new THREE.TorusGeometry(0.5, 0.18, 8, 14), 5.4, -1.2, -4],
    [new THREE.ConeGeometry(0.5, 1, 6), -4.2, -2.3, -2.5],
    [new THREE.IcosahedronGeometry(0.55, 0), 4.2, 2.6, -5],
    [new THREE.OctahedronGeometry(0.5, 0), 0.5, -3, -6],
  ].forEach(([g, x, y, z]) => {
    const m = new THREE.LineSegments(new THREE.EdgesGeometry(g), fMat);
    m.position.set(x, y, z);
    m.userData.spin = [0.1 + Math.random() * 0.2, 0.15 + Math.random() * 0.2];
    scene.add(m);
    floaters.push(m);
  });

  // ---- state
  let idxS = 0;
  let reveal = 0; // 0..1: once the dots have formed the avatar at the top of the page, they dissolve into the textured model
  let form = 0;
  let lx = 0, ly = 0, ls = 1;
  let mx = 0, my = 0;
  let w = 1, h = 1;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) form = 1;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pMat.uniforms.uScale.value = (h * renderer.getPixelRatio()) / (2 * Math.tan((camera.fov * Math.PI) / 360));
  }
  resize();

  const bound = (s, scale) => avatar.position.y + (yMin - MARGIN + s * (H + MARGIN * 2) - 0) * scale - (0);

  // ---- click the avatar: it reacts with a short pose
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const POKES = ['wave', 'celebrate', 'idea', 'think'];
  let pokeN = 0;
  const pk = { name: null, t: 0 };
  function pick(cx, cy) {
    ndc.set((cx / window.innerWidth) * 2 - 1, -((cy / window.innerHeight) * 2 - 1));
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(rig.pickMeshes || rig.finalMeshes, false).length > 0;
  }
  function poke() { pk.name = POKES[pokeN++ % POKES.length]; pk.t = 0; }

  // ---- orbit: drag the avatar to turn it around its vertical (Y) axis. On release it eases back to the angle it
  // would have had anyway (the same resting rotation as before), so scrolling and the mouse-follow keep working.
  const orbit = { yaw: 0, dragging: false, x: 0 };
  const YAW_PER_PX = 0.011; // about 570 px of drag for one full turn
  function orbitStart(cx, cy) {
    if (!pick(cx, cy)) return false;
    orbit.dragging = true;
    orbit.x = cx;
    return true;
  }
  function orbitMove(cx) {
    if (!orbit.dragging) return 0;
    const dx = cx - orbit.x;
    orbit.x = cx;
    orbit.yaw += dx * YAW_PER_PX;
    return dx;
  }
  function orbitEnd() {
    orbit.dragging = false;
    // take the shortest way back: a spin of 400 degrees returns by 40, not by 400
    orbit.yaw = ((orbit.yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    if (reduce) orbit.yaw = 0; // no easing animation for people who asked for less motion
  }

  let isLight = false;
  function setTheme(mode) {
    isLight = mode === 'light';
    // scene colours come from CSS variables so every theme palette also tints the 3D scene
    const cv = (n, fb) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb;
    hemi.color.set(cv('--stage-hemi', isLight ? '#fff6ec' : '#cfe6f0'));
    hemi.groundColor.set(cv('--stage-ground', isLight ? '#d9c4ad' : '#0f1d26'));
    pedMat.color.set(cv('--stage-ped', isLight ? '#d9c4ad' : '#21424f'));
    floor.material.uniforms.uInk.value.set(cv('--stage-ink', isLight ? '#6b5444' : '#8fb2bf'));
    pMat.uniforms.uLight.value = isLight ? 1 : 0;
    const bl = isLight ? THREE.NormalBlending : THREE.AdditiveBlending;
    [pMat, ringMat, sweepDisc.material].forEach((m) => { m.blending = bl; m.needsUpdate = true; });
  }

  function update(dt, time, idx, mouse, _timelinePose) {
    idxS += (idx - idxS) * (1 - Math.exp(-dt * 5));
    const I = idxS;
    mx += (mouse.x - mx) * (1 - Math.exp(-dt * 3));
    my += (mouse.y - my) * (1 - Math.exp(-dt * 3));

    // layout
    const narrow = camera.aspect < 0.95;
    const L = narrow
      ? { x: 0, y: 0.62 - 128 / h, s: 0.62 } // top ~40% of the screen, text sits below it
      : layoutAt(window.innerWidth < 1100 ? LAYOUT_MID : LAYOUT, I);
    const dist = CAM_DIST;
    const hh = Math.tan((camera.fov * Math.PI) / 360) * dist;
    const hw = hh * camera.aspect;
    lx += (L.x * hw - lx) * (1 - Math.exp(-dt * 4));
    ly += (L.y * hh - ly) * (1 - Math.exp(-dt * 4));
    ls += (L.s - ls) * (1 - Math.exp(-dt * 4));

    camera.position.set(mx * 0.35, 0.55 + my * 0.2, dist);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    avatar.scale.setScalar(ls);
    avatar.position.set(lx, ly - centerY * ls, 0);

    // sweeps
    const s0 = ramp(I, 0.45, 0.85);
    const s1 = ramp(I, 1.15, 1.5);
    const s2 = ramp(I, 1.75, 2.4);
    const b0 = bound(s0, ls), b1 = bound(s1, ls), b2 = bound(s2, ls);
    planes.pts.constant = -b0;
    planes.wireLo.constant = -b1; planes.wireHi.constant = b0;
    planes.clayLo.constant = -b2; planes.clayHi.constant = b1;
    planes.fin.constant = b2;

    // reveal: the intro dots gather into the avatar, then the finished textured model takes their place for good.
    // Scrolling then sweeps that model straight into the wireframe scan (the dots never come back).
    const rvTarget = avatarReady && form >= 0.55 ? 1 : 0; // starts while the dots are still gathering, so there is no glowing silhouette
    reveal += (rvTarget - reveal) * (1 - Math.exp(-dt * (rvTarget ? 2.2 : 5)));
    const rv = reveal < 0.003 ? 0 : reveal > 0.997 ? 1 : reveal;
    planes.rev.constant = rv > 0 ? -b0 : -1000;
    pMat.uniforms.uFade.value = Math.min(1 - rv, 1 - ramp(form, 0.5, 0.95)); // the dots thin out as they land
    finalMatList.forEach((m) => {
      const t = rv > 0 && rv < 1;
      if (m.transparent !== t) { m.transparent = t; m.needsUpdate = true; } // the shader is rebuilt when this flips
      m.opacity = rv > 0 ? rv : 1;
    });

    points.visible = rv < 1 && pMat.uniforms.uFade.value > 0.004; // intro only
    wire.visible = s0 > 0.001 && s1 < 0.999;
    clayMeshes.forEach((m) => (m.visible = s1 > 0.001 && s2 < 0.999));
    rig.finalMeshes.forEach((m) => (m.visible = s2 > 0.001 || rv > 0));

    // sweep ring follows whichever sweep is in progress
    let active = null;
    if (s0 > 0.002 && s0 < 0.998) active = b0;
    else if (s1 > 0.002 && s1 < 0.998) active = b1;
    else if (s2 > 0.002 && s2 < 0.998) active = b2;
    const feetY = avatar.position.y + yMin * ls;
    if (active !== null) {
      sweepRing.visible = sweepDisc.visible = true;
      sweepRing.position.set(avatar.position.x, active, 0);
      sweepDisc.position.copy(sweepRing.position);
      sweepRing.scale.setScalar(ls);
      sweepDisc.scale.setScalar(ls);
      ringMat.opacity = 0.9;
      sweepDisc.material.opacity = 0.07;
    } else {
      sweepRing.visible = sweepDisc.visible = false;
    }

    // points intro
    if (avatarReady && form < 1) form = Math.min(1, form + dt / 3.2);
    pMat.uniforms.uForm.value = form;
    pMat.uniforms.uTime.value = reduce ? 0 : time;

    // lights ramp up at the Render stage
    const lk = ramp(I, 2.55, 3.2);
    const lkv = Math.max(lk, rv * 0.85 * (1 - ramp(I, 0.75, 0.9))); // the textured avatar at the top is lit like the finished render
    hemi.intensity = lerp(0.95, 0.42, lkv);
    key.intensity = lerp(0.35, 2.7, lkv);
    rim.intensity = lerp(0, 2.2, lkv);
    fill.intensity = lerp(0, 0.9, lkv);

    // pedestal, shadow, floor
    pedestal.position.set(avatar.position.x, feetY, 0);
    pedestal.scale.set(ls, Math.max(0.001, lk), ls);
    pedRing.material.opacity = lk * 0.95;
    pedestal.visible = lk > 0.01;
    shadow.position.set(avatar.position.x, feetY + 0.004, 0);
    shadow.scale.setScalar(ls);
    shadow.material.opacity = Math.max(ramp(I, 1.3, 2.2) * 0.55, rv * 0.5 * (1 - ramp(I, 0.75, 0.9))) * (1 - lk * 0.6);
    floor.position.y = feetY - 0.004;
    floor.material.uniforms.uCenter.value.set(avatar.position.x, 0, 0);

    // pose
    const idle = { ...POSES.idle };
    if (!reduce) {
      idle.rootY += Math.sin(time * 1.6) * 0.006;
      idle.spX += Math.sin(time * 1.6) * 0.012;
      idle.hdY += Math.sin(time * 0.7) * 0.08;
    }
    let pose = idle;
    const tlw = 0; // the Education and Experience timeline no longer makes the avatar act
    let pw = 0;
    if (pk.name) {
      pk.t += dt;
      pw = Math.max(0, Math.min(1, pk.t / 0.25, (2.6 - pk.t) / 0.4));
      if (pk.t > 2.6) pk.name = null;
      else pose = mixPose(pose, POSES[pk.name], pw);
    }
    if (rig.apply) rig.apply(pose, time);
    else applyPose(rig, pose, time);

    // turn: face the text a little, drift with scroll, follow the mouse, face front during animation
    const face = -Math.max(-1, Math.min(1, lx / (hw * 0.6 + 0.001))) * 0.38;
    const rotBase = face + Math.sin(I * 1.15) * 0.45 + mx * 0.4;
    if (!orbit.dragging) orbit.yaw += (0 - orbit.yaw) * (1 - Math.exp(-dt * 3.2)); // ease back to the default rotation
    avatar.rotation.y = (reduce ? face : lerp(rotBase, mx * 0.2, Math.max(tlw * 0.8, pw * 0.85))) + orbit.yaw;

    // export bounding box
    bbox.material.opacity = ramp(I, 4.5, 5.0) * 0.7;
    bbox.visible = bbox.material.opacity > 0.01;

    floaters.forEach((m) => {
      m.rotation.x += m.userData.spin[0] * dt * (reduce ? 0 : 1);
      m.rotation.y += m.userData.spin[1] * dt * (reduce ? 0 : 1);
      m.position.x += (mx * 0.0);
    });

    renderer.render(scene, camera);
  }

  // Small Blender-style axis gizmo, drawn on its own 2D canvas.
  const R = new THREE.Matrix4();
  const axes = [
    { v: new THREE.Vector3(1, 0, 0), c: '#ff3653', l: 'X' },
    { v: new THREE.Vector3(0, 0, -1), c: '#8bdc00', l: 'Y' },
    { v: new THREE.Vector3(0, 1, 0), c: '#2c8fff', l: 'Z' },
  ];
  function drawGizmo(canvas2d) {
    const ctx = canvas2d.getContext('2d');
    const s = canvas2d.width;
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.arc(s / 2, s / 2, s / 2 - 1, 0, Math.PI * 2); ctx.fill();
    R.copy(camera.matrixWorldInverse).multiply(avatar.matrixWorld);
    const items = [];
    axes.forEach((a) => {
      [1, -1].forEach((sign) => {
        const v = a.v.clone().multiplyScalar(sign).transformDirection(R);
        items.push({ x: v.x, y: v.y, z: v.z, c: a.c, l: a.l, pos: sign > 0 });
      });
    });
    items.sort((p, q) => p.z - q.z);
    const r = s * 0.32;
    items.forEach((it) => {
      const x = s / 2 + it.x * r, y = s / 2 - it.y * r;
      if (it.pos) {
        ctx.strokeStyle = it.c; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(s / 2, s / 2); ctx.lineTo(x, y); ctx.stroke();
        ctx.fillStyle = it.c;
        ctx.beginPath(); ctx.arc(x, y, s * 0.095, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.font = `600 ${s * 0.13}px "DM Mono", monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(it.l, x, y + 1);
      } else {
        ctx.fillStyle = it.c + '88';
        ctx.beginPath(); ctx.arc(x, y, s * 0.06, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  return { update, resize, drawGizmo, stats, renderer, pick, poke, setTheme, orbitStart, orbitMove, orbitEnd };
}
