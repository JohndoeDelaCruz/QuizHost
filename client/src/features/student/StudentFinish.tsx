import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { RoomView, Score } from "../../../../shared/types";
import { Celebration } from "../../animation";
import { Podium } from "../../components/game/Podium";
import { Scores } from "../../components/game/Scores";
import type { Identity } from "./identity";
import { VictoryTrophy } from "../../components/game/VictoryTrophy";

export function StudentFinish({
  room,
  identity,
  me,
}: {
  room: RoomView;
  identity: Identity | null;
  me: Score | undefined;
}) {
  const [view, setView] = useState("podium");
  const [page, setPage] = useState(() => Math.max(0, Math.floor(room.scores.findIndex((score) => score.id === identity?.id) / 3)));
  const pages = Math.max(1, Math.ceil(room.scores.length / 3));
  return (
    <section className={"card student-finish" + (view === "scores" ? " is-score-view" : "")}>
      <VictoryTrophy />
      <span className="eyebrow">LOOK AT YOU GO</span>
      <Celebration key={room.id} />
      <h1>That’s a wrap!</h1>
      <p>
        You earned <strong>{me?.score.toLocaleString() ?? 0} points</strong>.
        Keep that curiosity going.
      </p>
      <div className="finish-tabs" role="group" aria-label="Results view">
        <button className="btn secondary small" aria-pressed={view === "podium"} onClick={() => setView("podium")}>Podium</button>
        <button className="btn secondary small" aria-pressed={view === "scores"} onClick={() => setView("scores")}>All scores</button>
      </div>
      {view === "podium" ? <Podium scores={room.scores} /> : <div className="finish-scores">
        <Scores room={{ scores: room.scores.slice(page * 3, page * 3 + 3) }} playerId={identity?.id} rankOffset={page * 3} />
        <nav className="score-pages" aria-label="Score pages">
          <button className="btn secondary small" aria-label="Previous scores" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft size={18} /></button>
          <span>{page + 1} / {pages}</span>
          <button className="btn secondary small" aria-label="Next scores" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}><ChevronRight size={18} /></button>
        </nav>
      </div>}
    </section>
  );
}
