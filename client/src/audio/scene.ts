import type { RoomView } from "../../../shared/types";
import type { AudioRole, Track } from "./catalog";

export interface AudioScene {
  round: string;
  phase: RoomView["phase"];
  music: Track | null;
  feedback: "correct" | "wrong" | null;
  countdown: { key: string; endsAt: number } | null;
}

export function hostAudioScene(
  room: RoomView | null,
  tab: string,
  connected: boolean,
): AudioScene | null {
  if (!connected) return null;
  if (tab === "library") {
    return {
      round: "workspace:library", phase: "lobby", music: "lobby",
      feedback: null, countdown: null,
    };
  }
  return tab === "room" && room ? roomAudioScene(room, "host") : null;
}

export function roomAudioScene(
  room: RoomView,
  role: AudioRole,
  now = Date.now(),
): AudioScene {
  const music: Track | null =
    room.phase === "lobby" || room.phase === "board" ? "lobby" :
    room.phase === "preparing" || room.phase === "countdown" ? "thinking" :
    room.phase === "question" ? (role === "student" && room.myAnswer ? "thinking" : "question") :
    room.phase === "ranking" ? "ranking" :
    room.phase === "finished" ? "victory" : null;
  let feedback: AudioScene["feedback"] = null;
  if (role === "student" && (room.phase === "reveal" || room.phase === "ranking")) {
    feedback = room.myAnswer?.correct ? "correct" : "wrong";
  } else if (role === "host" && room.mode === "teams" && room.phase === "ranking") {
    const old = room.ranking?.previousScores.find((s) => s.id === room.activeTeam);
    const current = room.scores.find((s) => s.id === room.activeTeam);
    if (old && current) feedback = current.score > old.score ? "correct" : "wrong";
  }
  const round = `${room.id}:${room.questionIndex}`;
  return {
    round, phase: room.phase, music, feedback,
    countdown: room.phase === "question" && room.deadline && !(role === "student" && room.myAnswer)
      ? { key: round, endsAt: now + room.deadline - room.serverNow } : null,
  };
}
