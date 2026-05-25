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
