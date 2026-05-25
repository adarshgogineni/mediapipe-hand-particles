class Particle {
  constructor(w, h) {
    this.pos = createVector(random(w), random(h));
    this.vel = p5.Vector.random2D().mult(random(0.5, 2.0));
    this.acc = createVector(0, 0);
    this.size = random(1.5, 5); // radius for ctx.arc
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

  explode(lx, ly) {
    let force = p5.Vector.sub(this.pos, createVector(lx, ly));
    let d = force.mag();
    if (d < 400 && d > 1) {
      force.normalize();
      force.mult(map(d, 0, 400, 32, 8));
      this.acc.add(force);
    }
  }

  // flowAngle pre-computed by sketch — avoids noise() call per particle
  update(flowAngle) {
    this.acc.add(p5.Vector.fromAngle(flowAngle).mult(0.15));
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

  // Raw canvas calls — no colorMode switching overhead
  draw(ctx) {
    let speed = this.vel.mag();
    let h = (this.hue + speed * 20) % 360;
    let r = this.size;
    const TAU = Math.PI * 2;

    ctx.fillStyle = `hsla(${h},100%,60%,0.08)`;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, r * 3, 0, TAU);
    ctx.fill();

    ctx.fillStyle = `hsla(${h},80%,88%,0.92)`;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, r, 0, TAU);
    ctx.fill();
  }
}
