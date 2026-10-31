import { Dice5 } from "lucide-react";
import type { GameScreenProps } from "../types";
import { TeamToken } from "./TeamToken";
const LINKS: Record<number, number> = {
  3: 11,
  8: 16,
  15: 23,
  22: 29,
  17: 7,
  25: 13,
  28: 20,
};
export function RaceBoard({ room, busy, act }: GameScreenProps) {
  const state = room.teamGame!,
    adventure = state.id === "adventure",
    finish = adventure ? 20 : 30;
  const numbers = Array.from({ length: finish / 5 }, (_, row) =>
    Array.from(
      { length: 5 },
      (_, col) => row * 5 + (row % 2 ? 5 - col : col + 1),
    ),
  )
    .reverse()
    .flat();
  return (
    <div
      className={"race-game " + (adventure ? "adventure-trail" : "snake-trail")}
    >
      <div className="race-legend">
        {adventure ? (
          <>
            Green: +2 spaces
            {state.config.hazards ? " · Red: back 2" : " · Red hazards off"}
          </>
        ) : (
          "Follow the numbered path · Ladders climb, snakes slide"
        )}
      </div>
      <div className="race-grid">
        {numbers.map((number) => {
          const jump = !adventure
            ? LINKS[number]
            : [3, 10, 16].includes(number)
              ? Math.min(finish, number + 2)
              : state.config.hazards && [7, 13, 18].includes(number)
                ? number - 2
                : undefined;
          return (
            <div
              key={number}
              className={
                "race-cell" +
                (jump !== undefined
                  ? jump > number
                    ? " boost"
                    : " hazard"
                  : "") +
                (number === finish ? " finish" : "")
              }
            >
              <span className="race-number">
                {number === finish ? "🏁 " : ""}
                {number}
              </span>
              {jump !== undefined && (
                <small>
                  {jump > number ? "↗" : "↘"} {jump}
                </small>
              )}
              <div className="cell-tokens">
                {state
                  .positions!.filter((position) => position.value === number)
                  .map((position) => (
                    <TeamToken
                      room={room}
                      id={position.teamId}
                      key={position.teamId}
                      size={30}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="race-start">
        <strong>START</strong>
        {state
          .positions!.filter((position) => position.value === 0)
          .map((position) => (
            <TeamToken
              room={room}
              id={position.teamId}
              key={position.teamId}
              size={32}
            />
          ))}
      </div>
      <div className="team-board-action">
        {adventure && (
          <button
            className="btn secondary"
            disabled={busy}
            onClick={() =>
              void act("host:team-action", { type: "roll", safe: true })
            }
          >
            Safe hop · 1
          </button>
        )}
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => void act("host:team-action", { type: "roll" })}
        >
          <Dice5 size={20} /> Roll {adventure ? "1–3" : "1–6"} and answer
        </button>
      </div>
    </div>
  );
}
