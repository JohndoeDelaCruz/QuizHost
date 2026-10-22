import type { Question } from "../../../../shared/types";

export function freshQuestion(): Question {
  return {
    id: crypto.randomUUID(),
    prompt: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    seconds: 20,
    points: 100,
  };
}
