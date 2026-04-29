// tiles.js — builds 3D tiles for each item and arranges them in clusters.
import * as THREE from "three";
import { CATEGORIES, ITEMS } from "./data.js";

const TILE_W = 6.4;
const TILE_H = 4.0;
const CLUSTER_RADIUS = 36;       // Distance of cluster centers from origin
const ITEM_SPREAD = 2.0;         // Multiplier for spacing within a cluster

const texLoader = new THREE.TextureLoader();
texLoader.crossOrigin = "anonymous";

export function buildTiles(scene) {
  const tiles = [];
  const labelGroup = new THREE.Group();
  scene.add(labelGroup);

  CATEGORIES.forEach((cat, ci) => {
    const items = ITEMS[cat.id] || [];
    const n = items.length;
    if (!n) return;

    // Place each cluster around the origin in a hexagonal ring (XZ plane, slight tilt).
    const baseAngle = (ci / CATEGORIES.length) * Math.PI * 2;
    const cx = Math.cos(baseAngle) * CLUSTER_RADIUS;
    const cz = Math.sin(baseAngle) * CLUSTER_RADIUS;
    const cy = (ci % 2 === 0 ? 1 : -1) * 4;

    // Cluster label sprite floating above the cluster center.
    const label = makeLabelSprite(cat.label, cat.accent);
    label.position.set(cx, cy + 14, cz);
    label.scale.set(18, 4.5, 1);
    labelGroup.add(label);

    // Lay items out in a 3-column grid, slightly arced toward the origin.
    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(n))));
    const rows = Math.ceil(n / cols);

    items.forEach((item, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;

      // Local offsets within the cluster
      const offX = (c - (cols - 1) / 2) * (TILE_W * 1.15) * ITEM_SPREAD * 0.5;
      const offY = -(r - (rows - 1) / 2) * (TILE_H * 1.25) * ITEM_SPREAD * 0.5;

      // Rotate the local X axis to align with cluster's tangent.
      const tanX = -Math.sin(baseAngle);
      const tanZ = Math.cos(baseAngle);
      const x = cx + tanX * offX;
      const z = cz + tanZ * offX;
      const y = cy + offY;

      const tile = makeTile(item, cat);
      tile.position.set(x, y, z);

      // Face the origin (so all tiles look inward)
      tile.lookAt(0, y * 0.4, 0);

      // Bobbing seed
      tile.userData.seed = Math.random() * Math.PI * 2;
      tile.userData.basePos = tile.position.clone();
      tile.userData.item = item;
      tile.userData.category = cat;

      scene.add(tile);
      tiles.push(tile);
    });
  });

  return { tiles, labelGroup };
}

