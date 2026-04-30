# GTM AI Canvas

A 3D living canvas of the work the **Equinix · GTM Enablement** team built during the April AI sprint — apps, art, dashboards, strategy decks, animations, and courses, arranged as floating clusters around a glowing core.

**Live:** https://rizqureshy.github.io/AI-April-Portfolio/

## Repo structure

```
.
├── index.html          # entry shell, styles, splash gate, modal viewer
├── app.js              # main: gate → audio → intro, raycaster, modal, filter chips
├── scene.js            # Three.js scene: starfield, nebula, lights, controls, core
├── tiles.js            # tile factory: cover art, video frames, slide-style cards
├── data.js             # asset manifest grouped by category
├── README.md
└── assets/
    ├── art/            # AI art portraits, sketches, concept renders
    ├── dashboards/     # dashboard screenshots
    ├── decks/          # PowerPoint strategy decks
    ├── animations/     # short films & animation stills
    ├── courses/        # course / lesson cover imagery
    ├── audio/          # background soundtrack (successtrack.mp3)
    └── shortcuts/      # legacy .url bookmark files for the live apps
```

## Adding new content

1. Drop the file into the right `assets/<category>/` folder.
2. Add an entry to the corresponding category in `data.js`. Use the helper:
   ```js
   { type: "image", title: "My piece", author: "Name", file: f("art", "my piece.jpg") }
   ```
   `type` is one of `image`, `video`, `app`, or `deck`.
3. Commit & push. The next page load picks it up automatically — no other code changes needed.

To add a category, append it to `CATEGORIES` and add a key to `FOLDERS` and `ITEMS`.

## Tech

- [Three.js](https://threejs.org/) (loaded via CDN import map)
- Pure HTML/CSS/JS — no build step
- App tile screenshots via [thum.io](https://www.thumbio.com/)
- PowerPoint preview via Microsoft Office Online viewer
