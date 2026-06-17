import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const HEART_POOL = ["❤️", "💕", "💖", "💗", "💝", "✨", "🌸"];

function Burst({ active }: { active: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => {
        const angle = (i / 22) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 130 + Math.random() * 200;
        return {
          id: i,
          emoji: HEART_POOL[i % HEART_POOL.length],
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist - 30,
          size: 18 + Math.random() * 26,
          delay: Math.random() * 0.25,
          rot: (Math.random() - 0.5) * 260,
        };
      }),
    []
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute select-none"
          style={{ fontSize: p.size }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
          animate={
            active
              ? { x: p.x, y: p.y, opacity: [0, 1, 0], scale: [0, 1.15, 0.9], rotate: p.rot }
              : { x: 0, y: 0, opacity: 0, scale: 0 }
          }
          transition={{ duration: 1.9, delay: 0.4 + p.delay, ease: "easeOut" }}
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

export default function EndingScreen({ onRestart }: { onRestart: () => void }) {
  const [opened, setOpened] = useState(false);

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-14">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex w-full max-w-xl flex-col items-center"
      >
        <motion.div
          animate={
            opened
              ? { opacity: 0, y: -14, scale: 0.95 }
              : { opacity: 1, y: 0, scale: 1 }
          }
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <p className="font-hand text-2xl text-soft">Все испытания пройдены</p>
          <h2 className="heading shimmer-text text-5xl sm:text-6xl">А теперь самое главное</h2>
        </motion.div>

        <div
          className="relative flex w-full items-center justify-center"
          style={{ minHeight: "clamp(420px, 70vh, 540px)" }}
        >
          <Burst active={opened} />

          {/* envelope */}
          <motion.div
            className="absolute"
            style={{
              left: "50%",
              top: "50%",
              width: "min(86vw, 320px)",
              height: "min(56vw, 200px)",
              perspective: "1300px",
            }}
            initial={{ x: "-50%", y: "-50%", scale: 1, opacity: 1 }}
            animate={
              opened
                ? { x: "-50%", y: "-44%", scale: 0.5, opacity: 0.4 }
                : { x: "-50%", y: "-50%", scale: 1, opacity: 1 }
            }
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <div
              className="absolute -inset-6 rounded-[2rem] blur-2xl"
              style={{ background: "var(--c-glow)", opacity: 0.6 }}
            />
            <div
              className="absolute inset-0 rounded-2xl shadow-2xl"
              style={{
                background: "linear-gradient(135deg,#fff6fb,#ffe3ef 60%,#ffd0e3)",
                border: "1px solid rgba(255,255,255,0.7)",
              }}
            />
            <div
              className="absolute inset-0 rounded-b-2xl shadow-inner"
              style={{
                background: "linear-gradient(135deg,#ffd0e3,#ffc0dc 60%,#ffb1d0)",
                clipPath: "polygon(0 100%, 100% 100%, 50% 30%)",
              }}
            />
            <motion.div
              className="absolute left-0 top-0 rounded-t-2xl shadow-md"
              style={{
                width: "100%",
                height: "60%",
                background: "linear-gradient(135deg,#ffe6f1,#ffd0e3 60%,#ffc2dd)",
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                transformOrigin: "top center",
              }}
              animate={opened ? { rotateX: -176 } : { rotateX: 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute left-1/2 top-[12%] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full text-2xl shadow-lg"
              style={{ background: "radial-gradient(circle at 35% 30%, #f9a8d4, #ec4899)" }}
              animate={opened ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              💌
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {opened && (
              <motion.div
                key="letter"
                className="absolute z-30 w-[min(94vw,380px)]"
                style={{ left: "50%", top: "50%" }}
                initial={{ x: "-50%", y: "-44%", opacity: 0, scale: 0.5 }}
                animate={{ x: "-50%", y: "-50%", opacity: 1, scale: 1 }}
                exit={{ x: "-50%", y: "-44%", opacity: 0, scale: 0.5 }}
                transition={{ delay: 0.55, type: "spring", stiffness: 180, damping: 22 }}
              >
                <div
                  className="relative overflow-y-auto rounded-[1.6rem] bg-white/95 p-7 text-left shadow-2xl ring-1 ring-white/70"
                  style={{ maxHeight: "min(70vh, 520px)" }}
                >
                  <div className="pointer-events-none absolute -right-4 -top-4 text-4xl opacity-70">
                    💝
                  </div>
                  <div className="mb-4 text-center">
                    <p className="heading text-3xl text-accent">Моей родной Настеньке</p>
                    <div className="mx-auto mt-1 h-[2px] w-16 rounded-full bg-[var(--c-accent)]/40" />
                  </div>
                  <div className="space-y-4 text-[14.5px] leading-relaxed text-slate-700 sm:text-[15.5px]">
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className="font-semibold text-slate-800"
                    >
                      Моя Настенька.
                    </motion.p>
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4 }}
                    >
                      Спасибо тебе за все, я очень рад что мы встретились в тот день в автобусе и я очень
                      сильно тебя люблю и хочу чтобы наши отношения продлились как можно дольше и что бы
                      все у нас было хорошо
                    </motion.p>
                    <motion.p
                      className="pt-2 text-center heading text-2xl font-bold text-accent"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.9, type: "spring", stiffness: 200 }}
                    >
                      Я люблю тебя всем сердцем. ❤️
                    </motion.p>
                    <motion.p
                      className="text-right font-hand text-2xl text-accent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 2.3 }}
                    >
                      Навсегда твой 💛
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-7 flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            {!opened ? (
              <motion.button
                key="open"
                onClick={() => setOpened(true)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="btn-accent rounded-full px-9 py-4 text-lg font-extrabold"
              >
                Прочитать признание 💌
              </motion.button>
            ) : (
              <motion.div
                key="after"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col items-center gap-3 sm:flex-row"
              >
                <button
                  onClick={() => setOpened(false)}
                  className="rounded-full border border-[rgba(var(--c-accent-rgb),0.25)] px-6 py-3 font-semibold text-[var(--c-text)] transition hover:bg-white/50"
                >
                  ↺ Прочитать заново
                </button>
                <button
                  onClick={onRestart}
                  className="btn-accent rounded-full px-6 py-3 font-extrabold"
                >
                  Вернуться в начало 🏠
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
