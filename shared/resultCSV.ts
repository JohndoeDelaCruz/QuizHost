import type { Result } from "./types";
import { TEAM_GAMES } from "./teamGames";

export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return (
    '"' +
    (/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
    '"'
  );
}

export function resultCSV(result: Result) {
  const rows: unknown[][] = [
    [
      "Rank",
      "Name",
      "Score",
      "Correct answers",
      "Quiz",
      "Finished",
      "Game",
      "Score unit",
      "Winner",
      "Finish reason",
    ],
    ...result.scores.map((score, index) => [
      index + 1,
      score.name,
      score.score,
      score.correct,
      result.quizTitle,
      result.finishedAt,
      result.teamGame ? TEAM_GAMES[result.teamGame].title : result.mode,
      result.scoreUnit ?? "pts",
      result.winnerIds
        ? result.winnerIds.includes(score.id)
          ? "Yes"
          : "No"
        : index === 0
          ? "Yes"
          : "No",
      result.finishReason ?? "",
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
