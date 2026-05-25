class Particle {
  constructor(w, h) {
    this.pos = createVector(random(w), random(h));
    this.vel = p5.Vector.random2D().mult(random(0.5, 2.0));
    this.acc = createVector(0, 0);
    this.size = random(2, 6);
    this.hue = random(0, 360);
    this.maxSpeed = 8;
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

  explode(lx, ly) {
    let dx = this.pos.x - lx;
    let dy = this.pos.y - ly;
    let d = Math.sqrt(dx * dx + dy * dy);

    let nx, ny;
    if (d < 15) {
      // At pinch point — random radial direction
      let angle = Math.random() * Math.PI * 2;
      nx = Math.cos(angle);
      ny = Math.sin(angle);
    } else {
      nx = dx / d;
      ny = dy / d;
    }

    let speed = map(Math.min(d, 500), 0, 500, 55, 10);
    // SET velocity directly — don't add to near-zero attract-mode vel
    this.vel.set(nx * speed, ny * speed);
    this.maxSpeed = 55;
  }

  update(flowAngle) {
    this.acc.add(p5.Vector.fromAngle(flowAngle).mult(0.15));
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    this.vel.mult(0.92);
    if (this.maxSpeed > 8) this.maxSpeed = Math.max(8, this.maxSpeed * 0.93);
  }

  edges(w, h) {
    if (this.pos.x < 0) this.pos.x = w;
    if (this.pos.x > w) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = h;
    if (this.pos.y > h) this.pos.y = 0;
  }
}
