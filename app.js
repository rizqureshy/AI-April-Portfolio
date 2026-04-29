// app.js — entry point. Wires the scene, tiles, raycaster, modal, and filters.
import * as THREE from "three";
import { createScene } from "./scene.js";
import { buildTiles } from "./tiles.js";
import { CATEGORIES, ITEMS, TEAM_NAME, APP_NAME } from "./data.js";

// ------------- bootstrap scene -------------
const container = document.body;
const { scene, camera, renderer, controls, core } = createScene(container);
const { tiles, labelGroup } = buildTiles(scene);

// ------------- stats / filters chrome -------------
const totalItems = Object.values(ITEMS).reduce((n, arr) => n + arr.length, 0);
document.getElementById("stat-items").textContent = totalItems;

const filtersEl = document.getElementById("filters");
const allChip = chip("All", true);
allChip.dataset.cat = "all";
filtersEl.appendChild(allChip);
CATEGORIES.forEach((c) => {
  const el = chip(c.label, false, c.accent);
  el.dataset.cat = c.id;
  filtersEl.appendChild(el);
});
filtersEl.addEventListener("click", (e) => {
  const t = e.target.closest(".chip");
  if (!t) return;
  filtersEl.querySelectorAll(".chip").forEach((x) => x.classList.remove("active"));
  t.classList.add("active");
  applyFilter(t.dataset.cat);
});

function chip(label, active = false, accent) {
  const b = document.createElement("button");
  b.className = "chip" + (active ? " active" : "");
  b.textContent = label;
  if (accent) b.style.borderColor = `${accent}55`;
  return b;
}

function applyFilter(catId) {
  const want = catId === "all" ? null : catId;
  tiles.forEach((t) => {
    const match = !want || t.userData.category.id === want;
    t.visible = match;
  });
  labelGroup.children.forEach((l, i) => {
    const cat = CATEGORIES[i];
    l.visible = !want || cat.id === want;
  });
}

// ------------- top action buttons -------------
let autoSpin = false;
document.getElementById("btn-spin").addEventListener("click", (e) => {
  autoSpin = !autoSpin;
  controls.autoRotate = autoSpin;
  e.currentTarget.classList.toggle("active", autoSpin);
});
document.getElementById("btn-reset").addEventListener("click", () => {
  flyCameraTo(new THREE.Vector3(0, 18, 92), new THREE.Vector3(0, 0, 0));
});
document.getElementById("btn-about").addEventListener("click", () => {
  openAbout();
});

// ------------- raycaster (hover + click) -------------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hovered = null;

const tipEl = document.getElementById("tip");
const tipTitle = document.getElementById("tip-title");
const tipBy = document.getElementById("tip-by");

renderer.domElement.addEventListener("pointermove", (ev) => {
  pointer.x = (ev.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(ev.clientY / window.innerHeight) * 2 + 1;
  tipEl.style.left = ev.clientX + "px";
  tipEl.style.top = ev.clientY + "px";
});

renderer.domElement.addEventListener("click", () => {
  if (!hovered) return;
  openItem(hovered.userData.item, hovered.userData.category);
});

// ------------- modal -------------
const modal = document.getElementById("modal");
const mTitle = document.getElementById("m-title");
const mBy = document.getElementById("m-by");
const mSwatch = document.getElementById("m-swatch");
const mBody = document.getElementById("m-body");
const mOpen = document.getElementById("m-open");
const mFs = document.getElementById("m-fs");
const panelEl = document.querySelector(".panel");
document.getElementById("m-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    // Esc handled natively by fullscreen if active; otherwise close modal or skip intro
    if (document.fullscreenElement) return;
    if (introPlaying) { skipIntro(); return; }
    closeModal();
  }
});

// Fullscreen toggle on the modal panel
mFs.addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await panelEl.requestFullscreen();
  } catch (err) { console.warn("Fullscreen failed:", err); }
});
document.addEventListener("fullscreenchange", () => {
  mFs.textContent = document.fullscreenElement ? "⤢ Exit full" : "⛶ Fullscreen";
});

