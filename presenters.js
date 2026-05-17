// presenters.js — places presenter tiles in a "front stage" arc in front of
// the central core, and exposes helpers used by Presentation Mode.
import * as THREE from "three";
import { PRESENTERS } from "./data.js";

const TILE_W = 5.2;
const TILE_H = 5.2;          // square portraits
const STAGE_RADIUS = 26;
const STAGE_Y = 8;
const ARC_DEGREES = 130;     // total spread across the front of the scene
const ARC_CENTER_DEG = 90;   // 90° in XZ = +Z hemisphere (facing the default camera)

const texLoader = new THREE.TextureLoader();
texLoader.crossOrigin = "anonymous";

export function buildPresenters(scene) {
  const group = new THREE.Group();
  group.name = "presenters";
  scene.add(group);

  // Flatten into a single ordered list while keeping group affiliation.
  const members = [];
  for (const g of PRESENTERS) for (const m of g.members) members.push({ ...m, groupId: g.id, groupLabel: g.group });
  const n = members.length;

  // Stage label sprite floating above the row
  const stageLabel = makeStageLabel("Presenters");
  stageLabel.position.set(0, STAGE_Y + 8, STAGE_RADIUS - 4);
  stageLabel.scale.set(18, 4.5, 1);
  group.add(stageLabel);

  const tilesById = new Map();

  members.forEach((m, i) => {
    // Evenly distribute across the arc; if only one, center.
    const t = n === 1 ? 0.5 : i / (n - 1);
    const ang = ((ARC_CENTER_DEG - ARC_DEGREES / 2) + t * ARC_DEGREES) * Math.PI / 180;
    const x = Math.cos(ang) * STAGE_RADIUS;
    const z = Math.sin(ang) * STAGE_RADIUS;
    const y = STAGE_Y;

    const tile = makePresenterTile(m);
    tile.position.set(x, y, z);
    tile.lookAt(0, y * 0.4, 0);
    tile.rotateY(Math.PI); // face outward (camera orbits outside)
    tile.userData.presenter = m;
    tile.userData.seed = Math.random() * Math.PI * 2;
    tile.userData.basePos = tile.position.clone();
    group.add(tile);
    tilesById.set(m.id, tile);
  });

  // Cinematic helper: given a presenter id, produce a target camera pose.
  function cameraTargetFor(id) {
    const tile = tilesById.get(id);
    if (!tile) return null;
    const pos = tile.position;
    // Outward normal in XZ plane (away from origin)
    const radial = new THREE.Vector3(pos.x, 0, pos.z).normalize();
    const camPos = new THREE.Vector3()
      .copy(pos)
      .add(radial.multiplyScalar(14))   // pull back 14 units along outward
      .add(new THREE.Vector3(0, 2, 0)); // slight elevation
    const lookAt = pos.clone();
    return { camPos, lookAt, tile };
  }

  return { group, members, tilesById, cameraTargetFor };
}

// ---------- internals ----------

function makePresenterTile(m) {
  const root = new THREE.Group();

  // Frame plane (subtle warm glow behind the portrait)
  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE_W + 0.32, TILE_H + 0.32),
    new THREE.MeshBasicMaterial({
      color: 0xFF8B6F, // warm coral, distinct from cluster colors
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    })
  );
  frame.position.z = -0.02;
  root.add(frame);

  // Front portrait plane — fills immediately with a procedural placeholder,
  // then swaps to the real photo when it loads.
  const placeholder = makePlaceholderPortrait(m);
  const frontMat = new THREE.MeshBasicMaterial({
    map: placeholder,
    side: THREE.DoubleSide,
    transparent: true,
    fog: false,
  });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(TILE_W, TILE_H), frontMat);
  root.add(front);

  if (m.photo) {
    texLoader.load(m.photo, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      frontMat.map = composePortrait(tex.image, m);
      frontMat.needsUpdate = true;
    });
  }

  root.userData.frame = frame;
  root.userData.front = front;
  return root;
}

function composePortrait(img, m) {
  const w = 768, h = 768;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  if (img && (img.width || img.naturalWidth)) {
    const iw = img.width || img.naturalWidth;
    const ih = img.height || img.naturalHeight;
    const ir = iw / ih;
    const cr = w / h;
    let dw, dh, dx, dy;
    if (ir > cr) { dh = h; dw = h * ir; dx = (w - dw) / 2; dy = 0; }
    else { dw = w; dh = w / ir; dx = 0; dy = (h - dh) / 2; }
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // Bottom gradient for legibility
  const grad = ctx.createLinearGradient(0, h - 200, 0, h);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - 200, w, 200);

  // Name
  ctx.fillStyle = "#fff";
  ctx.font = "700 36px Inter, system-ui, sans-serif";
  ctx.fillText(m.name, 28, h - 58);

  // Eyebrow
  ctx.fillStyle = "#FF8B6F";
  ctx.font = "600 16px Inter, system-ui, sans-serif";
  ctx.fillText("PRESENTER", 28, h - 92);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makePlaceholderPortrait(m) {
  const w = 512, h = 512;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  // Coral gradient bg
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#FF7A59");
  g.addColorStop(1, "#7a0a14");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Initials
  const parts = m.name.split(" ").filter(Boolean);
  const init = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : (parts[0]?.[0] || "?").toUpperCase();
  ctx.fillStyle = "rgba(255,255,255,.95)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 200px Inter, system-ui, sans-serif";
  ctx.fillText(init, w / 2, h / 2 - 30);

  ctx.font = "600 22px Inter, system-ui, sans-serif";
  ctx.fillText(m.name, w / 2, h - 60);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeStageLabel(text) {
  const w = 1024, h = 256;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "rgba(10,12,28,.55)";
  roundRect(ctx, 80, 60, w - 160, h - 120, 50);
  ctx.fill();
  ctx.strokeStyle = "#FF8B6F";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 72px Inter, system-ui, sans-serif";
  ctx.fillText(text, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false }));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
