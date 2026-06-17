// ============================================================
//  DuckGame: pixel-art canvas game
//  You are a duck. Catch only the escaped grandmas.
//  Each catch plays a duck quack (onCatch => onQuack).
// ============================================================

export type Dir = "up" | "down" | "left" | "right";
export type JumpFn = () => void;

export interface CommonOpts {
  onCatch?: () => void;
  onPop?: () => void;
  onQuack?: () => void;
  onWin?: () => void;
}

export interface GameOpts extends CommonOpts {
  // true => only grandmas spawn; false => only children (fox game, etc.)
  grandmasOnly?: boolean;
}

interface NPC {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "grandma" | "child";
  caught: boolean;
  alert: boolean;
  seed: number;
  wa: number;
  wanderT: number;
  color: string;
  shade: string;
  hair: string;
  r: number;
}

interface Heart {
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  scale: number;
}
interface Poof {
  x: number;
  y: number;
  life: number;
  max: number;
}

interface HousePos { x: number; y: number }
interface Flower { x: number; y: number; color: string }
interface Bush { x: number; y: number }

const HEART = [
  "..XX.XX..",
  ".XXXXXXX.",
  ".XXXXXXX.",
  ".XXXXXXX.",
  "..XXXXX..",
  "...XXX...",
  "....X....",
];

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export interface GameApi {
  setKey(d: Dir, down: boolean): void;
  jump?(): void;
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  elapsed: number;
  total: number;
}

const C = {
  grass: "#7ec850",
  grass2: "#6cb43e",
  grassDot: "#5aa033",
  outline: "#3a2f3f",
  duck: "#ffd23f",
  duckLight: "#ffe98a",
  beak: "#ff8c1a",
  beakShade: "#e06a00",
  eye: "#2a2438",
  skin: "#ffd2a3",
  hairGray: "#d2cce0",
  hairGrayShade: "#a99fc4",
  hairBrown: "#6b4423",
  hairBlond: "#e6c468",
  wall: "#f4dcc0",
  wallShade: "#d7b489",
  roof: "#d65a31",
  roofShade: "#a8401d",
  door: "#7a4a24",
  doorShade: "#5c3617",
  white: "#ffffff",
  shadow: "rgba(0,0,0,0.16)",
};

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}
function disc(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color;
  const ix = Math.round(cx);
  const iy = Math.round(cy);
  const rr = Math.round(r);
  for (let dy = -rr; dy <= rr; dy++) {
    const w = Math.round(2 * Math.sqrt(Math.max(0, rr * rr - dy * dy)));
    if (w > 0) ctx.fillRect(ix - Math.round(w / 2), iy + dy, w, 1);
  }
}

export class DuckGame implements GameApi {
  readonly W = 320;
  readonly H = 180;
  readonly total = 7;

  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private running = false;
  paused = false;
  private t = 0;
  elapsed = 0;
  private frozen = false;
  private caught = 0;

  private player = { x: 160, y: 95, vx: 0, vy: 0, fx: 1, moving: false };
  private entities: NPC[] = [];
  private houses: HousePos[] = [];
  private flowers: Flower[] = [];
  private bushes: Bush[] = [];
  private patches: { x: number; y: number; r: number }[] = [];
  private hearts: Heart[] = [];
  private poofs: Poof[] = [];
  private keys: Record<Dir, boolean> = { up: false, down: false, left: false, right: false };

  constructor(canvas: HTMLCanvasElement, private opts: GameOpts) {
    const c = canvas.getContext("2d");
    if (!c) throw new Error("no 2d context");
    this.ctx = c;
    this.ctx.imageSmoothingEnabled = false;
    canvas.width = this.W;
    canvas.height = this.H;
    this.buildWorld();
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  }

