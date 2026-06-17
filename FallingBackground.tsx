import { useMemo, type CSSProperties } from "react";
import { useSettings, type EmojiKey } from "../settings/SettingsContext";

const EMOJI_SETS: Record<EmojiKey, string[]> = {
  hearts: ["❤️", "💕", "💖", "💗", "💝", "❣️"],
  stars: ["⭐", "✨", "🌟", "💫", "🟡"],
  flowers: ["🌸", "🌷", "🌼", "🌻", "🌺", "💐"],
};

const LABELS: Record<EmojiKey, string> = {
  hearts: "сердечки",
  stars: "звёздочки",
  flowers: "цветочки",
};

const PER_TYPE = 11;

interface Particle {
  emoji: string;
  style: CSSProperties;
  key: string;
}

function buildParticles(active: EmojiKey[]): Particle[] {
  const out: Particle[] = [];
  let i = 0;
  for (const type of active) {
    const pool = EMOJI_SETS[type];
    for (let n = 0; n < PER_TYPE; n++) {
      const left = Math.random() * 100;
      const dur = 6 + Math.random() * 8; // 6 to 14s
      const delay = -Math.random() * dur; // negative => start mid-fall, fill the screen
      const size = 16 + Math.random() * 24;
      const drift = (Math.random() - 0.5) * 160; // px horizontal drift
      const spin = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360);
      const opacity = 0.7 + Math.random() * 0.3;
      out.push({
        emoji: pool[Math.floor(Math.random() * pool.length)],
        key: `${type}-${i++}`,
        style: {
          left: `${left}%`,
          top: "-8%",
          fontSize: `${size}px`,
          animation: `fall ${dur}s linear ${delay}s infinite`,
          filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.08))",
          ["--drift" as string]: `${drift}px`,
          ["--spin" as string]: `${spin}deg`,
          ["--fo" as string]: `${opacity}`,
        } as CSSProperties,
      });
    }
  }
  return out;
}

export default function FallingBackground() {
  const { emojis } = useSettings();
  const active = useMemo(
    () => (Object.keys(emojis) as EmojiKey[]).filter((k) => emojis[k]),
    [emojis]
  );
  const particles = useMemo(() => buildParticles(active), [active]);
  const label = active.map((k) => LABELS[k]).join(" + ") || "ничего";

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* soft animated blobs for depth */}
      <div
        className="absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl opacity-50"
        style={{ background: "var(--c-accent-2)", animation: "blob 14s ease-in-out infinite" }}
      />
      <div
        className="absolute -right-20 bottom-0 h-80 w-80 rounded-full blur-3xl opacity-40"
        style={{ background: "var(--c-accent)", animation: "blob 18s ease-in-out infinite reverse" }}
      />
      {/* falling emojis */}
      {particles.map((p) => (
        <span key={p.key} className="absolute select-none" style={p.style}>
          {p.emoji}
        </span>
      ))}
      {/* tiny live legend (sr-only) */}
      <span className="sr-only">На фоне падают: {label}</span>
    </div>
  );
}
