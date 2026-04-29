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

  // Atmospheric night sky — multiple layers for parallax + twinkle.
  const skyGroup = new THREE.Group();
  scene.add(skyGroup);

  const farField     = makeStarfield(900, 950, 0.7, 0.28);   // distant, faint
  const midField     = makeStarfield(1800, 480, 0.9, 0.55);  // mid layer
  const twinkleField = makeTwinklingStars(1400, 320);        // close, twinkling
  skyGroup.add(farField, midField, twinkleField);

  // Soft nebula clouds — large additive planes drifting behind everything
  const nebulae = makeNebulae();
  scene.add(nebulae);

  // Central core — pulsing orb representing the team
  const core = makeCore();
  scene.add(core);

  // Resize handling
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Sky tick: slow parallax rotation + twinkle uniform
  const skyTick = (t) => {
    farField.rotation.y = t * 0.005;
    midField.rotation.y = -t * 0.008;
    twinkleField.rotation.y = t * 0.012;
    nebulae.children.forEach((n, i) => { n.rotation.z = t * 0.01 * (i % 2 ? 1 : -1); });
    const m = twinkleField.material;
    if (m && m.userData && m.userData.shader) m.userData.shader.uniforms.uTime.value = t;
  };

  return { scene, camera, renderer, controls, core, skyTick };
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

// Twinkling star layer — uses PointsMaterial with shader injection so each
// star's alpha is modulated by sin(time + seed) for a subtle dimming/brightening effect.
function makeTwinklingStars(count, radius) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = radius * (0.5 + Math.random() * 0.5);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
    const t = Math.random();
    const c = new THREE.Color().setHSL(0.55 + t * 0.12, 0.25 + t * 0.4, 0.7 + t * 0.25);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    seed[i] = Math.random() * 6.2832;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color",    new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aSeed",    new THREE.BufferAttribute(seed, 1));

  const mat = new THREE.PointsMaterial({
    size: 1.4,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>",
               "#include <common>\nattribute float aSeed;\nuniform float uTime;\nvarying float vTwinkle;")
      .replace("#include <begin_vertex>",
               "#include <begin_vertex>\nvTwinkle = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * 1.4 + aSeed));");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>",
               "#include <common>\nvarying float vTwinkle;")
      .replace("vec4 diffuseColor = vec4( diffuse, opacity );",
               "vec2 _d = gl_PointCoord - 0.5;\nfloat _r = dot(_d, _d);\nfloat _a = smoothstep(0.25, 0.0, _r);\nvec4 diffuseColor = vec4( diffuse, opacity * _a * vTwinkle );");
    mat.userData.shader = shader;
  };

  return new THREE.Points(geo, mat);
}

// Soft nebula clouds — a few large additive planes with radial gradients,
// placed behind the canvas so they read as a deep night sky without obstructing.
function makeNebulae() {
  const group = new THREE.Group();
  const specs = [
    { color: ["rgba(120,40,160,.55)",  "rgba(120,40,160,0)"], size: 720,  pos: [-160,  60, -300], rot:  0.2 },
    { color: ["rgba(40, 90, 200,.45)", "rgba(40, 90,200,0)"], size: 800,  pos: [ 180, -40, -320], rot: -0.3 },
    { color: ["rgba(180,40, 80,.32)",  "rgba(180,40, 80,0)"], size: 560,  pos: [ -40,-120, -260], rot:  0.6 },
    { color: ["rgba(20, 30, 60,.55)",  "rgba(20, 30, 60,0)"], size: 1100, pos: [   0,   0, -380], rot:  0   },
  ];
  for (const s of specs) {
    const tex = makeRadialTexture(s.color[0], s.color[1], 512);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(s.size, s.size),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    m.position.set(...s.pos);
    m.rotation.z = s.rot;
    group.add(m);
  }
  return group;
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
