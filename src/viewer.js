import { WebGLRenderer, ACESFilmicToneMapping, Scene, PMREMGenerator, PerspectiveCamera, DirectionalLight, Box3, Vector3, GridHelper, MeshBasicMaterial } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Interactive .glb viewer. Loaded on demand, only when a project popup needs it.
export async function mountViewer(host, url, onState, view = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'pm-canvas';
  canvas.tabIndex = 0;
  canvas.setAttribute('aria-label', '3D model viewer. Drag to rotate, scroll to zoom.');
  host.appendChild(canvas);
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  const scene = new Scene();
  const pm = new PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new PerspectiveCamera(40, 1, 0.01, 1000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.4;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  const sun = new DirectionalLight(0xffffff, 1.6);
  sun.position.set(3, 5, 4);
  scene.add(sun);

  let raf = 0;
  let dead = false;
  const meshes = [];
  const extras = [];
  let stage = 2;
  let model = null;
  const wireMat = new MeshBasicMaterial({ color: 0xbfeaff, wireframe: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const fillMat = new MeshBasicMaterial({ color: 0x0b2733, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const resize = () => {
    const w = host.clientWidth || 640;
    const h = host.clientHeight || 360;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();
  const loop = () => { raf = requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); };

  // models are Draco-compressed; the decoder files live in /draco/
  const draco = new DRACOLoader().setDecoderPath('/draco/');
  new GLTFLoader().setDRACOLoader(draco).load(
    url,
    (gltf) => {
      if (dead) return;
      model = gltf.scene;
      scene.add(model);
      model.traverse((o) => {
        if (o.isMesh) {
          meshes.push({ mesh: o, orig: o.material });
        }
      });
      (view.decals || []).forEach((n) => {
        const d = model.getObjectByName(n);
        if (d && d.isMesh) {
          const m = d.material.clone();
          m.polygonOffset = true; m.polygonOffsetFactor = -8; m.polygonOffsetUnits = -8;
          d.material = m; d.renderOrder = 2;
        }
      });
      const box = new Box3().setFromObject(model);
      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());
      if (view.focusY != null) center.y = box.min.y + size.y * view.focusY;
      const r = Math.max(size.x, size.y, size.z) || 1;
      const dist = (r / 2 / Math.tan((camera.fov * Math.PI) / 360)) * 1.55 * (view.zoom || 1);
      camera.position.copy(center).add(new Vector3(1, 0.55, 1.2).normalize().multiplyScalar(dist));
      camera.near = r / 250;
      camera.far = r * 30;
      camera.updateProjectionMatrix();
      controls.target.copy(center);
      controls.minDistance = r * 0.05;
      controls.maxDistance = r * 6;
      const grid = new GridHelper(r * 4, 24, 0xff9f7e, 0x2d5766);
      grid.position.set(center.x, box.min.y, center.z);
      grid.material.transparent = true;
      grid.material.opacity = 0.55;
      scene.add(grid);
      onState('ready');
      loop();
    },
    undefined,
    () => { if (!dead) onState('error'); },
  );

  function applyStage() {
    // 1 wireframe (solid dark fill + full wire overlay, so every part shows), 2 material preview
    extras.forEach((p) => { p.parent && p.parent.remove(p); });
    extras.length = 0;
    meshes.forEach(({ mesh, orig }) => {
      if (stage === 1) {
        mesh.material = fillMat;
        const w = mesh.clone();
        w.material = wireMat;
        w.renderOrder = 3;
        mesh.parent.add(w);
        extras.push(w);
      } else {
        mesh.material = orig;
      }
    });
  }

  return {
    setStage(n) { stage = n; applyStage(); },
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      draco.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach((m) => { Object.values(m).forEach((v) => v && v.isTexture && v.dispose()); m.dispose(); });
      });
      pm.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

