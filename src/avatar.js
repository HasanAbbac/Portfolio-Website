import * as THREE from 'three';

// A procedural low-poly character used until the real Blender .glb replaces it.
// Joint naming: side "a" sits on +x, side "b" on -x. The character faces +z.

import { POSE_KEYS, POSES, mixPose } from './poses.js';
export { POSE_KEYS, POSES, mixPose };

export function applyPose(rig, p, time) {
  const j = rig.joints;
  j.hips.position.y = rig.hipsY + p.rootY;
  j.spine.rotation.set(p.spX, 0, p.spZ);
  j.neck.rotation.set(p.hdX, p.hdY, 0);
  j.armA.rotation.set(p.aShX, 0, p.aShZ);
  j.elbowA.rotation.set(p.aElX, 0, 0);
  j.armB.rotation.set(p.bShX, 0, p.bShZ);
  j.elbowB.rotation.set(p.bElX, 0, p.wave * Math.sin(time * 9) * 0.55);
  j.hipA.rotation.set(p.aHpX, 0, p.aHpZ);
  j.kneeA.rotation.set(p.aKnX, 0, 0);
  j.hipB.rotation.set(p.bHpX, 0, p.bHpZ);
  j.kneeB.rotation.set(p.bKnX, 0, 0);
}

const COLORS = {
  skin: 0xf0b48f,
  hair: 0x2a3550,
  hoodie: 0x3f7fd6,
  accent: 0xff9f7e,
  pants: 0x2b4f8f,
  shoe: 0xfff4ea,
  eye: 0x101014,
};

export function buildAvatar() {
  const root = new THREE.Group();
  const finalMeshes = [];
  const mats = {};
  const mat = (name, color, extra = {}) =>
    (mats[name] ||= new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.04, flatShading: true, ...extra }));

  const add = (parent, geo, material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    parent.add(m);
    finalMeshes.push(m);
    return m;
  };
  const group = (parent, x = 0, y = 0, z = 0) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };

  const skin = mat('skin', COLORS.skin, { roughness: 0.8 });
  const hair = mat('hair', COLORS.hair, { roughness: 0.55 });
  const hoodie = mat('hoodie', COLORS.hoodie, { roughness: 0.9 });
  const accent = mat('accent', COLORS.accent, { roughness: 0.35, metalness: 0.25 });
  const pants = mat('pants', COLORS.pants, { roughness: 0.85 });
  const shoe = mat('shoe', COLORS.shoe, { roughness: 0.5 });
  const eye = mat('eye', COLORS.eye, { roughness: 0.2 });

  const hipsY = 0.9;
  const hips = group(root, 0, hipsY, 0);
  add(hips, new THREE.CylinderGeometry(0.2, 0.19, 0.2, 8), pants, 0, 0.0, 0);

  // legs
  const legs = {};
  [['A', 1], ['B', -1]].forEach(([n, s]) => {
    const hip = group(hips, s * 0.115, -0.05, 0);
    add(hip, new THREE.CylinderGeometry(0.088, 0.072, 0.42, 7), pants, 0, -0.21, 0);
    const knee = group(hip, 0, -0.42, 0);
    add(knee, new THREE.CylinderGeometry(0.072, 0.06, 0.4, 7), pants, 0, -0.2, 0);
    add(knee, new THREE.BoxGeometry(0.125, 0.075, 0.27), shoe, 0, -0.43, 0.05);
    add(knee, new THREE.BoxGeometry(0.128, 0.025, 0.275), accent, 0, -0.465, 0.05);
    legs[n] = { hip, knee };
  });

  // torso
  const spine = group(hips, 0, 0.08, 0);
  add(spine, new THREE.CylinderGeometry(0.255, 0.215, 0.6, 9), hoodie, 0, 0.3, 0);
  add(spine, new THREE.TorusGeometry(0.22, 0.02, 5, 14), accent, 0, 0.02, 0).rotation.x = Math.PI / 2;
  add(spine, new THREE.BoxGeometry(0.2, 0.05, 0.02), accent, 0, 0.36, 0.245).rotation.x = -0.15;

  // neck, head
  const neck = group(spine, 0, 0.6, 0);
  add(neck, new THREE.CylinderGeometry(0.06, 0.07, 0.1, 6), skin, 0, 0.04, 0);
  add(neck, new THREE.TorusGeometry(0.135, 0.045, 5, 10), hoodie, 0, 0.02, 0).rotation.x = Math.PI / 2;
  const head = group(neck, 0, 0.22, 0);
  const skull = add(head, new THREE.IcosahedronGeometry(0.2, 1), skin, 0, 0, 0);
  skull.scale.set(1, 1.1, 1.02);
  const cap = add(head, new THREE.SphereGeometry(0.212, 9, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), hair, 0, 0.012, -0.012);
  cap.rotation.x = -0.22;
  add(head, new THREE.BoxGeometry(0.22, 0.05, 0.06), hair, 0, 0.145, 0.15).rotation.x = 0.3;
  add(head, new THREE.IcosahedronGeometry(0.05, 0), hair, 0.09, 0.2, 0.05);
  add(head, new THREE.IcosahedronGeometry(0.045, 0), hair, -0.07, 0.215, 0.02);
  [-1, 1].forEach((s) => {
    add(head, new THREE.SphereGeometry(0.026, 6, 5), eye, s * 0.07, 0.01, 0.185);
    add(head, new THREE.SphereGeometry(0.035, 6, 5), skin, s * 0.2, -0.01, 0);
  });
  add(head, new THREE.BoxGeometry(0.06, 0.012, 0.01), eye, 0, -0.085, 0.192);
  // headphones
  add(head, new THREE.TorusGeometry(0.225, 0.02, 6, 14, Math.PI), accent, 0, 0.0, 0);
  [-1, 1].forEach((s) => {
    const can = add(head, new THREE.CylinderGeometry(0.075, 0.075, 0.06, 10), accent, s * 0.225, -0.005, 0);
    can.rotation.z = Math.PI / 2;
    const pad = add(head, new THREE.CylinderGeometry(0.06, 0.06, 0.07, 10), hoodie, s * 0.215, -0.005, 0);
    pad.rotation.z = Math.PI / 2;
  });

  // arms
  const arms = {};
  [['A', 1], ['B', -1]].forEach(([n, s]) => {
    const sh = group(spine, s * 0.29, 0.52, 0);
    add(sh, new THREE.SphereGeometry(0.08, 7, 5), hoodie, 0, 0, 0);
    add(sh, new THREE.CylinderGeometry(0.068, 0.058, 0.3, 7), hoodie, 0, -0.15, 0);
    const el = group(sh, 0, -0.3, 0);
    add(el, new THREE.CylinderGeometry(0.058, 0.048, 0.27, 7), hoodie, 0, -0.135, 0);
    add(el, new THREE.CylinderGeometry(0.052, 0.052, 0.03, 7), accent, 0, -0.26, 0);
    add(el, new THREE.SphereGeometry(0.056, 7, 5), skin, 0, -0.32, 0);
    arms[n] = { sh, el };
  });

  const rig = {
    root,
    hipsY,
    finalMeshes,
    joints: {
      hips, spine, neck,
      armA: arms.A.sh, elbowA: arms.A.el, armB: arms.B.sh, elbowB: arms.B.el,
      hipA: legs.A.hip, kneeA: legs.A.knee, hipB: legs.B.hip, kneeB: legs.B.knee,
    },
  };

  applyPose(rig, POSES.idle, 0);
  root.updateMatrixWorld(true);

  // Bake the idle pose into plain geometries for the points and wireframe layers.
  const baked = finalMeshes.map((m) => {
    const g = m.geometry.clone();
    g.applyMatrix4(m.matrixWorld);
    return g;
  });

  const box = new THREE.Box3();
  baked.forEach((g) => {
    g.computeBoundingBox();
    box.union(g.boundingBox);
  });

  // Count unique vertices (positions rounded to 0.1 mm) and triangles for the viewport stats.
  const seen = new Set();
  let triangles = 0;
  baked.forEach((g) => {
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      seen.add(`${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`);
    }
    triangles += g.index ? g.index.count / 3 : pos.count / 3;
  });
  const vertices = seen.size;

  return { ...rig, baked, box, stats: { vertices, triangles } };
}

