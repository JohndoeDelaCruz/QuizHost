import { Download, Trophy } from "lucide-react";
import type { Result } from "../../../../shared/types";
import { Pill } from "../../components/Pill";
import { Scores } from "../../components/game/Scores";
import { download } from "../../lib";
import { resultCSV } from "../../../../shared/resultCSV";
import { TEAM_GAMES } from "../../../../shared/teamGames";

export function ResultsPage({ results }: { results: Result[] }) {
  return (
    <>
      <div className="page-heading compact">
        <div>
          <span className="eyebrow">CELEBRATE THE LEARNING</span>
          <h1>
            Classroom results<span className="green-text">.</span>
          </h1>
          <p>A record of every finished game, saved on this laptop.</p>
        </div>
      </div>
      {!results.length ? (
        <div className="empty-state card">
          <Trophy size={42} />
          <h2>The first win is waiting.</h2>
          <p>Finish a game to see scores here.</p>
        </div>
      ) : (
        results.map((result) => (
          <div className="result-card card" key={result.id}>
            <div className="section-heading">
              <div>
                <Pill>
                  {result.teamGame
                    ? TEAM_GAMES[result.teamGame].title
                    : result.mode === "teams"
                      ? "Team play"
                      : "Individual play"}
                </Pill>
                <h2>{result.quizTitle}</h2>
                <p>
                  {new Date(result.finishedAt).toLocaleString()} ·{" "}
                  {result.scores.length}{" "}
                  {result.mode === "teams" ? "teams" : "students"}
                </p>
              </div>
              <button
                className="btn secondary small"
                onClick={() =>
                  download(
                    "quizhost-results.csv",
                    resultCSV(result),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                <Download size={15} />
                Export CSV
              </button>
            </div>
            {result.winnerIds && (
              <p>
                {result.winnerIds.length === 0
                  ? "Draw"
                  : `${result.winnerIds.length > 1 ? "Shared win" : "Winner"}: ${result.scores
                      .filter((s) => result.winnerIds!.includes(s.id))
                      .map((s) => s.name)
                      .join(" & ")}`}{" "}
                · {result.finishReason}
              </p>
            )}
            <Scores room={result} />
          </div>
        ))
      )}
    </>
  );
}
