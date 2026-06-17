import { AnimatePresence, motion } from "framer-motion";
import SettingsContent from "./SettingsContent";

export default function SettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="glass relative z-10 max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] p-6 shadow-2xl no-scrollbar sm:rounded-[2rem] sm:p-7"
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-script text-3xl text-accent">Быстрые настройки</h2>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/60 text-xl font-bold transition hover:bg-white"
                aria-label="Закрыть настройки"
              >
                ✕
              </button>
            </div>
            <SettingsContent />
            <button
              onClick={onClose}
              className="btn-accent mt-7 w-full rounded-full py-3 text-lg font-extrabold"
            >
              Готово ✨
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