// Evenly sample points over the surface of the baked meshes. Works straight on the typed arrays (no per-triangle objects),
// so even an 80,000-triangle avatar is sampled in a few milliseconds.
export function sampleSurface(baked, count) {
  const parts = [];
  let total = 0;
  baked.forEach((g) => {
    const pos = g.attributes.position.array;
    const idx = g.index ? g.index.array : null;
    const tris = idx ? idx.length / 3 : pos.length / 9;
    const cum = new Float64Array(tris);
    let sum = 0;
    for (let t = 0; t < tris; t++) {
      const i0 = (idx ? idx[t * 3] : t * 3) * 3;
      const i1 = (idx ? idx[t * 3 + 1] : t * 3 + 1) * 3;
      const i2 = (idx ? idx[t * 3 + 2] : t * 3 + 2) * 3;
      const ux = pos[i1] - pos[i0], uy = pos[i1 + 1] - pos[i0 + 1], uz = pos[i1 + 2] - pos[i0 + 2];
      const vx = pos[i2] - pos[i0], vy = pos[i2 + 1] - pos[i0 + 1], vz = pos[i2 + 2] - pos[i0 + 2];
      const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
      sum += 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
      cum[t] = sum;
    }
    if (tris) parts.push({ pos, idx, tris, cum, start: total, area: sum });
    total += sum;
  });
  const out = new Float32Array(count * 3);
  if (!parts.length) return out; // nothing to sample yet (the placeholder before the avatar has loaded)
  for (let n = 0; n < count; n++) {
    const r = Math.random() * total;
    let p = parts[parts.length - 1];
    for (let k = 0; k < parts.length; k++) if (r < parts[k].start + parts[k].area) { p = parts[k]; break; }
    const local = r - p.start;
    let lo = 0, hi = p.tris - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (p.cum[mid] < local) lo = mid + 1; else hi = mid;
    }
    const i0 = (p.idx ? p.idx[lo * 3] : lo * 3) * 3;
    const i1 = (p.idx ? p.idx[lo * 3 + 1] : lo * 3 + 1) * 3;
    const i2 = (p.idx ? p.idx[lo * 3 + 2] : lo * 3 + 2) * 3;
    let u = Math.random(), w = Math.random();
    if (u + w > 1) { u = 1 - u; w = 1 - w; }
    for (let a = 0; a < 3; a++) out[n * 3 + a] = p.pos[i0 + a] + (p.pos[i1 + a] - p.pos[i0 + a]) * u + (p.pos[i2 + a] - p.pos[i0 + a]) * w;
  }
  return out;
}
