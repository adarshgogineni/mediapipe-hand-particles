const PARTICLE_COUNT = 6000;
const FINGERTIPS = [4, 8, 12, 16, 20];
const FLOW_COLS = 40;
const FLOW_ROWS = 25;

let particles = [];
let videoEl;
let handLandmarks = [];
let prevPinching = [];
let flowField = new Float32Array(FLOW_COLS * FLOW_ROWS);

function isPinching(landmarks) {
  let t = landmarks[4];
  let i = landmarks[8];
  return dist(t.x, t.y, i.x, i.y) < 0.06;
}

// Pre-sampled Perlin flow field — 1000 noise() calls every 2 frames
// vs 6000 calls every frame previously
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
    onFrame: async () => {
      await hands.send({ image: videoEl });
    },
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

  // Raw canvas trail overlay — faster than p5 fill/rect
  drawingContext.fillStyle = 'rgba(0,0,0,0.12)';
  drawingContext.fillRect(0, 0, width, height);

  if (frameCount % 2 === 0) updateFlowField();

  // Pre-compute pinch state per hand, detect pinch → open transition
  let pinchStates = [];
  for (let hi = 0; hi < handLandmarks.length; hi++) {
    let pinching = isPinching(handLandmarks[hi]);
    pinchStates.push({
      pinching,
      justReleased: !pinching && prevPinching[hi] === true
    });
    prevPinching[hi] = pinching;
  }

  let ctx = drawingContext;
  for (let p of particles) {
    for (let hi = 0; hi < handLandmarks.length; hi++) {
      let landmarks = handLandmarks[hi];
      let { pinching, justReleased } = pinchStates[hi];

      if (justReleased) {
        // Explosion burst from index fingertip on pinch release
        let lm = landmarks[8];
        p.explode((1 - lm.x) * width, lm.y * height);
      }

      let mode = pinching ? 'attract' : 'repel';
      for (let idx of FINGERTIPS) {
        let lm = landmarks[idx];
        p.applyForce((1 - lm.x) * width, lm.y * height, mode);
      }
    }

    p.update(getFlowAngle(p.pos.x, p.pos.y));
    p.edges(width, height);
    p.draw(ctx);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
