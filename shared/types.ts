import type { AvatarId } from "./avatars";
import type { TeamGameId, TeamGameView } from "./teamGames";

export type Mode = "individual" | "teams";
export type Phase =
  | "lobby"
  | "board"
  | "activity"
  | "preparing"
  | "countdown"
  | "question"
  | "reveal"
  | "ranking"
  | "finished";
export interface QuestionImage {
  id: string;
  description: string;
}
export interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  seconds: number;
  points: number;
  image?: QuestionImage;
  puzzleAnswer?: string;
}
export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  updatedAt: string;
}
export interface Score {
  id: string;
  name: string;
  score: number;
  connected?: boolean;
  correct: number;
  avatar?: AvatarId;
}
export interface JoinNotice {
  id: string;
  roomId: string;
  player: Pick<Score, "id" | "name" | "avatar">;
}
export interface PublicQuestion {
  id: string;
  prompt: string;
  options: string[];
  seconds: number;
  points: number;
  image?: QuestionImage;
  correctIndex?: number;
}
export interface RoomView {
  id: string;
  pin: string;
  quizTitle: string;
  mode: Mode;
  phase: Phase;
  questionIndex: number;
  questionCount: number;
  question: PublicQuestion | null;
  preview: Pick<PublicQuestion, "id" | "prompt" | "image"> | null;
  preparationMs: number;
  preQuestionMs: number;
  ranking: { previousScores: Score[]; readyAt: number } | null;
  deadline: number | null;
  startsAt: number | null;
  serverNow: number;
  scores: Score[];
  answeredCount: number;
  tiles: { index: number; points: number; used: boolean; label?: string }[];
  activeTeam: string | null;
  myAnswer?: { index: number; correct?: boolean; earned?: number };
  teamGame?: TeamGameView;
  scoreUnit?: string;
}
export interface Result {
  id: string;
  quizTitle: string;
  mode: Mode;
  finishedAt: string;
  questionCount: number;
  scores: Score[];
  teamGame?: TeamGameId;
  scoreUnit?: string;
  winnerIds?: string[];
  finishReason?: string;
}
export interface NetworkInfo {
  port: number;
  addresses: string[];
  interfaces?: { name: string; url: string }[];
  qr: string | null;
}
export interface Ack<T = undefined> {
  ok: boolean;
  data?: T;
  error?: string;
}
