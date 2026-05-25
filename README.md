# Hand Particles

MediaPipe hand tracking + p5.js particle system. 3000 particles repel from your fingertips, attract on pinch.

## Run locally

Camera requires localhost or HTTPS:

```bash
npx serve .
```

Open http://localhost:3000

## Controls

| Gesture | Effect |
|---|---|
| Move hand | Particles repel from each fingertip |
| Pinch (thumb + index) | Particles attract toward fingertips |
| Two hands | Both hands active simultaneously |

## Deploy to GitHub Pages

```bash
gh repo create mediapipe-hand-particles --public --source=. --push
```

Then: GitHub repo → Settings → Pages → Branch: `main` → `/` (root) → Save.

Live at: `https://YOUR_USERNAME.github.io/mediapipe-hand-particles/`
