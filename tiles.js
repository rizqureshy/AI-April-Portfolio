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

      // Aim the tile's local Z axis at the origin, then flip 180° so the FRONT
      // of the tile faces outward — the camera always orbits outside the ring
      // and should see the front (with un-mirrored UVs).
      tile.lookAt(0, y * 0.4, 0);
      tile.rotateY(Math.PI);

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
    fog: false,
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
    fog: false,
  });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(TILE_W, TILE_H), frontMat);
  group.add(front);

  // Default the deck tile to a slide-style cover immediately (decks otherwise look blank).
  if (item.type === "deck") {
    frontMat.map = makeDeckSlideCard(item, cat);
    frontMat.needsUpdate = true;
  } else if (item.type === "video" && item.file) {
    frontMat.map = makeVideoCard(item, cat);
    frontMat.needsUpdate = true;
  }

  // If a deck has a pre-rendered first-slide thumbnail, swap it in as soon as it loads.
  if (item.type === "deck" && item.thumb) {
    texLoader.load(
      item.thumb,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        frontMat.map = composeImageOnCard(tex.image, item, cat);
        frontMat.needsUpdate = true;
      },
      undefined,
      () => { /* missing thumbnail — keep slide-style card */ }
    );
  }

  const setMap = (tex) => { frontMat.map = tex; frontMat.needsUpdate = true; };

  // Async: load real previews per type.
  if (item.type === "image" && item.file) {
    texLoader.load(item.file, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      setMap(composeImageOnCard(tex.image, item, cat));
    });
  } else if (item.type === "video" && item.file) {
    captureVideoFrame(item.file)
      .then((frameImg) => { setMap(composeImageOnCard(frameImg, item, cat, { play: true })); })
      .catch(() => { /* keep filmstrip slate */ });
  } else if (item.type === "app" && item.url) {
    loadAppScreenshot(item.url)
      .then((img) => { setMap(composeImageOnCard(img, item, cat, { browserChrome: true, url: item.url })); })
      .catch(() => { /* keep procedural placeholder */ });
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

function composeImageOnCard(source, item, cat, opts = {}) {
  // Compose any drawable source (HTMLImageElement / HTMLCanvasElement / HTMLVideoElement)
  // with a caption strip for legibility.
  const w = 1024, h = Math.round(w * (TILE_H / TILE_W));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  const sw = source && (source.naturalWidth || source.videoWidth || source.width);
  const sh = source && (source.naturalHeight || source.videoHeight || source.height);
  if (sw && sh) {
    const ir = sw / sh;
    const cr = w / h;
    let dw, dh, dx, dy;
    if (ir > cr) { dh = h; dw = h * ir; dx = (w - dw) / 2; dy = 0; }
    else { dw = w; dh = w / ir; dx = 0; dy = (h - dh) / 2; }
    ctx.drawImage(source, dx, dy, dw, dh);
  }

  // Optional play-button overlay for videos
  if (opts.play) {
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = cat.accent;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 - 30, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a0612";
    ctx.beginPath();
    ctx.moveTo(w / 2 - 22, h / 2 - 60);
    ctx.lineTo(w / 2 - 22, h / 2);
    ctx.lineTo(w / 2 + 32, h / 2 - 30);
    ctx.closePath();
    ctx.fill();
  }

  // Optional browser-chrome overlay for app screenshots
  if (opts.browserChrome) {
    ctx.fillStyle = "rgba(8,10,18,.92)";
    ctx.fillRect(0, 0, w, 44);
    ["#ff5f57", "#febc2e", "#28c840"].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(28 + i * 22, 22, 7, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = "rgba(255,255,255,.06)";
    roundRect(ctx, 110, 11, w - 240, 22, 11); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = "500 13px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    let host = "";
    try { host = new URL(opts.url || "").hostname.replace(/^www\./, ""); } catch {}
    ctx.fillText(host, w / 2, 26);
    ctx.textAlign = "left";
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

// ---------------- live previews ----------------

// Live app screenshot via the public thum.io service. Returns an HTMLImageElement.
function loadAppScreenshot(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; reject(new Error("timeout")); } }, 12000);
    img.onload = () => { if (!done) { done = true; clearTimeout(timer); resolve(img); } };
    img.onerror = () => { if (!done) { done = true; clearTimeout(timer); reject(new Error("img error")); } };
    img.src = "https://image.thum.io/get/width/1280/crop/720/noanimate/" + url;
  });
}

// Extract a single frame from a video file (~5% in) as an HTMLCanvasElement.
function captureVideoFrame(file) {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.muted = true;
    v.playsInline = true;
    v.crossOrigin = "anonymous";
    let done = false;
    const cleanup = () => { try { v.removeAttribute("src"); v.load(); } catch {} };
    const fail = (e) => { if (!done) { done = true; cleanup(); reject(e); } };
    const timer = setTimeout(() => fail(new Error("video timeout")), 15000);

    v.addEventListener("loadeddata", () => {
      try {
        const target = Math.min(0.6, (v.duration || 1) * 0.05);
        v.currentTime = target;
      } catch (e) { fail(e); }
    }, { once: true });

    v.addEventListener("seeked", () => {
      if (done) return;
      try {
        const c = document.createElement("canvas");
        c.width = v.videoWidth || 1280;
        c.height = v.videoHeight || 720;
        const ctx = c.getContext("2d");
        ctx.drawImage(v, 0, 0, c.width, c.height);
        done = true;
        clearTimeout(timer);
        cleanup();
        resolve(c);
      } catch (e) { fail(e); }
    }, { once: true });

    v.addEventListener("error", () => fail(new Error("video error")), { once: true });
    v.src = file;
    v.load();
  });
}

// Slide-style title card for strategy decks (no real first-slide extraction client-side).
function makeDeckSlideCard(item, cat) {
  const w = 1024, h = Math.round(w * (TILE_H / TILE_W));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");

  // Slide background — clean off-white with subtle grid
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#f6f5f0");
  g.addColorStop(1, "#e8e6df");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(0,0,0,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }

  // Equinix red accent stripe down the left edge
  ctx.fillStyle = "#E5202E";
  ctx.fillRect(0, 0, 14, h);

  // "Strategy Deck" eyebrow label
  ctx.fillStyle = "#E5202E";
  ctx.font = "700 22px Inter, system-ui, sans-serif";
  ctx.fillText("STRATEGY DECK · GTM AI", 56, 90);

  // Big title (wrapped)
  ctx.fillStyle = "#13131a";
  ctx.font = "800 60px Inter, system-ui, sans-serif";
  wrapText(ctx, item.title, 56, 175, w - 110, 66);

  // Author byline at bottom
  ctx.fillStyle = "#5a6378";
  ctx.font = "500 24px Inter, system-ui, sans-serif";
  ctx.fillText(`by ${item.author || "Team"}`, 56, h - 70);

  // Equinix mark bottom-right
  ctx.fillStyle = "#13131a";
  ctx.font = "700 18px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("EQUINIX · GTM ENABLEMENT", w - 56, h - 70);
  ctx.fillStyle = "#9aa1ad";
  ctx.font = "500 14px Inter, system-ui, sans-serif";
  ctx.fillText("Slide 1", w - 56, h - 42);
  ctx.textAlign = "left";

  // Soft inner shadow for depth
  const shadow = ctx.createLinearGradient(0, h - 120, 0, h);
  shadow.addColorStop(0, "rgba(0,0,0,0)");
  shadow.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = shadow;
  ctx.fillRect(0, h - 120, w, 120);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
