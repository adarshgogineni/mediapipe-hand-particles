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
