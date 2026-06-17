import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSettings } from "../../settings/SettingsContext";

const W = 320;
const H = 180;
const TILE = 10;
const COLS = W / TILE; // 32
const ROWS = H / TILE; // 18

// Hand-crafted small labyrinth. "S" start, "E" exit(s).
const MAP_SRC: string[] = [
  "########################",
  "#S.....#...............#",
  "#.###.#.#.###########.#.#",
  "#.#...#.#.#.........#.#.#",
  "#.#.###.#.#.#######.#.#.#",
  "#.#.#...#...#.....#.#.#.#",
  "#.#.#.#########.#.#.#.#.#",
  "#...#.....E.....#.#.#...#",
  "#.###.#########.#.#.#####",
  "#.....#.......#.#.#.....#",
  "#.#####.#####.#.#.#####.#",
  "#.#...#.#...#.#.#.#...#.#",
  "#.#.#.#.#.#.#.#.#.#.#.#.#",
  "#.#.#...#.#.#.#.#.#.#...#",
  "#.#.#####.#.#.#####.#####",
  "#.#.......#.....#......E",
  "#.#######################",
  "########################",
];
const MAP: string[] = MAP_SRC.map((r) =>
  r.length >= COLS ? r.slice(0, COLS) : r + "#".repeat(COLS - r.length),
);

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const C = {
  wall: "#120d0a",
  wallTop: "#2b2119",
  wallEdge: "#070504",
  wallBrick: "#4a382b",
  floor: "#5a402b",
  floorShade: "#4d3625",
  exit: "#ffd23f",
  exitGlow: "#ffe98a",
  player: "#f5c074",
  playerShade: "#b87f3a",
  playerSkin: "#ffd2a3",
  playerOutline: "#2a1a0e",
  flameOuter: "#ff7b1c",
  flameMid: "#ffb84d",
  flameInner: "#fff3a8",
  dark: "#0c0807",
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

interface Spark {
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  drift: number;
}

export default function Maze({ onFinish, paused }: { onFinish: () => void; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { playQuack } = useSettings();
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const playQuackRef = useRef(playQuack);
  playQuackRef.current = playQuack;

  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;
    const c2 = ctx;

    let start = { x: 1, y: 1 };
    for (let r = 0; r < ROWS; r++) {
      const c = MAP[r].indexOf("S");
      if (c >= 0) {
        start = { x: c, y: r };
        break;
      }
    }
    const player = {
      x: start.x * TILE + TILE / 2,
      y: start.y * TILE + TILE / 2,
      lightRadius: 40,
      breath: 0,
    };
    const keys: Record<string, boolean> = {};
    let elapsed = 0;
    let last = performance.now();
    let raf = 0;
    let finished = false;
    const exitCells: { x: number; y: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (MAP[r][c] === "E") exitCells.push({ x: c, y: r });
      }
    }
    const sparks: Spark[] = [];
    let sparkT = 0;

    function isWall(cx: number, cy: number) {
      const tx = Math.floor(cx / TILE);
      const ty = Math.floor(cy / TILE);
      if (tx < 0 || tx >= COLS || ty < 0 || ty >= ROWS) return true;
      return MAP[ty][tx] === "#";
    }

    function canStand(cx: number, cy: number) {
      const r = 1.6;
      return (
        !isWall(cx - r, cy - r) &&
        !isWall(cx + r, cy - r) &&
        !isWall(cx - r, cy + r) &&
        !isWall(cx + r, cy + r) &&
        !isWall(cx, cy - r) &&
        !isWall(cx, cy + r) &&
        !isWall(cx - r, cy) &&
        !isWall(cx + r, cy)
      );
    }

    function tileAt(cx: number, cy: number) {
      return { tx: Math.floor(cx / TILE), ty: Math.floor(cy / TILE) };
    }

    function safeCenter(tx: number, ty: number) {
      return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
    }

    function nudgeOutOfWall() {
      if (canStand(player.x, player.y)) return;
      const { tx, ty } = tileAt(player.x, player.y);
      let best: { x: number; y: number; d: number } | null = null;
      for (let oy = -2; oy <= 2; oy++) {
        for (let ox = -2; ox <= 2; ox++) {
          const nx = tx + ox;
          const ny = ty + oy;
          if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || MAP[ny][nx] === "#") continue;
          const c = safeCenter(nx, ny);
          if (!canStand(c.x, c.y)) continue;
          const d = Math.hypot(c.x - player.x, c.y - player.y);
          if (!best || d < best.d) best = { ...c, d };
        }
      }
      if (best) {
        player.x = best.x;
        player.y = best.y;
      }
    }

    function moveAxis(dx: number, dy: number) {
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 2));
      const sx = dx / steps;
      const sy = dy / steps;
      for (let i = 0; i < steps; i++) {
        const nx = player.x + sx;
        if (canStand(nx, player.y)) player.x = nx;
        const ny = player.y + sy;
        if (canStand(player.x, ny)) player.y = ny;
      }
      nudgeOutOfWall();
    }

    const tick = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000 || 0);
      last = ts;
      if (paused) {
        last = ts;
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!finished) elapsed += dt;

      let ix = 0;
      let iy = 0;
      if (keys["up"]) iy -= 1;
      if (keys["down"]) iy += 1;
      if (keys["left"]) ix -= 1;
      if (keys["right"]) ix += 1;
      const moving = ix !== 0 || iy !== 0;
      if (moving) {
        const m = Math.hypot(ix, iy);
        ix /= m;
        iy /= m;
      }
      const sp = 52;
      moveAxis(ix * sp * dt, iy * sp * dt);

      player.breath += dt * (moving ? 6 : 2);
      if (player.breath > Math.PI * 2) player.breath -= Math.PI * 2;

      if (!finished) {
        for (const ec of exitCells) {
          const ecx = ec.x * TILE + TILE / 2;
          const ecy = ec.y * TILE + TILE / 2;
          if (Math.hypot(player.x - ecx, player.y - ecy) < TILE * 0.7) {
            finished = true;
            setWon(true);
            setTimeout(() => onFinishRef.current(), 1500);
            break;
          }
        }
      }

      sparkT += dt;
      if (sparkT > 0.05) {
        sparkT = 0;
        sparks.push({
          x: player.x - 4 + rand(0, 8),
          y: player.y - 8,
          vy: -rand(20, 40),
          life: rand(0.4, 0.8),
          max: 0.8,
          drift: rand(-12, 12),
        });
      }
      for (const s of sparks) {
        s.x += s.drift * dt;
        s.y += s.vy * dt;
        s.vy += 30 * dt;
        s.life -= dt;
      }

      renderMaze();
      raf = requestAnimationFrame(tick);
    };

    function renderMaze() {
      const cx = Math.round(player.x);
      const cy = Math.round(player.y);
      const radius = player.lightRadius + Math.sin(player.breath) * 1.5;
      const radiusSq = radius * radius;

      c2.fillStyle = C.dark;
      c2.fillRect(0, 0, W, H);

      const minX = Math.max(0, Math.floor((cx - radius) / TILE) - 1);
      const maxX = Math.min(COLS, Math.ceil((cx + radius) / TILE) + 1);
      const minY = Math.max(0, Math.floor((cy - radius) / TILE) - 1);
      const maxY = Math.min(ROWS, Math.ceil((cy + radius) / TILE) + 1);

      for (let r = minY; r < maxY; r++) {
        for (let c = minX; c < maxX; c++) {
          const tx = c * TILE;
          const ty = r * TILE;
          const dx = tx + TILE / 2 - cx;
          const dy = ty + TILE / 2 - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 > radiusSq) continue;
          const tile = MAP[r][c];
          if (tile === "#") {
            px(c2, tx, ty, TILE, TILE, C.wall);
            px(c2, tx, ty, TILE, 2, C.wallTop);
            px(c2, tx, ty + TILE - 1, TILE, 1, C.wallEdge);
            px(c2, tx + TILE - 1, ty, 1, TILE, C.wallEdge);
            px(c2, tx + 2, ty + 4, TILE - 4, 1, C.wallBrick);
            if ((c + r) % 2 === 0) px(c2, tx + 1, ty + 7, TILE - 2, 1, "#30251d");
          } else if (tile === "E") {
            px(c2, tx, ty, TILE, TILE, C.floor);
            px(c2, tx + 1, ty + 1, TILE - 2, TILE - 2, C.exitGlow);
            disc(c2, tx + TILE / 2, ty + TILE / 2, TILE / 2 - 2, C.exit);
          } else {
            px(c2, tx, ty, TILE, TILE, C.floor);
            if ((c + r) % 2 === 0) px(c2, tx + 1, ty + 1, TILE - 2, TILE - 2, C.floorShade);
            px(c2, tx, ty + TILE - 1, TILE, 1, "#3b291b");
          }
        }
      }

      for (const s of sparks) {
        const a = Math.max(0, s.life / s.max);
        const dx = s.x - cx;
        const dy = s.y - cy;
        if (dx * dx + dy * dy > radiusSq) continue;
        disc(c2, s.x, s.y, 1.4, `rgba(255,200,90,${a})`);
      }

      drawPlayer();
      drawTorch();

      // darkness around and outside the light radius
      const grd = c2.createRadialGradient(cx, cy, radius * 0.55, cx, cy, radius * 1.05);
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(1, "rgba(0,0,0,0.85)");
      c2.fillStyle = grd;
      c2.fillRect(0, 0, W, H);

      c2.fillStyle = C.dark;
      c2.fillRect(0, 0, W, Math.max(0, cy - radius));
      c2.fillRect(0, Math.min(H, cy + radius), W, Math.max(0, H - (cy + radius)));
      c2.fillRect(0, Math.max(0, cy - radius), Math.max(0, cx - radius), radius * 2);
      c2.fillRect(Math.min(W, cx + radius), Math.max(0, cy - radius), Math.max(0, W - (cx + radius)), radius * 2);
    }

    function drawPlayer() {
      const x = player.x;
      const y = player.y;
      const bob = Math.sin(player.breath * 2) * 0.5;
      disc(c2, x, y + 4, 4, "rgba(0,0,0,0.4)");
      px(c2, x - 2, y - 4 + bob, 4, 5, C.playerOutline);
      px(c2, x - 2, y - 4 + bob, 4, 4, C.player);
      px(c2, x - 2, y + 0 + bob, 4, 1, C.playerShade);
      disc(c2, x, y - 6 + bob, 2.4, C.playerOutline);
      disc(c2, x, y - 6 + bob, 2, C.playerSkin);
      px(c2, x - 1.5, y + 1 + bob, 1, 2, C.playerOutline);
      px(c2, x + 1, y + 1 + bob, 1, 2, C.playerOutline);
    }

    function drawTorch() {
      const x = player.x;
      const y = player.y;
      const fb = Math.sin(player.breath * 6) * 0.6;
      px(c2, x - 1, y - 8, 2, 1, C.playerOutline);
      disc(c2, x, y - 11 + fb, 2.4, C.flameOuter);
      disc(c2, x, y - 11 + fb, 1.5, C.flameMid);
      disc(c2, x, y - 11 + fb, 0.8, C.flameInner);
      disc(c2, x, y - 11 + fb, 4, "rgba(255,170,70,0.18)");
    }

    const kd = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W" || k === "ц" || k === "Ц") keys["up"] = true;
      if (k === "ArrowDown" || k === "s" || k === "S" || k === "ы" || k === "Ы") keys["down"] = true;
      if (k === "ArrowLeft" || k === "a" || k === "A" || k === "ф" || k === "Ф") keys["left"] = true;
      if (k === "ArrowRight" || k === "d" || k === "D" || k === "в" || k === "В") keys["right"] = true;
    };
    const ku = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === "ArrowUp" || k === "w" || k === "W" || k === "ц" || k === "Ц") keys["up"] = false;
      if (k === "ArrowDown" || k === "s" || k === "S" || k === "ы" || k === "Ы") keys["down"] = false;
      if (k === "ArrowLeft" || k === "a" || k === "A" || k === "ф" || k === "Ф") keys["left"] = false;
      if (k === "ArrowRight" || k === "d" || k === "D" || k === "в" || k === "В") keys["right"] = false;
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);

    if (started) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
    };
  }, [started, paused]);

  // timer readout
  useEffect(() => {
    if (!started || won || paused) return;
    const id = window.setInterval(() => setTime((t) => +(t + 0.1).toFixed(1)), 100);
    return () => window.clearInterval(id);
  }, [started, won, paused]);

  const begin = () => {
    playQuackRef.current();
    setStarted(true);
  };

  const dispatchDir = (key: string, down: boolean) => () => {
    window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { key }));
  };

  return (
    <div className="relative z-10 mx-auto max-w-[460px] px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 text-center"
      >
        <p className="font-hand text-xl text-soft">Финальное испытание</p>
        <h2 className="heading shimmer-text text-4xl sm:text-5xl">Лабиринт с факелом</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-soft">
          Факел освещает лишь шаг перед тобой. Найди выход там, где светится золотое сердце. 🕯️
        </p>
      </motion.div>

      <div className="relative mx-auto w-full max-w-[460px]">
        <canvas
          ref={canvasRef}
          className="block w-full rounded-2xl border-4 border-[#3a2c22] shadow-2xl"
          style={{ imageRendering: "pixelated", aspectRatio: "320 / 180" }}
        />
        {started && !won && (
          <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/55 px-3 py-1 text-xs font-extrabold text-white backdrop-blur">
            ⏱ {time.toFixed(1)} с
          </div>
        )}
        {!started && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/55 p-5 text-center backdrop-blur-sm"
          >
            <p className="font-script text-3xl text-white drop-shadow">
              Возьми факел и вперёд.
            </p>
            <p className="max-w-[16rem] text-sm text-white/90">
              Управление: стрелки или WASD. Иди на свет в конце туннеля.
            </p>
            <motion.button
              onClick={begin}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="btn-accent rounded-full px-7 py-3 text-lg font-extrabold"
            >
              Войти в лабиринт
            </motion.button>
          </motion.div>
        )}
        {won && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/65 p-5 text-center backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: [0, -12, 12, 0] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className="text-5xl"
            >
              🕯️
            </motion.div>
            <p className="font-script text-3xl text-white drop-shadow">Ты вышел из тьмы…</p>
            <p className="text-sm text-white/90">Теперь я скажу главное.</p>
          </motion.div>
        )}
      </div>

      <div className="mt-4 grid w-full grid-cols-3 grid-rows-3 gap-1.5 text-sm font-bold sm:hidden">
        <button
          onPointerDown={dispatchDir("ArrowUp", true)}
          onPointerUp={dispatchDir("ArrowUp", false)}
          onPointerLeave={dispatchDir("ArrowUp", false)}
          onPointerCancel={dispatchDir("ArrowUp", false)}
          className="col-start-2 flex items-center justify-center rounded-xl bg-[#2a1a0e]/60 py-3 text-white"
          style={{ touchAction: "none" }}
          aria-label="up"
        >
          ▲
        </button>
        <button
          onPointerDown={dispatchDir("ArrowLeft", true)}
          onPointerUp={dispatchDir("ArrowLeft", false)}
          onPointerLeave={dispatchDir("ArrowLeft", false)}
          onPointerCancel={dispatchDir("ArrowLeft", false)}
          className="col-start-1 row-start-2 flex items-center justify-center rounded-xl bg-[#2a1a0e]/60 py-3 text-white"
          style={{ touchAction: "none" }}
          aria-label="left"
        >
          ◀
        </button>
        <button
          onPointerDown={dispatchDir("ArrowRight", true)}
          onPointerUp={dispatchDir("ArrowRight", false)}
          onPointerLeave={dispatchDir("ArrowRight", false)}
          onPointerCancel={dispatchDir("ArrowRight", false)}
          className="col-start-3 row-start-2 flex items-center justify-center rounded-xl bg-[#2a1a0e]/60 py-3 text-white"
          style={{ touchAction: "none" }}
          aria-label="right"
        >
          ▶
        </button>
        <button
          onPointerDown={dispatchDir("ArrowDown", true)}
          onPointerUp={dispatchDir("ArrowDown", false)}
          onPointerLeave={dispatchDir("ArrowDown", false)}
          onPointerCancel={dispatchDir("ArrowDown", false)}
          className="col-start-2 row-start-3 flex items-center justify-center rounded-xl bg-[#2a1a0e]/60 py-3 text-white"
          style={{ touchAction: "none" }}
          aria-label="down"
        >
          ▼
        </button>
      </div>
    </div>
  );
}
