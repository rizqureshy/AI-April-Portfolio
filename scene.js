// scene.js — Three.js scene scaffolding for the Living Canvas
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function createScene(container) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x03040a, 0.0085);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  camera.position.set(0, 18, 92);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.7;
  controls.minDistance = 18;
  controls.maxDistance = 180;
  controls.maxPolarAngle = Math.PI * 0.95;
  controls.autoRotateSpeed = 0.35;

  // Lights
  scene.add(new THREE.AmbientLight(0xb0c4ff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.85);
  key.position.set(40, 60, 30);
  scene.add(key);
  const rim = new THREE.PointLight(0xE5202E, 1.6, 220, 2);
  rim.position.set(0, 0, 0);
  scene.add(rim);
  const fill = new THREE.PointLight(0x6FF7FF, 0.9, 200, 2);
  fill.position.set(-50, 30, -40);
  scene.add(fill);

  // Starfield
  scene.add(makeStarfield(2400, 380));
  scene.add(makeStarfield(800, 900, 0.8, 0.35));

  // Soft nebula glow plane behind everything
  const nebulaTex = makeRadialTexture("#1a1230", "#03040a", 512);
  const nebula = new THREE.Mesh(
    new THREE.PlaneGeometry(900, 900),
    new THREE.MeshBasicMaterial({ map: nebulaTex, transparent: true, opacity: 0.85, depthWrite: false })
  );
  nebula.position.set(0, 0, -260);
  scene.add(nebula);

  // Central core — pulsing orb representing the team
  const core = makeCore();
  scene.add(core);

  // Resize handling
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, controls, core };
}

function makeStarfield(count, radius, sizeBoost = 1, opacity = 0.85) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Distribute on a sphere shell with bias toward distant
    const r = radius * (0.55 + Math.random() * 0.45);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    // Bluish-white tint
    const t = Math.random();
    const c = new THREE.Color().setHSL(0.58 + t * 0.05, 0.2 + t * 0.4, 0.7 + t * 0.25);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.9 * sizeBoost,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

function makeRadialTexture(inner, outer, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeCore() {
  const group = new THREE.Group();

  // Inner glowing sphere
  const inner = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.8, 2),
    new THREE.MeshStandardMaterial({
      color: 0xE5202E,
      emissive: 0xE5202E,
      emissiveIntensity: 1.4,
      roughness: 0.35,
      metalness: 0.4,
    })
  );
  group.add(inner);

  // Wireframe shell
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(4.2, 1),
    new THREE.MeshBasicMaterial({ color: 0xff8a92, wireframe: true, transparent: true, opacity: 0.35 })
  );
  group.add(shell);

  // Outer halo sprite
  const halo = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: makeRadialTexture("rgba(255,80,90,.85)", "rgba(255,80,90,0)", 256), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  halo.scale.set(22, 22, 1);
  group.add(halo);

  group.userData.tick = (t) => {
    inner.rotation.y = t * 0.25;
    inner.rotation.x = Math.sin(t * 0.3) * 0.2;
    shell.rotation.y = -t * 0.18;
    shell.rotation.z = t * 0.12;
    const s = 1 + Math.sin(t * 1.4) * 0.04;
    inner.scale.setScalar(s);
  };

  return group;
}
