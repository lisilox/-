import { create } from "./tinyStore";

export type Phase =
  | { kind: "home" }
  | { kind: "settings" }
  | { kind: "game"; index: 1 | 2 }
  | { kind: "letter"; index: 1 | 2 }
  | { kind: "maze" }
  | { kind: "ending" };

interface ProgressState {
  phase: Phase;
  settingsModalOpen: boolean;
}

export const progressStore = create<ProgressState>({ phase: { kind: "home" }, settingsModalOpen: false });

export const progress = {
  go(p: Phase) {
    progressStore.set({ phase: p });
  },
  setSettingsModal(open: boolean) {
    progressStore.set({ settingsModalOpen: open });
  },
};
