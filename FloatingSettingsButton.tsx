import { motion } from "framer-motion";
import { useSettings } from "../settings/SettingsContext";

export default function FloatingSettingsButton({ onClick }: { onClick: () => void }) {
  const { activeTrack, emojis } = useSettings();
  const emojiCount = Object.values(emojis).filter(Boolean).length;
  const hasSomething = activeTrack || emojiCount > 0;

  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, rotate: -90 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 14 }}
      whileHover={{ scale: 1.1, rotate: 8 }}
      whileTap={{ scale: 0.92 }}
      className="glass fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-xl"
      aria-label="Открыть настройки"
    >
      ⚙️
      {hasSomething && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--c-accent)] opacity-60" />
          <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--c-accent)] text-[9px] font-bold text-white">
            •
          </span>
        </span>
      )}
    </motion.button>
  );
}
