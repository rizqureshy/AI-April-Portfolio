// presenters.js — places presenter tiles in a "front stage" arc in front of
// the central core. Capstone is a group presentation, so all 4 members share
// one composite tile (2x2 photo grid). Project Presentations get one tile per
// member.
import * as THREE from "three";
import { PRESENTERS } from "./data.js";

const TILE_W = 5.6;
const TILE_H = 5.6;          // square portraits
const STAGE_RADIUS = 26;
const STAGE_Y = 8;
const ARC_DEGREES = 120;     // total spread across the front of the scene
const ARC_CENTER_DEG = 90;   // 90° in XZ = +Z hemisphere (facing default camera)

const texLoader = new THREE.TextureLoader();
texLoader.crossOrigin = "anonymous";

export function buildPresenters(scene) {
  const group = new THREE.Group();
  group.name = "presenters";
  scene.add(group);

  // Flatten groups into a list of "slots" — each slot is one tile in the canvas.
  // For display:"group", a slot represents the whole team; for "individual",
  // a slot represents one member.
  const slots = [];
  for (const g of PRESENTERS) {
    if (g.display === "group") {
      slots.push({
        id: g.id, group: g, kind: "group",
        members: g.members,
      });
    } else {
      for (const m of g.members) {
        slots.push({
          id: m.id, group: g, kind: "single", member: m,
        });
      }
    }
  }

  const n = slots.length;

  // Stage label sprite floating above the row
  const stageLabel = makeStageLabel("Presenters");
  stageLabel.position.set(0, STAGE_Y + 8, STAGE_RADIUS - 4);
  stageLabel.scale.set(18, 4.5, 1);
  group.add(stageLabel);

  // Map every member id (including each member of a group slot) to the tile
  // for that slot — so clicking any of the 4 Capstone names in the panel flies
  // to the same composite tile.
  const tileByMemberId = new Map();

  slots.forEach((slot, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const ang = ((ARC_CENTER_DEG - ARC_DEGREES / 2) + t * ARC_DEGREES) * Math.PI / 180;
    const x = Math.cos(ang) * STAGE_RADIUS;
    const z = Math.sin(ang) * STAGE_RADIUS;
    const y = STAGE_Y;

    const tile = makePresenterTile(slot);
    tile.position.set(x, y, z);
    tile.lookAt(0, y * 0.4, 0);
    tile.rotateY(Math.PI); // face outward (camera orbits outside)
    tile.userData.slot = slot;
    tile.userData.seed = Math.random() * Math.PI * 2;
    tile.userData.basePos = tile.position.clone();
    group.add(tile);

    if (slot.kind === "group") {
      for (const m of slot.members) tileByMemberId.set(m.id, tile);
    } else {
      tileByMemberId.set(slot.member.id, tile);
    }
  });

  // Cinematic helper: member id -> target camera pose.
  function cameraTargetFor(memberId) {
    const tile = tileByMemberId.get(memberId);
    if (!tile) return null;
    const pos = tile.position;
    const radial = new THREE.Vector3(pos.x, 0, pos.z).normalize();
    const camPos = new THREE.Vector3()
      .copy(pos)
      .add(radial.multiplyScalar(14))
      .add(new THREE.Vector3(0, 2, 0));
    const lookAt = pos.clone();
    return { camPos, lookAt, tile };
  }

  return { group, slots, tileByMemberId, cameraTargetFor };
}

// ---------- internals ----------

