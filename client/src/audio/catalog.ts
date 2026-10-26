export const TRACKS = {
  lobby: { file: "01_lobby_bounce", title: "Lobby Bounce" },
  question: { file: "02_question_energy", title: "Question Energy" },
  thinking: { file: "03_thinking_timer", title: "Thinking Timer" },
  ranking: { file: "04_leaderboard_reveal", title: "Leaderboard Reveal" },
  victory: { file: "05_victory_celebration", title: "Victory Celebration" },
  correct: { file: "06_correct_answer", title: "Correct Answer" },
  wrong: { file: "07_wrong_answer", title: "Wrong Answer" },
  countdown: { file: "08_final_five_seconds", title: "Final Five Seconds" },
} as const;
export type Track = keyof typeof TRACKS;
export type AudioRole = "host" | "student";
export interface SoundSettings {
  muted: boolean;
  music: boolean;
  effects: boolean;
  volume: number;
}
export function defaultSoundSettings(_role: AudioRole): SoundSettings {
  return { muted: false, music: true, effects: true, volume: 1 };
}
export const soundSettingsKey = (role: AudioRole) => `quizhost:sound:v2:${role}`;
export function readSoundSettings(role: AudioRole, storage?: Pick<Storage, "getItem">): SoundSettings {
  const defaults = defaultSoundSettings(role);
  try {
    const saved = JSON.parse((storage ?? localStorage).getItem(soundSettingsKey(role)) ?? "null");
    if (!saved || typeof saved !== "object") return defaults;
    return {
      muted: typeof saved.muted === "boolean" ? saved.muted : defaults.muted,
      music: typeof saved.music === "boolean" ? saved.music : defaults.music,
      effects: typeof saved.effects === "boolean" ? saved.effects : defaults.effects,
      volume: typeof saved.volume === "number" && Number.isFinite(saved.volume)
        ? Math.max(0, Math.min(1, saved.volume)) : defaults.volume,
    };
  } catch {
    return defaults;
  }
}
