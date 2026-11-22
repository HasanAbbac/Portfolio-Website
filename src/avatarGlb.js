import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Loads the rigged .glb avatar and wraps it in the same shape the stage already uses for the built-in
// procedural character: root, finalMeshes, baked (rest-pose geometry), box, stats and a pose function.
// The file holds a skinned body (Avatar_Body), its skeleton and a very light static copy (Avatar_Wire)
// that is only used for the wireframe layer.

export function loadAvatarGlb(url, { height, minY = 0 }) {
  const draco = new DRACOLoader().setDecoderPath('/draco/');
  return new Promise((resolve, reject) => {
    new GLTFLoader().setDRACOLoader(draco).load(
      url,
      (gltf) => {
        draco.dispose();
        try { resolve(wrap(gltf, height, minY)); } catch (e) { reject(e); }
      },
      undefined,
      reject,
    );
  });
}

function wrap(gltf, height, minY) {
  const scene = gltf.scene;
  let body = null;
  let wireMesh = null;
  scene.traverse((o) => {
    if (o.name === 'Avatar_Body') body = o;
    else if (o.name === 'Avatar_Wire') wireMesh = o;
  });
  if (!body || !body.isSkinnedMesh) throw new Error('Avatar_Body not found');

  // glTF names drop the dot ("UpperArm.L" -> "UpperArmL"), so look bones up without it
  const bones = {};
  scene.traverse((o) => { if (o.isBone) bones[o.name.replace('.', '')] = o; });

  const root = new THREE.Group();
  root.add(scene);

  // scale to the height of the built-in character and stand it on the same floor level
  body.geometry.computeBoundingBox();
  const bb = body.geometry.boundingBox;
  const k = height / (bb.max.y - bb.min.y);
  root.scale.setScalar(k);
  root.position.y = minY - bb.min.y * k;
  root.updateMatrixWorld(true);

  body.frustumCulled = false;
  const mat = body.material;
  // A model that ships its own roughness map keeps it (glossy glasses and watch, matte cloth). Metalness is switched off because the
  // stage has no environment map, and a metal surface without one renders black.
  if (mat.roughnessMap) { mat.metalnessMap = null; mat.metalness = 0; } else { mat.roughness = 0.72; mat.metalness = 0; }
  [mat.map, mat.normalMap, mat.roughnessMap, mat.aoMap].forEach((t) => { if (t) t.anisotropy = 16; }); // the browser caps this at what the graphics card supports

  // rest-pose copies for the point cloud, wireframe, bounding box and stats
  const bake = (m) => { const g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld); return g; };
  const bakedBody = bake(body);
  bakedBody.computeBoundingBox();
  const wireGeo = wireMesh ? bake(wireMesh) : bakedBody;
  // the light copy stays in the scene, invisible, as a cheap hit-test target for hover and click
  if (wireMesh) wireMesh.material = new THREE.MeshBasicMaterial({ visible: false });
  const box = bakedBody.boundingBox.clone();
  const pos = bakedBody.attributes.position;
  const stats = { vertices: pos.count, triangles: bakedBody.index ? bakedBody.index.count / 3 : pos.count / 3 };

  // ---- pose: the stage's pose keys are Euler angles about the world axes, so every bone is rotated about
  // those same axes as seen in the rest pose (the bones themselves are not axis-aligned).
  const rest = {};
  Object.entries(bones).forEach(([n, b]) => {
    rest[n] = { q: b.quaternion.clone(), w: b.getWorldQuaternion(new THREE.Quaternion()), p: b.position.clone() };
  });
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const wInv = new THREE.Quaternion();
  const set = (name, x, y, z) => {
    const b = bones[name];
    if (!b) return;
    const r = rest[name];
    q.setFromEuler(e.set(x, y, z, 'XYZ'));
    wInv.copy(r.w).invert();
    // delta = restWorld^-1 * rotation * restWorld, applied after the bone's own rest rotation
    b.quaternion.copy(r.q).multiply(wInv.multiply(q).multiply(r.w));
  };

  function apply(p, time) {
    if (bones.Hips) bones.Hips.position.set(rest.Hips.p.x, rest.Hips.p.y + p.rootY / k, rest.Hips.p.z);
    set('Spine', p.spX * 0.5, 0, p.spZ * 0.5);
    set('Chest', p.spX * 0.5, 0, p.spZ * 0.5);
    set('Neck', p.hdX * 0.4, p.hdY * 0.4, 0);
    set('Head', p.hdX * 0.6, p.hdY * 0.6, 0);
    set('UpperArmL', p.aShX, 0, p.aShZ);
    set('LowerArmL', p.aElX, 0, 0);
    set('UpperArmR', p.bShX, 0, p.bShZ);
    set('LowerArmR', p.bElX, 0, p.wave * Math.sin(time * 9) * 0.55);
    set('UpperLegL', p.aHpX, 0, p.aHpZ);
    set('LowerLegL', p.aKnX, 0, 0);
    set('FootL', -(p.aHpX + p.aKnX), 0, 0);
    set('UpperLegR', p.bHpX, 0, p.bHpZ);
    set('LowerLegR', p.bKnX, 0, 0);
    set('FootR', -(p.bHpX + p.bKnX), 0, 0);
  }

  // a second skinned mesh that shares the skeleton, for the clay layer
  function makeClay(material) {
    const c = new THREE.SkinnedMesh(body.geometry, material);
    c.position.copy(body.position);
    c.quaternion.copy(body.quaternion);
    c.scale.copy(body.scale);
    c.frustumCulled = false;
    body.parent.add(c);
    c.bind(body.skeleton, body.bindMatrix);
    return [c];
  }

  function dispose() {
    root.parent && root.parent.remove(root);
    [bakedBody, wireGeo, body.geometry].forEach((g) => g.dispose());
    if (wireMesh) { wireMesh.geometry.dispose(); wireMesh.material.dispose(); }
    [mat.map, mat.normalMap, mat.roughnessMap, mat.aoMap].forEach((t) => t && t.dispose());
    mat.dispose();
  }

  return { root, finalMeshes: [body], pickMeshes: wireMesh ? [wireMesh] : [body], baked: [bakedBody], wireGeos: [wireGeo], box, stats, apply, makeClay, dispose };
}
