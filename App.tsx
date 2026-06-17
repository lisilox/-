import { AnimatePresence, motion } from "framer-motion";
import { SettingsProvider } from "./settings/SettingsContext";
import FallingBackground from "./components/FallingBackground";
import HomeScreen from "./components/HomeScreen";
import SettingsScreen from "./components/SettingsScreen";
import SettingsModal from "./components/SettingsModal";
import FloatingSettingsButton from "./components/FloatingSettingsButton";
import GameScreen from "./components/GameScreen";
import LetterScreen from "./components/LetterScreen";
import MazeScreen from "./components/MazeScreen";
import EndingScreen from "./components/EndingScreen";
import { progressStore, progress } from "./state/progress";

function AppRoutes() {
  const { phase, settingsModalOpen: settingsOpen } = progressStore.use();

  return (
    <div className="app-bg relative min-h-screen w-full overflow-x-hidden">
      <FallingBackground />

      <AnimatePresence mode="wait">
        {phase.kind === "home" && (
          <motion.div key="home" exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
            <HomeScreen onStart={() => progress.go({ kind: "settings" })} />
          </motion.div>
        )}
        {phase.kind === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <SettingsScreen
              onContinue={() => progress.go({ kind: "game", index: 1 })}
              onBack={() => progress.go({ kind: "home" })}
            />
          </motion.div>
        )}
        {phase.kind === "game" && (
          <motion.div
            key={`game-${phase.index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <GameScreen
              index={phase.index}
              onFinish={() => progress.go({ kind: "letter", index: phase.index })}
              paused={settingsOpen}
            />
          </motion.div>
        )}
        {phase.kind === "letter" && (
          <motion.div
            key={`letter-${phase.index}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <LetterScreen
              index={phase.index}
              onContinue={() => {
                const next = (phase.index + 1) as 1 | 2;
                if (next <= 2) progress.go({ kind: "game", index: next });
                else progress.go({ kind: "maze" });
              }}
              onBack={() => progress.go({ kind: "game", index: phase.index })}
            />
          </motion.div>
        )}
        {phase.kind === "maze" && (
          <motion.div
            key="maze"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            <MazeScreen
              onFinish={() => progress.go({ kind: "ending" })}
              paused={settingsOpen}
            />
          </motion.div>
        )}
        {phase.kind === "ending" && (
          <motion.div
            key="ending"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <EndingScreen onRestart={() => progress.go({ kind: "home" })} />
          </motion.div>
        )}
      </AnimatePresence>

      {(phase.kind === "home" || phase.kind === "game" || phase.kind === "maze") && (
        <FloatingSettingsButton onClick={() => progress.setSettingsModal(true)} />
      )}

      <SettingsModal open={settingsOpen} onClose={() => progress.setSettingsModal(false)} />

      <footer className="relative z-10 pb-4 text-center text-xs text-soft">
        Сделано с любовью 💕 только для Настеньки
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppRoutes />
    </SettingsProvider>
  );
}
