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
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