function openItem(item, cat) {
  mTitle.textContent = item.title;
  mBy.textContent = item.author ? `by ${item.author} · ${cat.label}` : cat.label;
  mSwatch.style.background = cat.accent;
  mBody.innerHTML = "";
  mOpen.style.display = "inline-flex";

  if (item.type === "image" && item.file) {
    const img = document.createElement("img");
    img.src = item.file;
    img.alt = item.title;
    mBody.appendChild(img);
    mOpen.href = item.file;
    mOpen.textContent = "Open image ↗";
  } else if (item.type === "video" && item.file) {
    const v = document.createElement("video");
    v.src = item.file;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.style.background = "#000";
    mBody.appendChild(v);
    mOpen.href = item.file;
    mOpen.textContent = "Download video ↗";
  } else if (item.type === "app" && item.url) {
    // Try iframe; many sites block embedding via X-Frame-Options, so we always show
    // a "Open in new tab" button as the safe primary action.
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:relative;width:100%;height:78vh;background:#05060d";
    const iframe = document.createElement("iframe");
    iframe.src = item.url;
    iframe.style.cssText = "width:100%;height:100%;border:0";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock");
    wrap.appendChild(iframe);

    // Fallback notice that appears underneath; if iframe loads fine the user just sees the app.
    const note = document.createElement("div");
    note.style.cssText = "position:absolute;left:14px;bottom:14px;font-size:11px;color:#9bb1d6;background:rgba(5,6,13,.7);padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.08)";
    note.innerHTML = `If the app doesn't load below, click <b>Open ↗</b> to launch it in a new tab.`;
    wrap.appendChild(note);

    mBody.appendChild(wrap);
    mOpen.href = item.url;
    mOpen.textContent = "Open app ↗";
  } else if (item.type === "deck" && item.file) {
    // Embed PowerPoint via Office Online viewer when the file is reachable on a public URL.
    // Falls back to a download card when serving over file:// or localhost (Office can't fetch it).
    const absolute = new URL(item.file, window.location.href).href;
    const isPublic = /^https?:/.test(absolute) && !/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(absolute);

    if (isPublic) {
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:relative;width:100%;height:78vh;background:#fff";
      const iframe = document.createElement("iframe");
      iframe.src = "https://view.officeapps.live.com/op/embed.aspx?src=" + encodeURIComponent(absolute);
      iframe.style.cssText = "width:100%;height:100%;border:0;background:#fff";
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      iframe.setAttribute("allowfullscreen", "");
      wrap.appendChild(iframe);

      const note = document.createElement("div");
      note.style.cssText = "position:absolute;left:14px;bottom:14px;font-size:11px;color:#9bb1d6;background:rgba(5,6,13,.7);padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.08)";
      note.innerHTML = `Rendered by Microsoft Office Online. If it doesn't load, click <b>Download ↗</b>.`;
      wrap.appendChild(note);

      mBody.appendChild(wrap);
      mOpen.href = item.file;
      mOpen.setAttribute("download", "");
      mOpen.textContent = "Download .pptx ↗";
    } else {
      const card = document.createElement("div");
      card.className = "deck-card";
      card.innerHTML = `
        <div class="ic">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="14" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="8" y1="22" x2="16" y2="22"/>
          </svg>
        </div>
        <h2 style="margin:0;font-weight:700">Strategy Deck</h2>
        <p>${escapeHtml(item.title)} — by ${escapeHtml(item.author || "Team")}.<br/>Inline preview is available once this canvas is published on a public URL (e.g. GitHub Pages). Until then, please download the file.</p>
      `;
      mBody.appendChild(card);
      mOpen.href = item.file;
      mOpen.setAttribute("download", "");
      mOpen.textContent = "Download .pptx ↗";
    }
  }

  modal.classList.add("open");
}

function closeModal() {
  modal.classList.remove("open");
  // Stop any video that was playing
  mBody.querySelectorAll("video").forEach((v) => { try { v.pause(); } catch {} });
  mBody.innerHTML = "";
}

