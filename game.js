"use strict";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener("keydown", (e) => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code))
    e.preventDefault();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap = (v, max) => ((v % max) + max) % max;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII = [0, 16, 30, 50]; // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32]; // velocidad base por tamaño
const POINTS = [0, 100, 50, 20]; // puntos por tamaño

// Silueta fija para una variante de asteroide grande (coordenadas normalizadas al radio)
const BIG_SHAPE = [
  [-0.04, -1.0],
  [0.53, -0.82],
  [0.41, -0.2],
  [0.99, -0.02],
  [0.82, 0.61],
  [0.31, 0.59],
  [0.07, 1.0],
  [-0.65, 0.65],
  [-0.98, 0.05],
  [-0.82, -0.59],
];
const BIG_SHAPE_CHANCE = 0.33;

class Asteroid {
  constructor(x, y, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    if (size === 3 && Math.random() < BIG_SHAPE_CHANCE) {
      this.verts = BIG_SHAPE.map(([vx, vy]) => [
        vx * this.radius,
        vy * this.radius,
      ]);
      return;
    }

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.burstLeft = 0;
    this.burstTimer = 0;
    this.dead = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;

    const ROT = 3.5; // rad/s
    const THRUST = hyperTimer > 0 ? 260 * HYPER_BOOST : 260; // px/s²
    const DRAG = 0.987;

    if (keys["ArrowLeft"]) this.angle -= ROT * dt;
    if (keys["ArrowRight"]) this.angle += ROT * dt;

    this.thrusting = !!keys["ArrowUp"];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead || this.burstLeft > 0) return;
    this.burstLeft = 1;
    this.burstTimer = 0;
  }

  updateBurst(dt) {
    if (this.burstLeft <= 0 || this.dead) return [];
    this.burstTimer -= dt;
    if (this.burstTimer > 0) return [];
    const BURST_GAP = 0.08;
    this.burstLeft--;
    this.burstTimer = BURST_GAP;
    if (this.burstLeft === 0) this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (tripleTimer > 0)
      return [-TRIPLE_SPREAD, 0, TRIPLE_SPREAD].map(
        (d) => new Bullet(ox, oy, this.angle + d)
      );
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;
    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
      return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.lineJoin = "round";

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo(20, 0); // nariz
    ctx.lineTo(-12, -9); // ala izquierda
    ctx.lineTo(-7, 0); // muesca trasera
    ctx.lineTo(-12, 9); // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14) * (hyperTimer > 0 ? 2 : 1), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = "rgba(255, 130, 0, 0.85)";
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Power-up: disparo triple ──────────────────────────────────────────────────
const TRIPLE_DURATION = 5;
const TRIPLE_DROP_CHANCE = 0.2;
const TRIPLE_SPREAD = 0.2;
const PICKUP_TTL = 15;

// ── Escudo temporal ───────────────────────────────────────────────────────────
const SHIELD_DURATION = 5;

// ── Cámara lenta ──────────────────────────────────────────────────────────────
const SLOW_DURATION = 6;
const SLOW_FACTOR = 0.5;

// ── Hiperpropulsión ───────────────────────────────────────────────────────────
const HYPER_DURATION = 8;
const HYPER_BOOST = 2.5;
const DOUBLE_TAP_WINDOW = 0.3;

// ── Bomba nova ────────────────────────────────────────────────────────────────
const NOVA_KILL_RATIO = 1 / 3;
const NOVA_RADIUS = 250;
const NOVA_SPEED = 500;
const ASTEROIDS_PER_BIG = 7; // 1 grande + 2 medianos + 4 pequeños

class NovaWave {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 0;
    this.dead = false;
  }

  update(dt) {
    this.r += NOVA_SPEED * dt;
    if (this.r >= NOVA_RADIUS) this.dead = true;
  }

  draw() {
    const alpha = 1 - this.r / NOVA_RADIUS;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 140, 40, ${alpha.toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBombIcon(x, y, ready) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = ready ? "rgb(255, 140, 40)" : "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 2, 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(4, -3);
  ctx.quadraticCurveTo(6, -8, 9, -7);
  ctx.stroke();
  if (ready) {
    ctx.fillStyle = "rgb(255, 220, 80)";
    ctx.beginPath();
    ctx.arc(9, -7, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawShield() {
  if (shieldTimer < 1 && Math.floor(shieldTimer * 8) % 2 === 0) return;
  ctx.save();
  ctx.strokeStyle = "rgba(80, 160, 255, 0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ship.x, ship.y, ship.radius + 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

class PowerUp {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(15, 35);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 10;
    this.ttl = PICKUP_TTL;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = "#0ff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (const d of [-0.5, 0, 0.5]) {
      const a = -Math.PI / 2 + d;
      ctx.moveTo(0, 4);
      ctx.lineTo(Math.cos(a) * 7, 4 + Math.sin(a) * 9);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerUps;
let score, lives, level;
let tripleSpawned, tripleTimer;
let shieldGiven, shieldTimer;
let slowTimer;
let hyperGiven, hyperTimer, upTapTimer;
let novaState, novaWave, levelKills, levelTotal; // novaState: 'locked' | 'ready' | 'used'
let state; // 'playing' | 'dead' | 'gameover'
let deadTimer;

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship = new Ship();
  bullets = [];
  asteroids = [];
  particles = [];
  powerUps = [];
  tripleSpawned = false;
  tripleTimer = 0;
  shieldGiven = false;
  shieldTimer = 0;
  slowTimer = 0;
  hyperGiven = false;
  hyperTimer = 0;
  upTapTimer = 0;
  score = 0;
  lives = 3;
  level = 1;
  state = "playing";
  resetNova(4);
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets = [];
  particles = [];
  powerUps = [];
  tripleSpawned = false;
  shieldGiven = false;
  hyperGiven = false;
  ship.reset();
  resetNova(3 + level);
  spawnAsteroids(3 + level);
}

function resetNova(bigCount) {
  novaState = "locked";
  novaWave = null;
  levelKills = 0;
  levelTotal = bigCount * ASTEROIDS_PER_BIG;
}

function updateNova(dt) {
  if (novaState === "locked" && levelKills >= Math.ceil(levelTotal * NOVA_KILL_RATIO))
    novaState = "ready";
  if (!novaWave) return;
  novaWave.update(dt);
  for (const a of asteroids) {
    if (!a.dead && dist(novaWave, a) < novaWave.r + a.radius) {
      a.dead = true;
      levelKills++;
      score += POINTS[a.size];
      explode(a.x, a.y, a.size * 5);
    }
  }
  asteroids = asteroids.filter((a) => !a.dead);
  if (novaWave.dead) novaWave = null;
}

function explode(x, y, count = 8) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  tripleTimer = 0;
  shieldTimer = 0;
  hyperTimer = 0;
  lives--;
  if (lives <= 0) {
    state = "gameover";
  } else {
    state = "dead";
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === "gameover") {
    if (pressed("Space")) initGame();
    particles.forEach((p) => p.update(dt));
    particles = particles.filter((p) => !p.dead);
    return;
  }

  if (state === "dead") {
    deadTimer -= dt;
    particles.forEach((p) => p.update(dt));
    particles = particles.filter((p) => !p.dead);
    asteroids.forEach((a) => a.update(slowTimer > 0 ? dt * SLOW_FACTOR : dt));
    if (slowTimer > 0) slowTimer -= dt;
    powerUps.forEach((p) => p.update(dt));
    powerUps = powerUps.filter((p) => !p.dead);
    updateNova(dt);
    if (deadTimer <= 0) {
      state = "playing";
      ship.reset();
    }
    return;
  }

  // Disparar
  if (pressed("Space")) ship.tryShoot();
  if (pressed("KeyS") && !shieldGiven) {
    shieldGiven = true;
    shieldTimer = SHIELD_DURATION;
  }
  if (pressed("ArrowUp")) {
    if (upTapTimer > 0 && !hyperGiven) {
      hyperGiven = true;
      hyperTimer = HYPER_DURATION;
    }
    upTapTimer = DOUBLE_TAP_WINDOW;
  }
  if (pressed("KeyF") && novaState === "ready") {
    novaState = "used";
    novaWave = new NovaWave(ship.x, ship.y);
  }
  bullets.push(...ship.updateBurst(dt));

  ship.update(dt);
  bullets.forEach((b) => b.update(dt));
  asteroids.forEach((a) => a.update(slowTimer > 0 ? dt * SLOW_FACTOR : dt));
  particles.forEach((p) => p.update(dt));
  powerUps.forEach((p) => p.update(dt));
  if (tripleTimer > 0) tripleTimer -= dt;
  if (slowTimer > 0) slowTimer -= dt;
  if (shieldTimer > 0) shieldTimer -= dt;
  if (hyperTimer > 0) hyperTimer -= dt;
  if (upTapTimer > 0) upTapTimer -= dt;

  bullets = bullets.filter((b) => !b.dead);
  particles = particles.filter((p) => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        levelKills++;
        score += POINTS[a.size];
        explode(a.x, a.y, a.size * 5);
        newAsteroids.push(...a.split());
        if (!tripleSpawned && Math.random() < TRIPLE_DROP_CHANCE) {
          powerUps.push(new PowerUp(a.x, a.y));
          tripleSpawned = true;
          slowTimer = SLOW_DURATION;
        }
      }
    }
  }
  asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
  bullets = bullets.filter((b) => !b.dead);

  // Nave vs power-up
  for (const p of powerUps) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      tripleTimer = TRIPLE_DURATION;
    }
  }
  powerUps = powerUps.filter((p) => !p.dead);

  updateNova(dt);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (dist(ship, a) < ship.radius + a.radius * 0.82) {
        if (shieldTimer > 0) {
          shieldTimer = 0;
          ship.invincible = 1;
          a.dead = true;
          levelKills++;
          score += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          asteroids = asteroids.filter((x) => !x.dead).concat(a.split());
        } else {
          killShip();
        }
        break;
      }
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = "#fff";
  ctx.font = "15px monospace";

  ctx.textAlign = "left";
  ctx.fillText(`SCORE  ${score}`, 14, 26);

  ctx.textAlign = "center";
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++) drawLifeIcon(W - 16 - i * 22, 18);
  if (novaState !== "used") drawBombIcon(W - 24 - lives * 22, 18, novaState === "ready");

  if (tripleTimer > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = "#0ff";
    ctx.fillText(`TRIPLE  ${Math.ceil(tripleTimer)}s`, 14, 48);
  }

  if (shieldTimer > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = "rgb(80, 160, 255)";
    ctx.fillText(`ESCUDO  ${Math.ceil(shieldTimer)}s`, 14, 70);
  }

  if (slowTimer > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = "rgb(255, 200, 80)";
    ctx.fillText(`LENTO  ${Math.ceil(slowTimer)}s`, 14, 92);
  }

  if (hyperTimer > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = "rgb(255, 90, 200)";
    ctx.fillText(`HIPER  ${Math.ceil(hyperTimer)}s`, 14, 114);
  }
}

function drawOverlay(title, sub) {
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = "bold 46px monospace";
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font = "18px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  particles.forEach((p) => p.draw());
  asteroids.forEach((a) => a.draw());
  powerUps.forEach((p) => p.draw());
  if (novaWave) novaWave.draw();
  bullets.forEach((b) => b.draw());
  ship.draw();
  if (shieldTimer > 0 && !ship.dead) drawShield();

  drawHUD();

  if (state === "gameover")
    drawOverlay("GAME OVER", `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