  private buildWorld() {
    this.houses = [
      { x: 58, y: 44 },
      { x: 262, y: 48 },
      { x: 64, y: 150 },
      { x: 256, y: 152 },
    ];
    for (let i = 0; i < 9; i++)
      this.patches.push({ x: rand(20, 300), y: rand(20, 160), r: rand(10, 22) });
    const fcolors = ["#ff7ab0", "#ffd23f", "#ff5d5d", "#c77dff", "#ffffff"];
    for (let i = 0; i < 16; i++)
      this.flowers.push({ x: rand(16, 304), y: rand(20, 162), color: fcolors[i % fcolors.length] });
    for (let i = 0; i < 6; i++)
      this.bushes.push({ x: rand(20, 300), y: rand(24, 160) });
    // only grandmas spawn by default (per task: duck chases grandmas)
    const types: NPC["type"][] = ["grandma", "grandma", "grandma", "grandma", "grandma", "grandma", "grandma"];
    this.entities = types.map((type) => {
      let x = 0;
      let y = 0;
      for (let t = 0; t < 30; t++) {
        x = rand(24, 296);
        y = rand(24, 156);
        if (Math.hypot(x - this.player.x, y - this.player.y) > 60) break;
      }
      return {
        x,
        y,
        vx: 0,
        vy: 0,
        type,
        caught: false,
        alert: false,
        seed: rand(0, 100),
        wa: rand(0, Math.PI * 2),
        wanderT: rand(0.2, 1.4),
        color: "#c77dff",
        shade: "#9d4edd",
        hair: C.hairGray,
        r: 6,
      };
    });
  }

  get caughtCount() { return this.caught; }

  start() { this.running = true; this.paused = false; this.last = performance.now(); }
  pause() { this.paused = true; }
  resume() { if (!this.running) return; this.paused = false; this.last = performance.now(); }
  destroy() { cancelAnimationFrame(this.raf); }
  setKey(dir: Dir, down: boolean) { this.keys[dir] = down; }
  jump() { /* duck does not jump */ }

