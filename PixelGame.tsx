import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DuckGame, type Dir } from "./game/DuckGame";
import { FoxGame } from "./game/FoxGame";
import { useSettings } from "../settings/SettingsContext";

export type GameKind = "duck" | "fox";

import type { GameApi } from "./game/DuckGame";

function mapKey(k: string): Dir | "jump" | null {
  switch (k) {
    case "ArrowUp":
    case "w":
    case "W":
    case "ц":
    case "Ц":
      return "up";
    case "ArrowDown":
    case "s":
    case "S":
    case "ы":
    case "Ы":
      return "down";
    case "ArrowLeft":
    case "a":
    case "A":
    case "ф":
    case "Ф":
      return "left";
    case "ArrowRight":
    case "d":
    case "D":
    case "в":
    case "В":
      return "right";
    case "j":
    case "J":
    case "z":
    case "Z":
    case " ":
      return "jump";
    default:
      return null;
  }
}

interface Props {
  kind: GameKind;
  onFinish: () => void;
  paused: boolean;
}

export default function PixelGame({ kind, onFinish, paused }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameApi | null>(null);
  const { playPop, playQuack } = useSettings();
  const sfx = useRef({ playPop, playQuack });
  sfx.current = { playPop, playQuack };
  const finishCb = useRef(onFinish);
  finishCb.current = onFinish;

  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let g!: GameApi;
    if (kind === "duck") {
      g = new DuckGame(canvas, {
        onCatch: () => setScore((s) => s + 1),
        onPop: () => sfx.current.playPop(),
        onQuack: () => sfx.current.playQuack(),
        onWin: () => {
          setWon(true);
          window.setTimeout(() => finishCb.current(), 1700);
        },
      });
    } else {
      g = new FoxGame(canvas, {
        onCatch: () => setScore((s) => s + 1),
        onPop: () => sfx.current.playPop(),
        onQuack: () => sfx.current.playQuack(),
        onWin: () => {
          setWon(true);
          window.setTimeout(() => finishCb.current(), 1700);
        },
      });
    }
    gameRef.current = g;
    setTotal(g.total);
    setScore(0);
    setTime(0);

    const kd = (e: KeyboardEvent) => {
      const d = mapKey(e.key);
      if (d === "jump") {
        g!.jump?.();
        e.preventDefault();
        return;
      }
      if (d) {
        g!.setKey(d, true);
        e.preventDefault();
      }
    };
    const ku = (e: KeyboardEvent) => {
      const d = mapKey(e.key);
      if (d && d !== "jump") {
        g!.setKey(d, false);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", kd);
    window.addEventListener("keyup", ku);
    return () => {
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      g.destroy();
    };
  }, [kind]);

  useEffect(() => {
    const g = gameRef.current;
    if (!g) return;
    if (paused) g.pause();
    else if (started) g.resume();
  }, [paused, started]);

  useEffect(() => {
    if (!started || won || paused) return;
    const id = window.setInterval(() => {
      setTime(Math.floor((gameRef.current?.elapsed ?? 0) * 10) / 10);
    }, 100);
    return () => window.clearInterval(id);
  }, [started, won, paused]);

  const begin = () => {
    sfx.current.playQuack();
    const g = gameRef.current;
    if (!g) return;
    g.start();
    setStarted(true);
    setScore(0);
  };

  const hold = (d: Dir, down: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    gameRef.current?.setKey(d, down);
  };

  const DpadBtn = ({ d, label, className }: { d: Dir; label: string; className?: string }) => (
    <button
      onPointerDown={hold(d, true)}
      onPointerUp={hold(d, false)}
      onPointerLeave={hold(d, false)}
      onPointerCancel={hold(d, false)}
      className={`flex items-center justify-center rounded-xl bg-white/70 text-xl font-black text-[var(--c-text)] shadow active:scale-95 active:bg-white ${className ?? ""}`}
      style={{ touchAction: "none" }}
      aria-label={d}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-[460px]">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="block w-full rounded-2xl border-4 border-white/70 shadow-2xl"
          style={{ imageRendering: "pixelated", aspectRatio: "320 / 180" }}
        />
        {started && !won && (
          <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between text-xs font-extrabold">
            <span className="rounded-full bg-black/45 px-3 py-1 text-white backdrop-blur">
              🌟 Счёт: {score}/{total}
            </span>
            <span className="rounded-full bg-black/45 px-3 py-1 text-white backdrop-blur">
              ⏱ {time.toFixed(1)} с
            </span>
          </div>
        )}
        <AnimatePresence>
          {!started && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-black/45 p-5 text-center backdrop-blur-sm"
            >
              <p className="font-script text-3xl text-white drop-shadow">
                {kind === "duck" ? "Утка-спасатель!" : "Лисья тропа!"}
              </p>
              <p className="max-w-[16rem] text-sm text-white/90">
                {kind === "duck" ? (
                  <>Бабушки сбежали из домиков 🏠 Поймай их всех своей уткой.</>
                ) : (
                  <>Лови детей, прячущихся в лесу. Но остерегайся стражей, они тебе не рады.</>
                )}
              </p>
              <motion.button
                onClick={begin}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className="btn-accent rounded-full px-7 py-3 text-lg font-extrabold"
              >
                Вперёд!
              </motion.button>
              <p className="text-[11px] text-white/70">
                Управление: стрелки / WASD
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {won && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-black/55 p-5 text-center backdrop-blur-sm"
            >
              <motion.div
                animate={{ rotate: [0, -12, 12, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="text-5xl"
              >
                🌟
              </motion.div>
              <p className="font-script text-3xl text-white drop-shadow">Испытание пройдено!</p>
              <p className="text-sm text-white/90">Открываю твоё послание… ✉️</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 grid w-full grid-cols-3 grid-rows-3 gap-1.5 text-sm font-bold sm:hidden">
        <DpadBtn d="up" label="▲" className="col-start-2" />
        <DpadBtn d="left" label="◀" className="col-start-1 row-start-2" />
        <DpadBtn d="right" label="▶" className="col-start-3 row-start-2" />
        <DpadBtn d="down" label="▼" className="col-start-2 row-start-3" />
      </div>
      <p className="mt-3 text-center text-sm text-soft">
        Управление:{" "}
        <b className="text-[var(--c-text)]">стрелки / WASD</b> · открыть настройки ⚙️
      </p>
    </div>
  );
}
