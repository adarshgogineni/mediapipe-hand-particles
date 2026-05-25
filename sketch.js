const PARTICLE_COUNT = 3000;
const FINGERTIPS = [4, 8, 12, 16, 20];
let particles = [];
let videoEl;
let handLandmarks = [];

function isPinching(landmarks) {
  let t = landmarks[4];
  let i = landmarks[8];
  return dist(t.x, t.y, i.x, i.y) < 0.06;
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

  noStroke();
  fill(0, 0, 0, 50);
  rect(0, 0, width, height);

  for (let p of particles) {
    for (let landmarks of handLandmarks) {
      let mode = isPinching(landmarks) ? 'attract' : 'repel';
      for (let idx of FINGERTIPS) {
        let lm = landmarks[idx];
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
