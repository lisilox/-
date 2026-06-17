// ============================================================
//  FoxGame: a top-down stealth chase through a forest.
//  You are a fox. Catch the children (targets), but keep your
//  distance from the watchful wolves: they will chase you.
//  Different feel from the duck game: the danger moves toward
//  you, so you have to circle around and plan your route.
// ============================================================

import { CommonOpts, Dir, type GameApi } from "./DuckGame";

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const W = 320;
const H = 180;

interface NPC {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "child" | "wolf";
  caught: boolean;
  seed: number;
  wa: number;
  wanderT: number;
  alert: boolean;
  hp: number;
}

interface Sparkle {
  x: number;
  y: number;
  life: number;
  max: number;
}

const C = {
  grass: "#4d7f4a",
  grass2: "#3f6c3d",
  grassDot: "#345c33",
  moss: "#6e9c5c",
  outline: "#1c2a18",
  foxBody: "#e87a3e",
  foxShade: "#ba5620",
  foxBelly: "#fff1d6",
  foxCheek: "#ffb48a",
  eye: "#1c0f08",
  nose: "#1c0f08",
  childShirt: "#9be15a",
  childShade: "#6fb83a",
  childHair: "#6b4423",
  skin: "#ffd2a3",
  wolfBody: "#5a6573",
  wolfShade: "#3c4654",
  wolfEye: "#ff3a3a",
  shadow: "rgba(0,0,0,0.18)",
  tree: "#3a2a1a",
  treeShade: "#241710",
  treeTop: "#2e6e3a",
  treeTop2: "#235a2e",
  bush: "#3f6c3d",
  flower: "#ffd23f",
  path: "#9b7a4a",
  pathShade: "#7a5e36",
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

export class FoxGame implements GameApi {
  readonly total = 5;

  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private running = false;
  paused = false;
  private t = 0;
  elapsed = 0;
  private finished = false;

  private player = { x: 70, y: 110, vx: 0, vy: 0, fx: 1, moving: false };
  private entities: NPC[] = [];
  private trees: { x: number; y: number }[] = [];
  private paths: { x: number; y: number; w: number; h: number }[] = [];
  private flowers: { x: number; y: number }[] = [];
  private sparkles: Sparkle[] = [];
  private caught = 0;
  private lives = 3;

  private keys: Record<Dir, boolean> = { up: false, down: false, left: false, right: false };

  constructor(canvas: HTMLCanvasElement, private opts: CommonOpts) {
    const c = canvas.getContext("2d");
    if (!c) throw new Error("no 2d context");
    this.ctx = c;
    this.ctx.imageSmoothingEnabled = false;
    canvas.width = W;
    canvas.height = H;
    this.buildWorld();
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  }

  private buildWorld() {
    // meandering path
    this.paths.push({ x: 0, y: 90, w: W, h: 12 });
    this.paths.push({ x: 60, y: 0, w: 12, h: H });
    // trees (decorative + partial cover)
    for (let i = 0; i < 18; i++) {
      this.trees.push({ x: rand(10, W - 10), y: rand(10, H - 10) });
    }
    // random flowers
    for (let i = 0; i < 22; i++) {
      this.flowers.push({ x: rand(8, W - 8), y: rand(8, H - 8) });
    }
    // 5 children to collect, 2 wolves as chasers
    const types: NPC["type"][] = ["child", "child", "child", "child", "child", "wolf", "wolf"];
    this.entities = types.map((type) => {
      let x = 0;
      let y = 0;
      for (let t = 0; t < 30; t++) {
        x = rand(20, W - 20);
        y = rand(20, H - 20);
        if (Math.hypot(x - this.player.x, y - this.player.y) > 70) break;
      }
      return {
        x,
        y,
        vx: 0,
        vy: 0,
        type,
        caught: false,
        seed: rand(0, 100),
        wa: rand(0, Math.PI * 2),
        wanderT: rand(0.4, 1.4),
        alert: false,
        hp: 1,
      };
    });
  }

  get caughtCount() { return this.caught; }

  start() { this.running = true; this.paused = false; this.last = performance.now(); }
  pause() { this.paused = true; }
  resume() { if (!this.running) return; this.paused = false; this.last = performance.now(); }
  destroy() { cancelAnimationFrame(this.raf); }
  setKey(dir: Dir, down: boolean) { this.keys[dir] = down; }
  jump() { /* unused */ }

  private loop = (ts: number) => {
    const dt = Math.min(0.05, (ts - this.last) / 1000 || 0);
    this.last = ts;
    if (this.running && !this.paused && !this.finished) this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.t += dt;
    this.elapsed += dt;

    // sparkles decay
    for (const s of this.sparkles) s.life -= dt;
    this.sparkles = this.sparkles.filter((s) => s.life > 0);

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
      this.player.vx = ix * 78;
      this.player.vy = iy * 78;
      if (ix > 0.3) this.player.fx = 1;
      else if (ix < -0.3) this.player.fx = -1;
    } else {
      this.player.vx *= 0.7;
      this.player.vy *= 0.7;
    }
    this.player.x = clamp(this.player.x + this.player.vx * dt, 8, W - 8);
    this.player.y = clamp(this.player.y + this.player.vy * dt, 8, H - 8);

    let aliveChildren = 0;

    for (const e of this.entities) {
      if (e.caught) continue;
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const dist = Math.hypot(dx, dy) || 0.001;

      if (e.type === "child") {
        aliveChildren++;
        e.alert = dist < 60;
        if (e.alert) {
          // children run away from the fox
          e.vx = (-dx / dist) * 64;
          e.vy = (-dy / dist) * 64;
        } else {
          e.wanderT -= dt;
          if (e.wanderT <= 0) {
            e.wa = rand(0, Math.PI * 2);
            e.wanderT = rand(0.7, 1.6);
          }
          e.vx = Math.cos(e.wa) * 22;
          e.vy = Math.sin(e.wa) * 22;
        }
      } else {
        // wolves: stalk the fox when it's nearby, otherwise wander
        e.alert = dist < 110;
        if (e.alert) {
          e.vx = (dx / dist) * 50;
          e.vy = (dy / dist) * 50;
        } else {
          e.wanderT -= dt;
          if (e.wanderT <= 0) {
            e.wa = rand(0, Math.PI * 2);
            e.wanderT = rand(0.7, 1.6);
          }
          e.vx = Math.cos(e.wa) * 18;
          e.vy = Math.sin(e.wa) * 18;
        }
      }
      e.x = clamp(e.x + e.vx * dt, 6, W - 6);
      e.y = clamp(e.y + e.vy * dt, 6, H - 6);

      if (e.type === "child" && dist < 9) {
        e.caught = true;
        this.caught += 1;
        this.spawnCatch(e.x, e.y);
        this.opts.onCatch?.();
        this.opts.onQuack?.();
      } else if (e.type === "wolf" && dist < 9) {
        // a wolf caught the fox: lose a life
        this.lives -= 1;
        this.spawnSparkle(this.player.x, this.player.y);
        // bounce the fox back to start
        this.player.x = 70;
        this.player.y = 110;
        this.player.vx = 0;
        this.player.vy = 0;
        if (this.lives <= 0) {
          this.finished = true;
          this.opts.onWin?.();
        }
      }
    }

    if (this.caught >= this.total) {
      this.finished = true;
      this.opts.onWin?.();
    }
  }

  private spawnCatch(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      this.sparkles.push({
        x: x + rand(-4, 4),
        y: y + rand(-2, 2),
        life: rand(0.5, 0.9),
        max: 0.9,
      });
    }
  }

  private spawnSparkle(x: number, y: number) {
    for (let i = 0; i < 6; i++) {
      this.sparkles.push({
        x: x + rand(-6, 6),
        y: y + rand(-6, 6),
        life: rand(0.4, 0.8),
        max: 0.8,
      });
    }
  }

  private render() {
    const ctx = this.ctx;
    // forest floor
    px(ctx, 0, 0, W, H, C.grass);
    for (let i = 0; i < 70; i++) {
      const x = (i * 31) % W;
      const y = (i * 17 + 5) % H;
      disc(ctx, x, y, 7, C.grass2);
    }
    // paths
    for (const p of this.paths) {
      px(ctx, p.x, p.y, p.w, p.h, C.pathShade);
      px(ctx, p.x, p.y + 1, p.w, p.h - 2, C.path);
      for (let i = 0; i < p.w; i += 6) {
        px(ctx, p.x + i, p.y + 6, 2, 1, C.pathShade);
      }
    }
    // flowers
    for (const f of this.flowers) {
      disc(ctx, f.x, f.y, 1.2, C.flower);
    }

    type Draw = { y: number; fn: () => void };
    const list: Draw[] = [];
    for (const t of this.trees) list.push({ y: t.y, fn: () => this.drawTree(t.x, t.y) });
    for (const e of this.entities) {
      if (e.caught) continue;
      list.push({ y: e.y, fn: () => this.drawNPC(e) });
    }
    list.push({ y: this.player.y, fn: () => this.drawFox() });
    list.sort((a, b) => a.y - b.y);
    for (const d of list) d.fn();

    // sparkles above foxes that got caught
    for (const s of this.sparkles) {
      const a = Math.max(0, s.life / s.max);
      px(ctx, Math.round(s.x), Math.round(s.y), 2, 2, `rgba(255,222,89,${a})`);
    }

    // HUD-like hint (drawn in canvas for info)
    // (React layer handles the actual score / lives overlay)
  }

  private drawTree(x: number, y: number) {
    const ctx = this.ctx;
    disc(ctx, x, y + 4, 10, C.shadow);
    px(ctx, x - 1, y + 1, 2, 6, C.tree);
    px(ctx, x, y + 1, 2, 6, C.treeShade);
    disc(ctx, x, y - 4, 8, C.outline);
    disc(ctx, x, y - 4, 7, C.treeTop);
    disc(ctx, x + 1, y - 5, 4, C.treeTop2);
    disc(ctx, x - 2, y - 3, 3, C.treeTop2);
  }

  private drawFox() {
    const ctx = this.ctx;
    const { x, y, fx } = this.player;
    const bob = this.player.moving ? Math.sin(this.t * 14) * 0.6 : 0;

    disc(ctx, x, y + 5, 6, C.shadow);

    // tail
    px(ctx, x - 9 * fx, y - 1 + bob, 5, 4, C.outline);
    px(ctx, x - 9 * fx, y - 1 + bob, 4, 3, C.foxBody);
    px(ctx, x - 9 * fx, y - 2 + bob, 2, 2, C.foxShade);

    // body
    px(ctx, x - 8, y - 1 + bob, 14, 7, C.outline);
    px(ctx, x - 8, y - 1 + bob, 13, 6, C.foxBody);
    px(ctx, x - 7, y + 4 + bob, 11, 2, C.foxBelly);
    px(ctx, x - 8, y + 4 + bob, 4, 2, C.foxCheek);

    // legs
    const step = this.player.moving ? Math.floor(this.t * 12) % 2 : 0;
    px(ctx, x - 6, y + 5 - (step ? 0 : 1), 2, 3, C.outline);
    px(ctx, x - 2, y + 5 - (step ? 1 : 0), 2, 3, C.outline);
    px(ctx, x + 2, y + 5 - (step ? 0 : 1), 2, 3, C.outline);
    px(ctx, x + 5, y + 5 - (step ? 1 : 0), 2, 3, C.outline);

    // head
    px(ctx, x + 5 * fx - 2, y - 7 + bob, 9, 7, C.outline);
    px(ctx, x + 5 * fx - 2, y - 7 + bob, 8, 6, C.foxBody);
    // ears
    px(ctx, x + 5 * fx - 1, y - 10 + bob, 2, 3, C.foxShade);
    px(ctx, x + 5 * fx + 3, y - 10 + bob, 2, 3, C.foxShade);
    // eyes
    px(ctx, x + 5 * fx + 1, y - 5 + bob, 1, 1, C.eye);
    px(ctx, x + 5 * fx + 4, y - 5 + bob, 1, 1, C.eye);
    // nose
    px(ctx, x + 5 * fx + 6, y - 3 + bob, 1, 1, C.nose);
    // cheek
    px(ctx, x + 5 * fx + 4, y - 2 + bob, 2, 1, C.foxCheek);
  }

  private drawNPC(e: NPC) {
    const ctx = this.ctx;
    const bob = e.alert ? Math.sin(this.t * 14 + e.seed) * 0.4 : Math.sin(this.t * 4 + e.seed) * 0.3;
    const yy = e.y + bob;
    if (e.type === "child") {
      disc(ctx, e.x, e.y + 5, 4, C.shadow);
      // body
      px(ctx, e.x - 3, yy + 1, 6, 4, C.outline);
      px(ctx, e.x - 3, yy + 1, 6, 3, C.childShirt);
      px(ctx, e.x - 3, yy + 3, 6, 1, C.childShade);
      // head
      disc(ctx, e.x, yy - 3, 3, C.outline);
      disc(ctx, e.x, yy - 3, 2.4, C.skin);
      px(ctx, e.x - 1.5, yy - 3, 3, 1, C.childHair);
      disc(ctx, e.x, yy - 4.4, 1.6, C.childHair);
      px(ctx, e.x - 1, yy - 3, 1, 1, C.eye);
      px(ctx, e.x + 1, yy - 3, 1, 1, C.eye);
      if (e.alert) {
        const ay = yy - 8 + Math.sin(this.t * 12) * 1;
        px(ctx, e.x, ay, 1, 3, "#ff3b3b");
        px(ctx, e.x, ay + 4, 1, 1, "#ff3b3b");
      }
    } else {
      // wolf
      disc(ctx, e.x, e.y + 5, 6, C.shadow);
      // body
      px(ctx, e.x - 6, yy + 1, 12, 5, C.outline);
      px(ctx, e.x - 6, yy + 1, 11, 4, C.wolfBody);
      // legs (small)
      px(ctx, e.x - 5, yy + 5, 1, 2, C.wolfShade);
      px(ctx, e.x + 4, yy + 5, 1, 2, C.wolfShade);
      // head
      px(ctx, e.x + 5, yy - 1, 6, 5, C.outline);
      px(ctx, e.x + 5, yy - 1, 5, 4, C.wolfBody);
      // ears
      px(ctx, e.x + 5, yy - 3, 1, 2, C.wolfShade);
      px(ctx, e.x + 9, yy - 3, 1, 2, C.wolfShade);
      // eyes (red when alert)
      const eye = e.alert ? "#ff3a3a" : C.eye;
      px(ctx, e.x + 6, yy, 1, 1, eye);
      px(ctx, e.x + 8, yy, 1, 1, eye);
      // teeth
      px(ctx, e.x + 7, yy + 3, 1, 1, "#fff");
    }
  }
}

function clamp(v: number, a: number, b: number) { return v < a ? a : v > b ? b : v; }
