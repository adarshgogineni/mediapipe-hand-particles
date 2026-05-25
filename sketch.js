const PARTICLE_COUNT = 5000;
const FINGERTIPS = [4, 8, 12, 16, 20];
const FLOW_COLS = 40;
const FLOW_ROWS = 25;
const TAU = Math.PI * 2;
const NUM_BUCKETS = 36;

let particles = [];
let videoEl;
let handLandmarks = [];

// Simple pinch state — boolean is harder to break than per-hand index tracking
let pinchActive = false;
let pinchOriginX = 0;
let pinchOriginY = 0;

const buckets = Array.from({ length: NUM_BUCKETS }, () => []);
let flowField = new Float32Array(FLOW_COLS * FLOW_ROWS);

function isPinching(landmarks) {
  let t = landmarks[4], i = landmarks[8];
  return dist(t.x, t.y, i.x, i.y) < 0.06;
}

function updateFlowField() {
  let t = frameCount * 0.005;
  for (let row = 0; row < FLOW_ROWS; row++) {
    for (let col = 0; col < FLOW_COLS; col++) {
      flowField[row * FLOW_COLS + col] = noise(col * 0.1, row * 0.1, t) * Math.PI * 4;
    }
  }
}

function getFlowAngle(x, y) {
  let col = constrain(Math.floor(x / width * FLOW_COLS), 0, FLOW_COLS - 1);
  let row = constrain(Math.floor(y / height * FLOW_ROWS), 0, FLOW_ROWS - 1);
  return flowField[row * FLOW_COLS + col];
}

function setupMediaPipe() {
  videoEl = document.createElement('video');
  videoEl.setAttribute('playsinline', '');
  videoEl.style.display = 'none';
  document.body.appendChild(videoEl);

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
    onFrame: async () => { await hands.send({ image: videoEl }); },
    width: 1280,
    height: 720
  });
  camera.start();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  setupMediaPipe();
  updateFlowField();
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle(width, height));
  }
}

function draw() {
  if (videoEl && videoEl.readyState >= 2) {
    push();
    translate(width, 0);
    scale(-1, 1);
    drawingContext.drawImage(videoEl, 0, 0, width, height);
    pop();
  } else {
    background(0);
  }

  drawingContext.fillStyle = 'rgba(0,0,0,0.12)';
  drawingContext.fillRect(0, 0, width, height);

  if (frameCount % 2 === 0) updateFlowField();

  // Determine if ANY hand is currently pinching
  let nowPinching = false;
  for (let landmarks of handLandmarks) {
    if (isPinching(landmarks)) {
      nowPinching = true;
      // Keep updating origin while pinching so it's accurate at moment of release
      let lm = landmarks[8];
      pinchOriginX = (1 - lm.x) * width;
      pinchOriginY = lm.y * height;
      break;
    }
  }

  // Single boolean transition: was pinching → not pinching = explode
  let justReleased = pinchActive && !nowPinching;
  pinchActive = nowPinching;

  for (let p of particles) {
    if (justReleased) p.explode(pinchOriginX, pinchOriginY);

    for (let landmarks of handLandmarks) {
      let mode = isPinching(landmarks) ? 'attract' : 'repel';
      for (let idx of FINGERTIPS) {
        let lm = landmarks[idx];
        p.applyForce((1 - lm.x) * width, lm.y * height, mode);
      }
    }

    p.update(getFlowAngle(p.pos.x, p.pos.y));
    p.edges(width, height);
  }

  // Batched rendering
  let ctx = drawingContext;

  for (let b = 0; b < NUM_BUCKETS; b++) buckets[b].length = 0;
  for (let p of particles) {
    let speed = p.vel.mag();
    let b = Math.floor(((p.hue + speed * 20) % 360) / 10);
    buckets[b].push(p);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath();
  for (let p of particles) {
    ctx.moveTo(p.pos.x + p.size * 3, p.pos.y);
    ctx.arc(p.pos.x, p.pos.y, p.size * 3, 0, TAU);
  }
  ctx.fill();

  for (let b = 0; b < NUM_BUCKETS; b++) {
    if (!buckets[b].length) continue;
    ctx.fillStyle = `hsla(${b * 10 + 5},85%,72%,0.9)`;
    ctx.beginPath();
    for (let p of buckets[b]) {
      ctx.moveTo(p.pos.x + p.size, p.pos.y);
      ctx.arc(p.pos.x, p.pos.y, p.size, 0, TAU);
    }
    ctx.fill();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
