// Avatar pose data and blending. Kept free of Three.js so the page's main script can use it without loading the 3D library.

export const POSE_KEYS = [
  'rootY', 'spX', 'spZ', 'hdX', 'hdY',
  'aShX', 'aShZ', 'aElX', 'bShX', 'bShZ', 'bElX',
  'aHpX', 'aHpZ', 'aKnX', 'bHpX', 'bHpZ', 'bKnX', 'wave',
];

function P(o) {
  const p = {};
  POSE_KEYS.forEach((k) => (p[k] = 0));
  return Object.assign(p, o);
}

export const POSES = {
  idle: P({ aShZ: 0.1, bShZ: -0.1, aElX: -0.12, bElX: -0.12, aHpZ: 0.03, bHpZ: -0.03 }),
  think: P({ aShX: -0.9, aShZ: 0.15, aElX: -2.0, bShZ: -0.1, bElX: -0.12, hdX: 0.12, hdY: -0.25, aHpZ: 0.03, bHpZ: -0.03, bHpX: -0.05 }),
  idea: P({ aShZ: 2.9, aElX: -0.1, bShZ: -0.1, bElX: -0.12, hdX: -0.12, hdY: 0.1, spZ: -0.05, aHpZ: 0.03, bHpZ: -0.03 }),
  wave: P({ bShZ: -2.4, bElX: -0.1, aShZ: 0.1, aElX: -0.12, hdY: 0.2, spZ: 0.04, wave: 1, aHpZ: 0.03, bHpZ: -0.03 }),
  celebrate: P({ aShZ: 2.6, bShZ: -2.6, aElX: -0.2, bElX: -0.2, rootY: 0.06, aHpX: -0.3, bHpX: -0.3, aKnX: 0.55, bKnX: 0.55, hdX: -0.15, aHpZ: 0.12, bHpZ: -0.12 }),
};

export function mixPose(a, b, t) {
  const out = {};
  POSE_KEYS.forEach((k) => (out[k] = a[k] + (b[k] - a[k]) * t));
  return out;
}
