# MediaPipe Hand Particle Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Browser-based demo where 3000 particles repel from your hands (attract on pinch) using MediaPipe hand landmarks + p5.js, with live webcam feed as background.

**Architecture:** p5.js owns the canvas draw loop and particle physics. MediaPipe Hands runs in parallel via Camera utils, writing detected landmarks to a shared `handLandmarks` array each frame. p5's `createCapture` starts the webcam; MediaPipe reads from the same `.elt` reference — one camera, no conflict.

**Tech Stack:** p5.js 1.9.4 (CDN), @mediapipe/hands (CDN), @mediapipe/camera_utils (CDN), vanilla JS ES6, no bundler.

---

## File Map

| File | Responsibility |
|---|---|
| `index.html` | HTML shell, CDN script tags |
| `Particle.js` | Particle class: position, velocity, force application, draw |
| `sketch.js` | p5.js sketch: setup, draw loop, webcam bg, MediaPipe init, particle orchestration |

---

### Task 1: Project Scaffold

**Files:**
- Create: `index.html`
- Create: `Particle.js`
- Create: `sketch.js`

- [ ] **Step 1: Init git repo**

```bash
cd mediapipe-hand-particles
git init
```

- [ ] **Step 2: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hand Particles</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; }
  </style>
</head>
<body>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="Particle.js"></script>
  <script src="sketch.js"></script>
</body>
</html>
```

- [ ] **Step 3: Create `Particle.js` (stub)**

```javascript
class Particle {
  constructor(w, h) {}
  applyForce(lx, ly, mode) {}
  update() {}
  edges(w, h) {}
  draw() {}
}
```

- [ ] **Step 4: Create `sketch.js` (stub)**

```javascript
function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
```

- [ ] **Step 5: Verify scaffold loads**

Start local server (camera requires localhost or HTTPS):
```bash
npx serve .
```
Open `http://localhost:3000`. Black canvas, no console errors.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: project scaffold with CDN imports"
```

---

### Task 2: Webcam Background

**Files:**
- Modify: `sketch.js`

- [ ] **Step 1: Replace `sketch.js` with webcam setup**

```javascript
let capture;

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.size(width, height);
  capture.hide();
}

function draw() {
  // Mirror horizontally for selfie orientation
  push();
  translate(width, 0);
  scale(-1, 1);
  image(capture, 0, 0, width, height);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
```

- [ ] **Step 2: Verify webcam appears**

Reload. Browser prompts for camera. After allowing: mirrored webcam feed fills canvas. You should see yourself.

- [ ] **Step 3: Commit**

```bash
git add sketch.js
git commit -m "feat: mirrored webcam background"
```

---

### Task 3: Particle Class + System

**Files:**
- Modify: `Particle.js`
- Modify: `sketch.js`

- [ ] **Step 1: Implement `Particle.js`**

```javascript
class Particle {
  constructor(w, h) {
    this.pos = createVector(random(w), random(h));
    this.vel = p5.Vector.random2D().mult(random(0.3, 1.2));
    this.acc = createVector(0, 0);
    this.size = random(2, 5);
    this.hue = random(180, 300); // purple-to-cyan range
  }

  applyForce(lx, ly, mode) {
    let target = createVector(lx, ly);
    let force = p5.Vector.sub(this.pos, target);
    let d = force.mag();
    let radius = 160;
    if (d < radius && d > 1) {
      force.normalize();
      let strength = map(d, 0, radius, 10, 0);
      if (mode === 'attract') force.mult(-strength * 0.7);
      else force.mult(strength);
      this.acc.add(force);
    }
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(7);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.vel.mult(0.92); // friction
  }

  edges(w, h) {
    if (this.pos.x < 0) this.pos.x = w;
    if (this.pos.x > w) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = h;
    if (this.pos.y > h) this.pos.y = 0;
  }

  draw() {
    let speed = this.vel.mag();
    let dynamicHue = (this.hue + speed * 15) % 360;
    noStroke();
    colorMode(HSB, 360, 100, 100, 100);
    fill(dynamicHue, 80, 100, 80);
    colorMode(RGB, 255, 255, 255, 255);
    circle(this.pos.x, this.pos.y, this.size);
  }
}
```

- [ ] **Step 2: Add particle system to `sketch.js`**

```javascript
const PARTICLE_COUNT = 3000;
let particles = [];
let capture;

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO);
  capture.size(width, height);
  capture.hide();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle(width, height));
  }
}