// ---------------- tile factory ----------------
function makeTile(item, cat) {
  const group = new THREE.Group();

  // Frame plane (slightly larger glowing border behind the front plane)
  const frameMat = new THREE.MeshBasicMaterial({
    color: cat.color,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const frame = new THREE.Mesh(new THREE.PlaneGeometry(TILE_W + 0.32, TILE_H + 0.32), frameMat);
  frame.position.z = -0.02;
  group.add(frame);

  // Front plane with content texture
  const placeholder = makePlaceholderTexture(item, cat);
  const frontMat = new THREE.MeshBasicMaterial({
    map: placeholder,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(TILE_W, TILE_H), frontMat);
  group.add(front);

  // For images / videos / decks, try to load a real preview asynchronously.
  if (item.type === "image" && item.file) {
    texLoader.load(item.file, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      frontMat.map = composeImageOnCard(tex, item, cat);
      frontMat.needsUpdate = true;
    });
  } else if (item.type === "video" && item.file) {
    // Use a static canvas card; we'll show the actual video in the modal.
    frontMat.map = makeVideoCard(item, cat);
    frontMat.needsUpdate = true;
  }

  group.userData.front = front;
  group.userData.frame = frame;
  return group;
}

// ---------------- procedural textures ----------------
function makePlaceholderTexture(item, cat) {
  const w = 1024, h = Math.round(w * (TILE_H / TILE_W));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  // Background gradient
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#0e1226");
  g.addColorStop(1, "#05060d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Decorative grid
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

  // Accent bar
  ctx.fillStyle = cat.accent;
  ctx.fillRect(40, 40, 8, 100);

  // Type icon
  drawTypeIcon(ctx, item.type, w - 90, 70, cat.accent);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 56px Inter, system-ui, sans-serif";
  wrapText(ctx, item.title, 70, 220, w - 140, 64);

  // Author
  ctx.fillStyle = "#9bb1d6";
  ctx.font = "500 30px Inter, system-ui, sans-serif";
  ctx.fillText(item.author ? `by ${item.author}` : "", 70, h - 60);

  // Category label
  ctx.fillStyle = cat.accent;
  ctx.font = "600 22px Inter, system-ui, sans-serif";
  ctx.fillText(cat.label.toUpperCase(), 70, 80);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function composeImageOnCard(imgTex, item, cat) {
  // Compose the loaded image with a corner caption strip for legibility.
  const w = 1024, h = Math.round(w * (TILE_H / TILE_W));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  const img = imgTex.image;
  if (img && img.width) {
    // cover-fit
    const ir = img.width / img.height;
    const cr = w / h;
    let dw, dh, dx, dy;
    if (ir > cr) { dh = h; dw = h * ir; dx = (w - dw) / 2; dy = 0; }
    else { dw = w; dh = w / ir; dx = 0; dy = (h - dh) / 2; }
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // Bottom caption strip
  const grad = ctx.createLinearGradient(0, h - 180, 0, h);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,.85)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - 180, w, 180);

  ctx.fillStyle = cat.accent;
  ctx.font = "600 22px Inter, system-ui, sans-serif";
  ctx.fillText(cat.label.toUpperCase(), 36, h - 96);

  ctx.fillStyle = "#fff";
  ctx.font = "700 40px Inter, system-ui, sans-serif";
  ctx.fillText(truncate(ctx, item.title, w - 72), 36, h - 56);

  if (item.author) {
    ctx.fillStyle = "#cdd6e8";
    ctx.font = "500 24px Inter, system-ui, sans-serif";
    ctx.fillText(`by ${item.author}`, 36, h - 22);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeVideoCard(item, cat) {
  const w = 1024, h = Math.round(w * (TILE_H / TILE_W));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  // Filmstrip background
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#1a0a18");
  g.addColorStop(1, "#05060d");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Sprocket holes
  ctx.fillStyle = "rgba(255,255,255,.07)";
  for (let x = 24; x < w; x += 80) {
    ctx.fillRect(x, 24, 36, 28);
    ctx.fillRect(x, h - 52, 36, 28);
  }

  // Big play button
  ctx.fillStyle = cat.accent;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0a0612";
  ctx.beginPath();
  ctx.moveTo(w / 2 - 28, h / 2 - 40);
  ctx.lineTo(w / 2 - 28, h / 2 + 40);
  ctx.lineTo(w / 2 + 42, h / 2);
  ctx.closePath();
  ctx.fill();

  // Title
  ctx.fillStyle = "#fff";
  ctx.font = "700 44px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  wrapText(ctx, item.title, w / 2, h - 110, w - 100, 50, true);
  ctx.fillStyle = "#cdd6e8";
  ctx.font = "500 26px Inter, system-ui, sans-serif";
  if (item.author) ctx.fillText(`by ${item.author}`, w / 2, h - 50);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function drawTypeIcon(ctx, type, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  if (type === "app") {
    ctx.strokeRect(-26, -26, 52, 52);
    ctx.fillRect(-26, -26, 52, 12);
  } else if (type === "video") {
    ctx.beginPath();
    ctx.moveTo(-22, -26); ctx.lineTo(-22, 26); ctx.lineTo(28, 0); ctx.closePath();
    ctx.fill();
  } else if (type === "deck") {
    ctx.strokeRect(-28, -22, 56, 44);
    ctx.beginPath();
    ctx.moveTo(-18, -8); ctx.lineTo(18, -8);
    ctx.moveTo(-18, 4); ctx.lineTo(10, 4);
    ctx.stroke();
  } else {
    ctx.strokeRect(-28, -22, 56, 44);
    ctx.beginPath();
    ctx.arc(-10, -6, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-26, 18); ctx.lineTo(-6, 0); ctx.lineTo(8, 12); ctx.lineTo(28, -6);
    ctx.stroke();
  }
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, center = false) {
  const words = text.split(" ");
  let line = "", yy = y;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + " ";
    if (ctx.measureText(test).width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, yy);
      line = words[i] + " ";
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, yy);
}

function truncate(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 4 && ctx.measureText(t + "…").width > maxWidth) t = t.slice(0, -1);
  return t + "…";
}

function makeLabelSprite(text, accent) {
  const w = 1024, h = 256;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.clearRect(0, 0, w, h);

  // Soft pill behind text
  ctx.fillStyle = "rgba(10,12,28,.55)";
  roundRect(ctx, 80, 60, w - 160, h - 120, 50);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 72px Inter, system-ui, sans-serif";
  ctx.fillText(text, w / 2, h / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
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
