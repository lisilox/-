import { motion } from "framer-motion";

export default function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative max-w-xl text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 160, damping: 14 }}
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full glass text-2xl animate-heartbeat"
        >
          ✦
        </motion.div>

        <p className="font-hand text-2xl text-soft">Тайный путь, что ведёт…</p>
        <h1 className="heading mt-1 text-6xl leading-tight shimmer-text sm:text-7xl">
          Только для тебя
        </h1>

        <p className="mx-auto mt-7 max-w-md text-lg leading-relaxed text-[var(--c-text)]/90">
          За этой дверью тебя ждут утренняя деревня, тихий лес и лабиринт с факелом. Пройди их до конца, и
          ты найдёшь то, что я не могу сказать вслух. То, что хранится в самом сердце. 🌙
        </p>

        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="btn-accent mt-9 inline-flex items-center gap-3 rounded-full px-9 py-4 text-lg font-bold tracking-wide"
        >
          Открыть дверь
        </motion.button>

        <p className="mt-6 text-sm text-soft">
          Притронься к шестерёнке внизу, если захочешь изменить фон, звук или краски мира.
        </p>
      </motion.div>

      {/* decorative floating emoji */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[8%] top-[18%] text-3xl opacity-60 animate-floaty"
      >
        ❊
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-[10%] top-[26%] text-2xl opacity-60 animate-floaty"
        style={{ animationDelay: "1.2s" }}
      >
        ✦
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[14%] left-[16%] text-3xl opacity-60 animate-floaty"
        style={{ animationDelay: "0.6s" }}
      >
        ❋
      </div>
    </div>
  );
}
