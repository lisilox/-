import { useSettings, type EmojiKey, type Theme, type TrackId } from "../settings/SettingsContext";
import { TRACKS } from "../settings/musicEngine";

const EMOJI_META: { key: EmojiKey; label: string; icon: string }[] = [
  { key: "hearts", label: "Сердечки", icon: "❤️" },
  { key: "stars", label: "Звёздочки", icon: "⭐" },
  { key: "flowers", label: "Цветочки", icon: "🌸" },
];

const THEME_META: { key: Theme; label: string; swatch: string; ring: string }[] = [
  { key: "pink", label: "Розовый", swatch: "linear-gradient(135deg,#ff8fc7,#ec4899)", ring: "#ec4899" },
  { key: "purple", label: "Фиолетовый", swatch: "linear-gradient(135deg,#b9a4fb,#8b5cf6)", ring: "#8b5cf6" },
  { key: "mint", label: "Мятный", swatch: "linear-gradient(135deg,#7ef0c8,#10b981)", ring: "#10b981" },
];

const TRACK_IDS: TrackId[] = ["track1", "track2", "track3"];

function Equalizer() {
  return (
    <span className="ml-2 inline-flex h-3 items-end gap-[2px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="eq-bar w-[3px] rounded-full bg-white"
          style={{ height: "100%", animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}

export default function SettingsContent() {
  const { emojis, toggleEmoji, theme, setTheme, activeTrack, toggleTrack, stopMusic } = useSettings();

  return (
    <div className="space-y-6 text-center sm:text-left">
      <p className="text-soft leading-relaxed">
        Привет, Настюш! 💛 Здесь можно настроить этот маленький мир под себя. Включи любимую
        музыку, выбери падающие смайлики на фоне (можно сразу несколько!) и поменяй цвет всей
        страницы. Эти настройки работают и во время игры, кнопка-шестерёнка всегда под рукой.
      </p>

      {/* MUSIC */}
      <section className="glass rounded-3xl p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <span>🎵</span> Музыка
          </h3>
          <button
            onClick={stopMusic}
            disabled={!activeTrack}
            className="rounded-full px-3 py-1 text-sm font-semibold text-accent transition enabled:hover:bg-[rgba(var(--c-accent-rgb),0.12)] disabled:opacity-40"
          >
            ⏸ Выключить
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TRACK_IDS.map((id) => {
            const def = TRACKS[id];
            const active = activeTrack === id;
            return (
              <button
                key={id}
                onClick={() => toggleTrack(id)}
                className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                  active
                    ? "active-pill border-transparent"
                    : "border-[rgba(var(--c-accent-rgb),0.18)] bg-white/40 text-[var(--c-text)] hover:bg-white/70"
                }`}
              >
                <span className="text-xl">{def.emoji}</span>
                <div className="mt-1 flex items-center justify-center">
                  {def.name}
                  {active && <Equalizer />}
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-soft">
          Треки переключаются по очереди, новый звук плавно заменит старый.
        </p>
      </section>

      {/* EMOJIS */}
      <section className="glass rounded-3xl p-4 sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <span>🌧️</span> Падающие смайлики
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {EMOJI_META.map(({ key, label, icon }) => {
            const active = emojis[key];
            return (
              <button
                key={key}
                onClick={() => toggleEmoji(key)}
                className={`rounded-2xl border px-2 py-3 text-sm font-semibold transition ${
                  active
                    ? "active-pill border-transparent"
                    : "border-[rgba(var(--c-accent-rgb),0.18)] bg-white/40 text-[var(--c-text)] hover:bg-white/70"
                }`}
              >
                <div className="text-2xl">{icon}</div>
                <div className="mt-1">{label}</div>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-soft">
          Их можно совмещать, выбери один, два или сразу все три ✨
        </p>
      </section>

      {/* THEME */}
      <section className="glass rounded-3xl p-4 sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <span>🎨</span> Тема сайта
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {THEME_META.map(({ key, label, swatch, ring }) => {
            const active = theme === key;
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`rounded-2xl border px-2 py-3 text-sm font-semibold transition ${
                  active
                    ? "border-transparent bg-white/70"
                    : "border-[rgba(var(--c-accent-rgb),0.18)] bg-white/40 hover:bg-white/70"
                }`}
                style={active ? { boxShadow: `0 0 0 3px ${ring}55` } : undefined}
              >
                <span
                  className="mx-auto mb-1 block h-8 w-8 rounded-full"
                  style={{ background: swatch, boxShadow: `0 4px 12px ${ring}66` }}
                />
                {label}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