  private loop = (ts: number) => {
    const dt = Math.min(0.05, (ts - this.last) / 1000 || 0);
    this.last = ts;
    if (this.running && !this.paused) this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.t += dt;
    this.updateParticles(dt);
    if (this.frozen) return;
    this.elapsed += dt;

    let ix = 0;
    let iy = 0;
    if (this.keys.up) iy -= 1;
    if (this.keys.down) iy += 1;
    if (this.keys.left) ix -= 1;
    if (this.keys.right) ix += 1;
    const moving = ix !== 0 || iy !== 0;
    this.player.moving = moving;
    if (moving) {
      const m = Math.hypot(ix, iy);
      ix /= m; iy /= m;
      this.player.vx = ix * 72;
      this.player.vy = iy * 72;
      if (ix > 0.3) this.player.fx = 1;
      else if (ix < -0.3) this.player.fx = -1;
    } else {
      this.player.vx *= 0.6;
      this.player.vy *= 0.6;
    }
    this.player.x = clamp(this.player.x + this.player.vx * dt, 10, this.W - 10);
    this.player.y = clamp(this.player.y + this.player.vy * dt, 12, this.H - 10);

    for (const e of this.entities) {
      if (e.caught) continue;
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      e.alert = dist < 50;
      if (e.alert) {
        // Flee from the duck, but also steer away from edges so grandmas do not pile up in corners.
        const edge = 34;
        const centerX = this.W / 2;
        const centerY = this.H / 2;
        let avoidX = 0;
        let avoidY = 0;
        if (e.x < edge) avoidX += (edge - e.x) / edge;
        if (e.x > this.W - edge) avoidX -= (e.x - (this.W - edge)) / edge;
        if (e.y < edge) avoidY += (edge - e.y) / edge;
        if (e.y > this.H - edge) avoidY -= (e.y - (this.H - edge)) / edge;
        if (e.x < edge && e.y < edge) {
          avoidX += (centerX - e.x) / centerX;
          avoidY += (centerY - e.y) / centerY;
        }
        if (e.x > this.W - edge && e.y < edge) {
          avoidX += (centerX - e.x) / centerX;
          avoidY += (centerY - e.y) / centerY;
        }
        if (e.x < edge && e.y > this.H - edge) {
          avoidX += (centerX - e.x) / centerX;
          avoidY += (centerY - e.y) / centerY;
        }
        if (e.x > this.W - edge && e.y > this.H - edge) {
          avoidX += (centerX - e.x) / centerX;
          avoidY += (centerY - e.y) / centerY;
        }
        const panic = Math.sin(this.t * 7 + e.seed);
        const sideX = -dy / dist;
        const sideY = dx / dist;
        e.vx = (-dx / dist) * 54 + avoidX * 48 + sideX * panic * 18;
        e.vy = (-dy / dist) * 54 + avoidY * 48 + sideY * panic * 18;
      } else {
        e.wanderT -= dt;
        if (e.wanderT <= 0) {
          e.wa = rand(0, Math.PI * 2);
          e.wanderT = rand(0.6, 1.6);
        }
        e.vx = Math.cos(e.wa) * 20;
        e.vy = Math.sin(e.wa) * 20;
      }
      const minX = e.r + 8;
      const maxX = this.W - e.r - 8;
      const minY = e.r + 10;
      const maxY = this.H - e.r - 8;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.x <= minX || e.x >= maxX) {
        e.x = clamp(e.x, minX, maxX);
        e.wa = Math.PI - e.wa + rand(-0.5, 0.5);
        e.vx *= -0.45;
      }
      if (e.y <= minY || e.y >= maxY) {
        e.y = clamp(e.y, minY, maxY);
        e.wa = -e.wa + rand(-0.5, 0.5);
        e.vy *= -0.45;
      }

      if (dist < 9) {
        e.caught = true;
        this.caught += 1;
        this.spawnCatch(e.x, e.y);
        this.opts.onCatch?.();
        // duck quack on every catch
        this.opts.onQuack?.();
        if (this.caught >= this.total) {
          this.frozen = true;
          this.opts.onWin?.();
        }
      }
    }
  }

  private spawnCatch(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      this.hearts.push({
        x: x + rand(-4, 4),
        y: y + rand(-2, 2),
        vy: rand(-30, -18),
        life: rand(0.7, 1),
        max: 1,
        scale: 1 + Math.round(rand(0, 1)),
      });
    }
    const k = rand(0.7, 1.1);
    this.poofs.push({ x, y, life: 0.4 * k, max: 0.4 * k });
  }

  private updateParticles(dt: number) {
    for (const h of this.hearts) {
      h.y += h.vy * dt;
      h.life -= dt;
    }
    this.hearts = this.hearts.filter((h) => h.life > 0);
    for (const p of this.poofs) p.life -= dt;
    this.poofs = this.poofs.filter((p) => p.life > 0);
  }

  private render() {
    const ctx = this.ctx;
    px(ctx, 0, 0, this.W, this.H, C.grass);
    for (const p of this.patches) disc(ctx, p.x, p.y, p.r, C.grass2);
    for (let i = 0; i < this.flowers.length; i++) {
      const f = this.flowers[i];
      if (i % 2 === 0) px(ctx, f.x, f.y, 1, 2, C.grassDot);
    }
    void this.flowers.length;
    for (const b of this.bushes) this.drawBush(b.x, b.y);
    for (const f of this.flowers) this.drawFlower(f.x, f.y, f.color);

    type Draw = { y: number; fn: () => void };
    const list: Draw[] = [];
    for (const h of this.houses) list.push({ y: h.y, fn: () => this.drawHouse(h.x, h.y) });
    for (const e of this.entities) {
      if (e.caught) continue;
      list.push({ y: e.y + e.r, fn: () => this.drawNPC(e) });
    }
    list.push({ y: this.player.y + 7, fn: () => this.drawDuck() });
    list.sort((a, b) => a.y - b.y);
    for (const d of list) d.fn();

    for (const p of this.poofs) {
      const k = p.life / p.max;
      disc(ctx, p.x, p.y, 4 + (1 - k) * 9, `rgba(255,255,255,${k * 0.6})`);
    }
    for (const h of this.hearts) {
      const a = clamp(h.life / h.max, 0, 1);
      ctx.globalAlpha = a;
      this.drawHeart(h.x, h.y, h.scale, "#ff4d79");
      ctx.globalAlpha = 1;
    }
  }

  private drawDuck() {
    const ctx = this.ctx;
    const { x, y } = this.player;
    const bob = this.player.moving ? Math.sin(this.t * 11) : 0;
    const yy = y + bob;
    disc(ctx, x, y + 8, 6, C.shadow);
    const step = this.player.moving ? Math.floor(this.t * 9) % 2 : 0;
    px(ctx, x - 4, y + 6 - (step ? 0 : 1), 2, 2, C.beak);
    px(ctx, x + 2, y + 6 - (step ? 1 : 0), 2, 2, C.beak);
    disc(ctx, x, yy + 1, 7, C.outline);
    disc(ctx, x, yy, 7, C.duck);
    disc(ctx, x - 1, yy + 2, 3, C.duckLight);
    disc(ctx, x, yy - 8, 5, C.outline);
    disc(ctx, x, yy - 8, 4.2, C.duck);
    const bx = x + this.player.fx * 3;
    px(ctx, bx - 1, yy - 8, 3, 2, C.beak);
    px(ctx, bx - 1, yy - 7, 3, 1, C.beakShade);
    px(ctx, x - 3, yy - 9, 1, 1, C.eye);
    px(ctx, x + 2, yy - 9, 1, 1, C.eye);
  }

  private drawNPC(e: NPC) {
    const ctx = this.ctx;
    const bob = e.alert ? Math.sin(this.t * 14 + e.seed) : Math.sin(this.t * 4 + e.seed) * 0.5;
    const yy = e.y + bob;
    const r = e.r;
    disc(ctx, e.x, e.y + r + 1, r - 1, C.shadow);
    disc(ctx, e.x, yy + 1, r, C.outline);
    disc(ctx, e.x, yy, r, e.color);
    disc(ctx, e.x + 1, yy + 1, r - 2, e.shade);
    if (e.type === "grandma") {
      px(ctx, e.x - 2, yy + 1, 4, 2, C.white);
    }
    const hy = yy - r - 1;
    disc(ctx, e.x, hy, 3.4, C.outline);
    disc(ctx, e.x, hy, 2.8, C.skin);
    disc(ctx, e.x, hy - 0.4, 3, e.hair);
    px(ctx, e.x - 2, hy - 1, 4, 1, e.hair);
    if (e.type === "grandma") disc(ctx, e.x, hy - 2.4, 1.6, C.hairGrayShade);
    px(ctx, e.x - 1.5, hy - 0.4, 1, 1, C.eye);
    px(ctx, e.x + 0.5, hy - 0.4, 1, 1, C.eye);

    if (e.alert) {
      const ay = hy - 6 + Math.sin(this.t * 12) * 1;
      px(ctx, e.x, ay, 1, 3, "#ff3b3b");
      px(ctx, e.x, ay + 4, 1, 1, "#ff3b3b");
    }
  }

  private drawHouse(hx: number, hy: number) {
    const ctx = this.ctx;
    const w = 30;
    const wh = 22;
    const rh = 9;
    const left = hx - w / 2;
    const top = hy - wh;
    px(ctx, left, top, w, wh, C.wall);
    px(ctx, left, top + wh - 3, w, 3, C.wallShade);
    px(ctx, left, top, 2, wh, C.wallShade);
    for (let i = 0; i < rh; i++) {
      const rw = w + (rh - i) * 2;
      px(ctx, hx - rw / 2, top - rh + i, rw, 1, i === rh - 1 ? C.roofShade : C.roof);
    }
    px(ctx, hx - 3, hy - 9, 6, 9, C.door);
    px(ctx, hx - 3, hy - 9, 1, 9, C.doorShade);
    px(ctx, hx + 1, hy - 4, 1, 1, "#ffd23f");
    px(ctx, left + 4, top + 5, 6, 6, "#aee7ff");
    px(ctx, left + 4, top + 5, 6, 1, C.wallShade);
    px(ctx, left + 4, top + 5, 1, 6, C.wallShade);
    px(ctx, left + 6, top + 5, 1, 6, C.wallShade);
  }

  private drawFlower(x: number, y: number, color: string) {
    const ctx = this.ctx;
    px(ctx, x, y, 1, 2, C.grassDot);
    disc(ctx, x - 1.5, y - 2, 1.4, color);
    disc(ctx, x + 1.5, y - 2, 1.4, color);
    disc(ctx, x, y - 3.4, 1.4, color);
    disc(ctx, x, y - 0.6, 1.4, color);
    px(ctx, x, y - 2, 1, 1, "#ffd23f");
  }

  private drawBush(x: number, y: number) {
    const ctx = this.ctx;
    disc(ctx, x - 3, y, 3.4, C.grass2);
    disc(ctx, x + 3, y, 3.4, C.grass2);
    disc(ctx, x, y - 1, 4, C.grass);
    px(ctx, x - 1, y - 1, 1, 1, C.grassDot);
  }

  private drawHeart(cx: number, cy: number, scale: number, color: string) {
    const ctx = this.ctx;
    const sx = Math.round(cx - (HEART[0].length * scale) / 2);
    const sy = Math.round(cy - (HEART.length * scale) / 2);
    const s = Math.max(1, Math.round(scale));
    for (let r = 0; r < HEART.length; r++) {
      for (let c = 0; c < HEART[r].length; c++) {
        if (HEART[r][c] === "X") px(ctx, sx + c * s, sy + r * s, s, s, color);
      }
    }
  }
}