function openAbout() {
  mTitle.textContent = APP_NAME;
  mBy.textContent = `${TEAM_NAME} · April 2026`;
  mSwatch.style.background = "#E5202E";
  mBody.innerHTML = `
    <div class="deck-card" style="max-width:780px">
      <div class="ic">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>
        </svg>
      </div>
      <h2 style="margin:0;font-weight:700">${APP_NAME}</h2>
      <p>A living 3D canvas of ${totalItems} artifacts produced by ${TEAM_NAME} during the April AI sprint — apps, art, dashboards, strategy decks, animations, and courses. Each cluster is a different medium; each tile is the work of a teammate.</p>
      <p>Drag to orbit, scroll to zoom, click any tile to dive in. Use the filters below to focus a single cluster, or replay the intro from the top right.</p>
    </div>
  `;
  mOpen.style.display = "none";
  modal.classList.add("open");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

// ------------- camera fly-to -------------
let flying = null;
function flyCameraTo(toPos, toTarget, dur = 900) {
  flying = {
    fromPos: camera.position.clone(),
    toPos: toPos.clone(),
    fromTarget: controls.target.clone(),
    toTarget: toTarget.clone(),
    t0: performance.now(),
    dur,
  };
}

// ------------- intro cinematic -------------
const HOME_POS = new THREE.Vector3(0, 18, 92);
const HOME_TARGET = new THREE.Vector3(0, 0, 0);
let introPlaying = false;
let introTimer = null;
const skipBtn = document.getElementById("skip");

const CINEMATIC_WAYPOINTS = [
  // [position, target, duration ms]
  [new THREE.Vector3(0,   90, 230), new THREE.Vector3(0,  0, 0),  1500],
  [new THREE.Vector3(70,  35,  60), new THREE.Vector3(0,  0, 0),  1700],
  [new THREE.Vector3(-65, 18,  72), new THREE.Vector3(0,  0, 0),  1700],
  [new THREE.Vector3(0,    8,  44), new THREE.Vector3(0,  0, 0),  1500],
  [HOME_POS.clone(),                 HOME_TARGET.clone(),         1400],
];

function playIntro() {
  if (introPlaying) return;
  introPlaying = true;
  controls.enabled = false;
  controls.autoRotate = false;
  hero.classList.add("hidden");
  skipBtn.classList.add("show");

  // Snap to first waypoint instantly, then ease through the rest.
  const [startPos, startTarget] = CINEMATIC_WAYPOINTS[0];
  camera.position.copy(startPos);
  controls.target.copy(startTarget);

  let i = 1;
  const next = () => {
    if (!introPlaying) return;
    if (i >= CINEMATIC_WAYPOINTS.length) { endIntro(); return; }
    const [pos, tgt, dur] = CINEMATIC_WAYPOINTS[i++];
    flyCameraTo(pos, tgt, dur);
    introTimer = setTimeout(next, dur + 30);
  };
  next();
}

function skipIntro() {
  if (!introPlaying) return;
  flyCameraTo(HOME_POS, HOME_TARGET, 600);
  endIntro(true);
}

function endIntro(skipped = false) {
  introPlaying = false;
  if (introTimer) { clearTimeout(introTimer); introTimer = null; }
  skipBtn.classList.remove("show");
  controls.enabled = true;
  if (!skipped) {
    // Show the hero briefly then fade
    hero.classList.remove("hidden");
    setTimeout(() => hero.classList.add("hidden"), 2400);
  }
  try { sessionStorage.setItem("introSeen", "1"); } catch {}
}

skipBtn.addEventListener("click", skipIntro);
document.getElementById("btn-intro").addEventListener("click", playIntro);

// ------------- hide hero on first interaction -------------
const hero = document.getElementById("hero");
let interacted = false;
function markInteracted() {
  if (interacted) return;
  interacted = true;
  setTimeout(() => hero.classList.add("hidden"), 400);
}
renderer.domElement.addEventListener("pointerdown", markInteracted, { once: true });
renderer.domElement.addEventListener("wheel", markInteracted, { once: true });

// ------------- main loop -------------
const clock = new THREE.Clock();
function animate() {
  const t = clock.getElapsedTime();
  const dt = clock.getDelta();

  // Bobbing on tiles
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const seed = tile.userData.seed;
    const base = tile.userData.basePos;
    tile.position.y = base.y + Math.sin(t * 0.6 + seed) * 0.18;
    // Subtle frame pulse
    const frame = tile.userData.frame;
    if (frame) frame.material.opacity = 0.45 + Math.sin(t * 1.3 + seed) * 0.12;
  }

  // Core animation
  if (core.userData.tick) core.userData.tick(t);

  // Hover detection
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(tiles, true);
  let hit = null;
  if (hits.length) {
    let n = hits[0].object;
    while (n && !n.userData.item) n = n.parent;
    if (n && n.visible) hit = n;
  }
  if (hit !== hovered) {
    if (hovered) {
      hovered.userData.frame.material.color.set(hovered.userData.category.color);
      hovered.scale.setScalar(1);
    }
    hovered = hit;
    if (hovered) {
      hovered.userData.frame.material.color.set(0xffffff);
      hovered.scale.setScalar(1.08);
      tipEl.style.opacity = "1";
      tipTitle.textContent = hovered.userData.item.title;
      tipBy.textContent = hovered.userData.item.author
        ? `${hovered.userData.item.author} · ${hovered.userData.category.label}`
        : hovered.userData.category.label;
      document.body.style.cursor = "pointer";
    } else {
      tipEl.style.opacity = "0";
      document.body.style.cursor = "default";
    }
  }

  // Camera fly-to easing
  if (flying) {
    const k = Math.min(1, (performance.now() - flying.t0) / flying.dur);
    const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
    camera.position.lerpVectors(flying.fromPos, flying.toPos, e);
    controls.target.lerpVectors(flying.fromTarget, flying.toTarget, e);
    if (k >= 1) flying = null;
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Hide loader after first frame, then auto-play the cinematic on first visit.
requestAnimationFrame(() => {
  animate();
  setTimeout(() => {
    document.getElementById("loader").classList.add("gone");
    let seen = false;
    try { seen = sessionStorage.getItem("introSeen") === "1"; } catch {}
    if (!seen) setTimeout(playIntro, 250);
  }, 350);
});