function makePresenterTile(slot) {
  const root = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(TILE_W + 0.32, TILE_H + 0.32),
    new THREE.MeshBasicMaterial({
      color: 0xFF8B6F,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false,
    })
  );
  frame.position.z = -0.02;
  root.add(frame);

  const placeholder = slot.kind === "group"
    ? makeGroupPlaceholder(slot.members, slot.group.group)
    : makePlaceholderPortrait(slot.member);

  const frontMat = new THREE.MeshBasicMaterial({
    map: placeholder,
    side: THREE.DoubleSide,
    transparent: true,
    fog: false,
  });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(TILE_W, TILE_H), frontMat);
  root.add(front);

  // Load real photos asynchronously and swap in.
  if (slot.kind === "group") {
    loadAndCompositeGroup(slot.members, slot.group.group).then((tex) => {
      frontMat.map = tex;
      frontMat.needsUpdate = true;
    }).catch(() => { /* keep placeholder */ });
  } else if (slot.member.photo) {
    texLoader.load(slot.member.photo, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      frontMat.map = composePortrait(tex.image, slot.member);
      frontMat.needsUpdate = true;
    });
  }

  root.userData.frame = frame;
  root.userData.front = front;
  return root;
}

function loadOne(url) {
  return new Promise((resolve, reject) => {
    texLoader.load(url, (tex) => resolve(tex.image), undefined, reject);
  });
}

async function loadAndCompositeGroup(members, groupLabel) {
  const imgs = await Promise.all(members.map(m => loadOne(m.photo).catch(() => null)));
  const w = 768, h = 768;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0a0612";
  ctx.fillRect(0, 0, w, h);

  // 2x2 grid layout with small gaps
  const gap = 6;
  const cellW = (w - gap) / 2;
  const cellH = (h - gap) / 2;
  for (let i = 0; i < 4; i++) {
    const cx = (i % 2) * (cellW + gap);
    const cy = Math.floor(i / 2) * (cellH + gap);
    const img = imgs[i];
    if (img) {
      drawCover(ctx, img, cx, cy, cellW, cellH);
    } else {
      ctx.fillStyle = "#1a1230";
      ctx.fillRect(cx, cy, cellW, cellH);
    }
  }

  // Bottom gradient + label
  const grad = ctx.createLinearGradient(0, h - 130, 0, h);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - 130, w, 130);

  ctx.fillStyle = "#FF8B6F";
  ctx.font = "600 16px Inter, system-ui, sans-serif";
  ctx.fillText("GROUP PRESENTATION", 22, h - 56);
  ctx.fillStyle = "#fff";
  ctx.font = "700 30px Inter, system-ui, sans-serif";
  ctx.fillText(groupLabel, 22, h - 22);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function drawCover(ctx, img, dx, dy, dw, dh) {
  const iw = img.width || img.naturalWidth;
  const ih = img.height || img.naturalHeight;
  if (!iw || !ih) { ctx.fillStyle = "#1a1230"; ctx.fillRect(dx, dy, dw, dh); return; }
  const ir = iw / ih;
  const cr = dw / dh;
  let nw, nh, nx, ny;
  if (ir > cr) { nh = dh; nw = dh * ir; nx = dx - (nw - dw) / 2; ny = dy; }
  else { nw = dw; nh = dw / ir; nx = dx; ny = dy - (nh - dh) / 2; }
  ctx.save();
  ctx.beginPath();
  ctx.rect(dx, dy, dw, dh);
  ctx.clip();
  ctx.drawImage(img, nx, ny, nw, nh);
  ctx.restore();
}

function composePortrait(img, m) {
  const w = 768, h = 768;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  if (img) drawCover(ctx, img, 0, 0, w, h);

  const grad = ctx.createLinearGradient(0, h - 200, 0, h);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - 200, w, 200);

  ctx.fillStyle = "#fff";
  ctx.font = "700 36px Inter, system-ui, sans-serif";
  ctx.fillText(m.name, 28, h - 58);

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
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#FF7A59");
  g.addColorStop(1, "#7a0a14");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

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

function makeGroupPlaceholder(members, label) {
  const w = 512, h = 512;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#FF7A59");
  g.addColorStop(1, "#7a0a14");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(255,255,255,.95)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 80px Inter, system-ui, sans-serif";
  ctx.fillText("GROUP", w / 2, h / 2 - 40);
  ctx.font = "600 36px Inter, system-ui, sans-serif";
  ctx.fillText(label, w / 2, h / 2 + 40);

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
