import { useState, type CSSProperties } from "react";
import type { GameScreenProps } from "../types";
import { TeamToken } from "./TeamToken";
export function BingoBoard({
  room,
  busy,
  act,
  compact = false,
}: GameScreenProps & { compact?: boolean }) {
  const bingo = room.teamGame!.bingo!;
  return (
    <div className={"bingo-game" + (compact ? " is-compact" : "")}>
      {!compact && (
        <div className="team-board-action">
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => void act("host:team-action", { type: "draw" })}
          >
            Draw next question
          </button>
          <span>
            {bingo.drawn.length} / {room.questionCount} drawn
          </span>
        </div>
      )}
      <div className="bingo-boards">
        {bingo.boards.map((board) => (
          <section key={board.teamId}>
            <TeamToken room={room} id={board.teamId} size={30} name />
            <div
              className="bingo-grid"
              style={{ "--board-columns": bingo.size } as CSSProperties}
            >
              {board.cells.map((cell) => (
                <div
                  key={cell.questionIndex}
                  className={
                    (cell.marked ? "marked " : "") +
                    (cell.questionIndex === room.questionIndex ? "current" : "")
                  }
                  aria-label={`Question ${cell.label}${cell.marked ? ", marked" : ""}`}
                >
                  {cell.marked ? "✓" : cell.label}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
export function BingoJudge({ room, busy, act }: GameScreenProps) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="bingo-judge">
      <h3>Which teams answered correctly?</h3>
      <div className="row">
        <button
          className="btn subtle small"
          disabled={busy}
          onClick={() => setSelected(room.scores.map((team) => team.id))}
        >
          Select all
        </button>
        <button
          className="btn subtle small"
          disabled={busy}
          onClick={() => setSelected([])}
        >
          Clear
        </button>
      </div>
      <div className="bingo-team-checks">
        {room.scores.map((team) => (
          <label key={team.id}>
            <input
              type="checkbox"
              disabled={busy}
              checked={selected.includes(team.id)}
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? [...selected, team.id]
                    : selected.filter((id) => id !== team.id),
                )
              }
            />
            <TeamToken room={room} id={team.id} size={30} name />
          </label>
        ))}
      </div>
      <button
        className="btn primary"
        disabled={busy}
        onClick={() =>
          void act("host:team-action", {
            type: "bingo-award",
            teamIds: selected,
          })
        }
      >
        {selected.length
          ? `Mark ${selected.length} ${selected.length === 1 ? "team" : "teams"}`
          : "No correct teams — continue"}
      </button>
      <BingoBoard room={room} busy={busy} act={act} compact />
    </div>
  );
}
