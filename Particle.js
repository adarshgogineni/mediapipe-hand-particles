class Particle {
  constructor(w, h) {
    this.pos = createVector(random(w), random(h));
    this.vel = p5.Vector.random2D().mult(random(0.5, 2.0));
    this.acc = createVector(0, 0);
    this.size = random(3, 9);
    this.hue = random(0, 360);
  }

  applyForce(lx, ly, mode) {
    let target = createVector(lx, ly);
    let force = p5.Vector.sub(this.pos, target);
    let d = force.mag();
    let radius = 200;
    if (d < radius && d > 1) {
      force.normalize();
      let strength = map(d, 0, radius, 14, 0);
      if (mode === 'attract') force.mult(-strength * 0.7);
      else force.mult(strength);
      this.acc.add(force);
    }
  }

  update() {
    // Perlin noise drift — organic flow when no hands present
    let angle = noise(this.pos.x * 0.003, this.pos.y * 0.003, frameCount * 0.005) * TWO_PI * 2;
    this.acc.add(p5.Vector.fromAngle(angle).mult(0.15));

    this.vel.add(this.acc);
    this.vel.limit(8);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.vel.mult(0.92);
  }

  edges(w, h) {
    if (this.pos.x < 0) this.pos.x = w;
    if (this.pos.x > w) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = h;
    if (this.pos.y > h) this.pos.y = 0;
  }

  draw() {
    let speed = this.vel.mag();
    let dynamicHue = (this.hue + speed * 20) % 360;
    noStroke();
    colorMode(HSB, 360, 100, 100, 100);
    // Soft outer glow
    fill(dynamicHue, 85, 100, 22);
    circle(this.pos.x, this.pos.y, this.size * 4);
    // Bright core
    fill(dynamicHue, 70, 100, 92);
    circle(this.pos.x, this.pos.y, this.size);
    colorMode(RGB, 255, 255, 255, 255);
  }
}
