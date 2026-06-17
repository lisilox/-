import { motion } from "framer-motion";
import SettingsContent from "./SettingsContent";

export default function SettingsScreen({
  onContinue,
  onBack,
}: {
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass rounded-[2rem] p-6 shadow-2xl sm:p-9"
      >
        <div className="mb-6 text-center">
          <p className="font-hand text-xl text-soft">Перед стартом</p>
          <h2 className="font-script text-4xl text-accent sm:text-5xl">Настрой свой мир</h2>
        </div>

        <SettingsContent />

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onBack}
            className="order-2 rounded-full border border-[rgba(var(--c-accent-rgb),0.25)] px-6 py-3 font-semibold text-[var(--c-text)] transition hover:bg-white/50 sm:order-1"
          >
            ← Назад
          </button>
          <motion.button
            onClick={onContinue}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="btn-accent order-1 rounded-full px-9 py-3 text-lg font-extrabold sm:order-2"
          >
            К игре! 🎮
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