function draw() {
  // Webcam background (mirrored)
  push();
  translate(width, 0);
  scale(-1, 1);
  image(capture, 0, 0, width, height);
  pop();

  // Semi-transparent overlay creates particle trails
  noStroke();
  fill(0, 0, 0, 50);
  rect(0, 0, width, height);

  for (let p of particles) {
    p.update();
    p.edges(width, height);
    p.draw();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
```

- [ ] **Step 3: Verify particles visible**

Reload. Webcam in background. 3000 colored dots drift across screen with fading trails. FPS should stay above 30 on a modern laptop.

- [ ] **Step 4: Commit**

```bash
git add Particle.js sketch.js
git commit -m "feat: 3000-particle system with velocity-reactive colors and trails"
```

---

### Task 4: MediaPipe Hands Integration

**Files:**
- Modify: `sketch.js`

- [ ] **Step 1: Replace `sketch.js` with MediaPipe setup**

```javascript
const PARTICLE_COUNT = 3000;
let particles = [];
let capture;
let handLandmarks = []; // updated each frame by MediaPipe

function setupMediaPipe(videoEl) {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  });

  hands.onResults((results) => {
    handLandmarks = results.multiHandLandmarks || [];
  });

  const camera = new Camera(videoEl, {
    onFrame: async () => {
      await hands.send({ image: videoEl });
    },
    width: 640,
    height: 480
  });
  camera.start();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // Pass video element to MediaPipe once capture is ready
  capture = createCapture(VIDEO, () => {
    setupMediaPipe(capture.elt);
  });
  capture.size(width, height);
  capture.hide();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle(width, height));
  }
}

function draw() {
  push();
  translate(width, 0);
  scale(-1, 1);
  image(capture, 0, 0, width, height);
  pop();

  noStroke();
  fill(0, 0, 0, 50);
  rect(0, 0, width, height);

  for (let p of particles) {
    p.update();
    p.edges(width, height);
    p.draw();
  }

  // Debug: confirm landmark detection (remove after verifying)
  if (frameCount % 60 === 0) {
    console.log('hands detected:', handLandmarks.length);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
```

- [ ] **Step 2: Verify landmarks detected**

Reload. Open DevTools console. Hold hand up to camera. Every ~60 frames: `hands detected: 1`. Two hands → `hands detected: 2`. No hands → `hands detected: 0`.

- [ ] **Step 3: Remove debug log from `sketch.js`**

Delete these two lines from `draw()`:
```javascript
  if (frameCount % 60 === 0) {
    console.log('hands detected:', handLandmarks.length);
  }
```

- [ ] **Step 4: Commit**

```bash
git add sketch.js
git commit -m "feat: MediaPipe Hands landmark detection"
```

---

### Task 5: Repel Force + Pinch Attract

**Files:**
- Modify: `sketch.js`

- [ ] **Step 1: Replace `sketch.js` with force application**

```javascript
const PARTICLE_COUNT = 3000;
const FINGERTIPS = [4, 8, 12, 16, 20]; // MediaPipe landmark indices for fingertips
let particles = [];
let capture;
let handLandmarks = [];

function isPinching(landmarks) {
  // Thumb tip = index 4, index fingertip = index 8
  // Normalized coords: distance < 0.06 = pinching
  let t = landmarks[4];
  let i = landmarks[8];
  return dist(t.x, t.y, i.x, i.y) < 0.06;
}

function setupMediaPipe(videoEl) {
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.5
  });

  hands.onResults((results) => {
    handLandmarks = results.multiHandLandmarks || [];
  });

  const camera = new Camera(videoEl, {
    onFrame: async () => {
      await hands.send({ image: videoEl });
    },
    width: 640,
    height: 480
  });
  camera.start();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  capture = createCapture(VIDEO, () => {
    setupMediaPipe(capture.elt);
  });
  capture.size(width, height);
  capture.hide();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle(width, height));
  }
}

