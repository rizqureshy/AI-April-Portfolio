// app.js — entry point. Wires the scene, tiles, raycaster, modal, and filters.
import * as THREE from "three";
import { createScene } from "./scene.js";
import { buildTiles } from "./tiles.js";
import { CATEGORIES, ITEMS, TEAM_NAME, APP_NAME } from "./data.js";

// ------------- bootstrap scene -------------
const container = document.body;
const { scene, camera, renderer, controls, core, skyTick } = createScene(container);
const { tiles, labelGroup } = buildTiles(scene);

// World pivot: a single group we can spin during the intro reveal.
const world = new THREE.Group();
scene.add(world);
[...tiles].forEach((t) => world.attach(t));
labelGroup.children.slice().forEach((l) => world.attach(l));
let worldSpin = 0;       // continuous Y rotation applied each frame
let worldSpinDecay = 0;  // speed (rad/s); decays to zero after the reveal phase

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

// ------------- background audio -------------
const bgAudio = document.getElementById("bg-audio");
const muteBtn = document.getElementById("btn-mute");
const TARGET_VOLUME = 0.18;
let userMuted = false;
bgAudio.volume = 0;
bgAudio.loop = true;

function fadeAudioTo(targetVol, ms = 1200) {
  const startVol = bgAudio.volume;
  const t0 = performance.now();
  const step = () => {
    const k = Math.min(1, (performance.now() - t0) / ms);
    bgAudio.volume = startVol + (targetVol - startVol) * k;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

async function tryStartAudio() {
  if (userMuted) return;
  try {
    await bgAudio.play();
    fadeAudioTo(TARGET_VOLUME, 1500);
    refreshMuteBtn();
  } catch {
    // Autoplay was blocked — wait for the next user gesture.
  }
}

function refreshMuteBtn() {
  const off = userMuted || bgAudio.paused;
  muteBtn.textContent = off ? "🔇 Music" : "🔊 Music";
  muteBtn.classList.toggle("active", !off);
  muteBtn.setAttribute("aria-pressed", String(!off));
}

muteBtn.addEventListener("click", async () => {
  if (bgAudio.paused) {
    userMuted = false;
    try { await bgAudio.play(); fadeAudioTo(TARGET_VOLUME, 600); } catch {}
  } else {
    userMuted = true;
    fadeAudioTo(0, 400);
    setTimeout(() => bgAudio.pause(), 420);
  }
  refreshMuteBtn();
});

// ------------- enter-the-canvas gate -------------
const gateEl = document.getElementById("gate");
const gateBtn = document.getElementById("gate-enter");

async function enterCanvas() {
  if (gateEl.classList.contains("gone")) return;
  gateEl.classList.add("gone");
  // The click is a user gesture, so we can start audio + intro safely now.
  tryStartAudio();
  setTimeout(() => playIntro(), 250);
  setTimeout(() => { gateEl.style.display = "none"; }, 900);
}
gateBtn.addEventListener("click", enterCanvas);
window.addEventListener("keydown", (e) => {
  if (!gateEl.classList.contains("gone") && (e.key === "Enter" || e.key === " ")) enterCanvas();
}, { capture: true });

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
  hero.classList.remove("compact");
  hero.classList.remove("hidden");
  skipBtn.classList.add("show");

  // Phase 1 — spin reveal: hold the camera close to home and spin the world a full turn
  // so each cluster name (Apps, Art, Dashboards, Decks, Animations, Courses) sweeps past.
  // Cluster labels pulse a touch larger to read clearly during the reveal.
  const REVEAL_DURATION = 5400; // ~5.4 seconds, full 360°
  // Reset world to a known orientation so a replay starts from the same place.
  world.rotation.set(0, 0, 0);
  worldSpinDecay = (Math.PI * 2) / (REVEAL_DURATION / 1000);
  worldSpin = worldSpinDecay;

  // Camera sits slightly elevated near home so clusters read clearly through the fog.
  camera.position.set(0, 22, 96);
  controls.target.set(0, 0, 0);

  // Temporarily lift the fog so distant tiles are still visible during the spin.
  if (scene.fog) {
    scene.userData.fogDensity = scene.fog.density;
    scene.fog.density = scene.fog.density * 0.35;
  }

  pulseLabels(REVEAL_DURATION);

  // Phase 2 — once the reveal completes, start the original waypoint flythrough.
  introTimer = setTimeout(() => {
    if (!introPlaying) return;
    worldSpinDecay = 0; // freeze world for the camera flythrough
    hero.classList.add("hidden");

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
  }, REVEAL_DURATION + 200);
}

// Briefly pulse cluster labels so they read clearly during the reveal phase.
function pulseLabels(durationMs) {
  const t0 = performance.now();
  const baseScales = labelGroup.children.map((s) => s.scale.x);
  const tick = () => {
    const k = Math.min(1, (performance.now() - t0) / durationMs);
    // smooth in/out on a sin curve
    const s = 1 + Math.sin(k * Math.PI) * 0.18;
    labelGroup.children.forEach((sprite, i) => {
      sprite.scale.x = baseScales[i] * s;
      sprite.scale.y = (baseScales[i] / 4) * s; // labels are 18 wide × 4.5 tall
    });
    if (k < 1 && introPlaying) requestAnimationFrame(tick);
    else labelGroup.children.forEach((sprite, i) => { sprite.scale.x = baseScales[i]; sprite.scale.y = baseScales[i] / 4; });
  };
  requestAnimationFrame(tick);
}

function skipIntro() {
  if (!introPlaying) return;
  flyCameraTo(HOME_POS, HOME_TARGET, 600);
  endIntro(true);
}

function endIntro(skipped = false) {
  introPlaying = false;
  if (introTimer) { clearTimeout(introTimer); introTimer = null; }
  worldSpinDecay = 0;
  worldSpin = 0;
  // Restore the fog if we'd softened it for the reveal.
  if (scene.fog && scene.userData.fogDensity != null) {
    scene.fog.density = scene.userData.fogDensity;
    scene.userData.fogDensity = null;
  }
  skipBtn.classList.remove("show");
  controls.enabled = true;
  if (!skipped) {
    // Post-splash: show the title as a slim top banner above the canvas, not over it.
    hero.classList.add("compact");
    hero.classList.remove("hidden");
    setTimeout(() => hero.classList.add("hidden"), 4000);
  }
  try { sessionStorage.setItem("introSeen_v2", "1"); } catch {}
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

  // World spin during intro reveal
  if (worldSpinDecay > 0) {
    world.rotation.y += worldSpinDecay * dt;
  }

  // Bobbing on tiles (their basePos was captured before re-parenting, so it's still accurate locally)
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const seed = tile.userData.seed;
    const base = tile.userData.basePos;
    tile.position.y = base.y + Math.sin(t * 0.6 + seed) * 0.18;
    // Subtle frame pulse
    const frame = tile.userData.frame;
    if (frame) frame.material.opacity = 0.45 + Math.sin(t * 1.3 + seed) * 0.12;
  }

  // Core + sky ticks
  if (core.userData.tick) core.userData.tick(t);
  if (skyTick) skyTick(t);

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

// Hide loader after first frame. The gate handles autoplay + intro on user click.
requestAnimationFrame(() => {
  animate();
  setTimeout(() => document.getElementById("loader").classList.add("gone"), 350);
});
