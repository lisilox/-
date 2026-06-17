import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { MusicEngine } from "./musicEngine";

export type Theme = "pink" | "purple" | "mint";
export type EmojiKey = "hearts" | "stars" | "flowers";
export type TrackId = "track1" | "track2" | "track3";

interface SettingsValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  emojis: Record<EmojiKey, boolean>;
  toggleEmoji: (k: EmojiKey) => void;
  activeTrack: TrackId | null;
  playTrack: (id: TrackId) => void;
  toggleTrack: (id: TrackId) => void;
  stopMusic: () => void;
  playPop: () => void;
  playQuack: () => void;
}

const Ctx = createContext<SettingsValue | null>(null);

export function useSettings(): SettingsValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSettings must be used within SettingsProvider");
  return v;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("pink");
  const [emojis, setEmojis] = useState<Record<EmojiKey, boolean>>({
    hearts: true,
    stars: false,
    flowers: false,
  });
  const [activeTrack, setActiveTrack] = useState<TrackId | null>(null);
  const engineRef = useRef<MusicEngine | null>(null);
  if (engineRef.current === null) engineRef.current = new MusicEngine();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    return () => engineRef.current?.dispose();
  }, []);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleEmoji = (k: EmojiKey) => setEmojis((e) => ({ ...e, [k]: !e[k] }));

  const playTrack = (id: TrackId) => {
    engineRef.current?.play(id);
    setActiveTrack(id);
  };
  // mutually exclusive: tapping the playing track stops it, otherwise it switches
  const toggleTrack = (id: TrackId) => {
    if (activeTrack === id) {
      engineRef.current?.stop();
      setActiveTrack(null);
    } else {
      playTrack(id);
    }
  };
  const stopMusic = () => {
    engineRef.current?.stop();
    setActiveTrack(null);
  };
  const playPop = () => engineRef.current?.pop();
  const playQuack = () => engineRef.current?.quack();

  return (
    <Ctx.Provider
      value={{
        theme,
        setTheme,
        emojis,
        toggleEmoji,
        activeTrack,
        playTrack,
        toggleTrack,
        stopMusic,
        playPop,
        playQuack,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