function draw() {
  push();
  translate(width, 0);
  scale(-1, 1);
  image(capture, 0, 0, width, height);
  pop();

  noStroke();
  fill(0, 0, 0, 50);
  rect(0, 0, width, height);

  for (let p of particles) {
    for (let landmarks of handLandmarks) {
      let mode = isPinching(landmarks) ? 'attract' : 'repel';
      for (let idx of FINGERTIPS) {
        let lm = landmarks[idx];
        // Mirror x: landmark 0=left/1=right in raw camera; we flipped canvas so match it
        let lx = (1 - lm.x) * width;
        let ly = lm.y * height;
        p.applyForce(lx, ly, mode);
      }
    }
    p.update();
    p.edges(width, height);
    p.draw();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
```

- [ ] **Step 2: Verify repel**

Reload. Hold hand up. Particles scatter away from fingertips. Move slowly — particles part like a force field around each finger.

- [ ] **Step 3: Verify attract**

Pinch thumb + index together. Particles swarm toward fingertips. Release → scatter again.

- [ ] **Step 4: Commit**

```bash
git add sketch.js
git commit -m "feat: repel/attract particle interaction via hand landmarks"
```

---

### Task 6: README + Deploy

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# Hand Particles

MediaPipe hand tracking + p5.js particle system. 3000 particles repel from your fingertips, attract on pinch.

## Run locally

Camera requires localhost or HTTPS:

\`\`\`bash
npx serve .
\`\`\`

Open http://localhost:3000

## Controls

| Gesture | Effect |
|---|---|
| Move hand | Particles repel from each fingertip |
| Pinch (thumb + index) | Particles attract toward fingertips |
| Two hands | Both hands active simultaneously |

## Deploy to GitHub Pages

\`\`\`bash
gh repo create mediapipe-hand-particles --public --source=. --push
\`\`\`

Then: GitHub repo → Settings → Pages → Branch: `main` → `/` (root) → Save.

Live at: `https://YOUR_USERNAME.github.io/mediapipe-hand-particles/`
```

- [ ] **Step 2: Final commit**

```bash
git add README.md
git commit -m "docs: add README with controls and deploy instructions"
```

- [ ] **Step 3: Push to GitHub Pages**

```bash
gh repo create mediapipe-hand-particles --public --source=. --push
```

Enable Pages: repo → Settings → Pages → Source: `main` branch → `/ (root)` → Save.

---

## Self-Review

**Spec coverage:**
- ✅ Web platform (p5.js + MediaPipe JS)
- ✅ Hand landmarks (21 points; using 5 fingertips per hand)
- ✅ 3000 particles
- ✅ Webcam visible as mirrored background
- ✅ Repel by default
- ✅ Attract on pinch (thumb tip + index tip distance < 0.06)
- ✅ Local server + GitHub Pages deploy
- ✅ ~1 hour build time (6 focused tasks)

**Placeholder scan:** No TBD/TODO/placeholder patterns present.

**Type consistency:**
- `applyForce(lx, ly, mode)` — defined Task 3, called Task 5 ✅
- `handLandmarks` array — initialized Task 4, used Task 5 ✅
- `FINGERTIPS` constant — defined and used Task 5 ✅
- `isPinching(landmarks)` — defined and called Task 5 ✅
- `capture.elt` — p5.js `.elt` gives raw HTMLVideoElement, passed to `setupMediaPipe()` Task 4 ✅
