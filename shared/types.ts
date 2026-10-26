import type { AvatarId } from "./avatars";

export type Mode = "individual" | "teams";
export type Phase =
  | "lobby"
  | "board"
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
  ranking: { previousScores: Score[]; readyAt: number } | null;
  deadline: number | null;
  startsAt: number | null;
  serverNow: number;
  scores: Score[];
  answeredCount: number;
  tiles: { index: number; points: number; used: boolean }[];
  activeTeam: string | null;
  myAnswer?: { index: number; correct?: boolean; earned?: number };
}
export interface Result {
  id: string;
  quizTitle: string;
  mode: Mode;
  finishedAt: string;
  questionCount: number;
  scores: Score[];
}
export interface NetworkInfo {
  port: number;
  addresses: string[];
  qr: string | null;
}
export interface Ack<T = undefined> {
  ok: boolean;
  data?: T;
  error?: string;
}
