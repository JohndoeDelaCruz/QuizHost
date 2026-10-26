import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { RoomView } from "../../../shared/types";
import { readSoundSettings, soundSettingsKey, type AudioRole, type SoundSettings } from "./catalog";
import { GameAudioEngine, type AudioSnapshot } from "./engine";
import { hostAudioScene, roomAudioScene, type AudioScene } from "./scene";

interface SoundContext {
  role: AudioRole;
  settings: SoundSettings;
  snapshot: AudioSnapshot;
  unlock: () => void;
  update: (patch: Partial<SoundSettings>) => void;
  setScene: (scene: AudioScene | null) => void;
}
const AudioContext = createContext<SoundContext | null>(null);

export function AudioProvider({ role, children }: { role: AudioRole; children: ReactNode }) {
  const [settings, setSettings] = useState(() => readSoundSettings(role));
  const [snapshot, setSnapshot] = useState<AudioSnapshot>({ status: "locked", playing: null });
  const settingsRef = useRef(settings);
  const sceneRef = useRef<AudioScene | null>(null);
  const engineRef = useRef<GameAudioEngine | null>(null);
  useEffect(() => {
    const engine = new GameAudioEngine(settingsRef.current);
    engineRef.current = engine;
    const unsubscribe = engine.subscribe(() => setSnapshot(engine.snapshot()));
    const visibility = () => engine.setVisible(!document.hidden);
    visibility();
    engine.setScene(sceneRef.current);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      unsubscribe();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);
  const unlock = useCallback(() => { void engineRef.current?.unlock(); }, []);
  const update = useCallback((patch: Partial<SoundSettings>) => {
    const next = { ...settingsRef.current, ...patch };
    settingsRef.current = next;
    setSettings(next);
    engineRef.current?.setSettings(next);
    try { localStorage.setItem(soundSettingsKey(role), JSON.stringify(next)); } catch { /* Session-only preference. */ }
  }, [role]);
  const setScene = useCallback((scene: AudioScene | null) => {
    sceneRef.current = scene;
    engineRef.current?.setScene(scene);
  }, []);
  const value = useMemo(() => ({ role, settings, snapshot, unlock, update, setScene }),
    [role, settings, snapshot, unlock, update, setScene]);
  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const audio = useContext(AudioContext);
  if (!audio) throw new Error("AudioProvider is required");
  return audio;
}

export function useGameAudio(room: RoomView | null, active: boolean) {
  const { role, setScene } = useAudio();
  useEffect(() => {
    setScene(active && room ? roomAudioScene(room, role) : null);
  }, [room, active, role, setScene]);
  useEffect(() => () => setScene(null), [setScene]);
}

export function useHostAudio(room: RoomView | null, tab: string, connected: boolean) {
  const { setScene } = useAudio();
  useEffect(() => {
    setScene(hostAudioScene(room, tab, connected));
  }, [room, tab, connected, setScene]);
  useEffect(() => () => setScene(null), [setScene]);
}
