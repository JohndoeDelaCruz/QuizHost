import { ArrowDown } from "lucide-react";
import type { CSSProperties } from "react";
import type { GameScreenProps } from "../types";
import { TeamToken, teamColor } from "./TeamToken";
export function GridBoard({ room, busy, act }: GameScreenProps) {
  const state = room.teamGame!,
    grid = state.grid!,
    connect = state.id === "connectFour";
  return (
    <div className={"claim-board " + (connect ? "connect-board" : "tic-board")}>
      {connect && (
        <div className="column-controls">
          {Array.from({ length: 7 }, (_, index) => (
            <button
              key={index}
              className="btn secondary small"
              aria-label={`Drop into column ${index + 1}`}
              disabled={busy || !!grid.cells[index].owner}
              onClick={() =>
                void act("host:team-action", { type: "column", index })
              }
            >
              <ArrowDown size={20} />
            </button>
          ))}
        </div>
      )}
      <div
        className="claim-grid"
        style={{ "--board-columns": grid.columns } as CSSProperties}
      >
        {grid.cells.map((cell) => (
          <button
            key={cell.index}
            className={"claim-cell" + (cell.owner ? " claimed" : "")}
            style={
              cell.owner
                ? ({
                    "--team-color": teamColor(room, cell.owner),
                  } as CSSProperties)
                : undefined
            }
            aria-label={`${connect ? `Row ${Math.floor(cell.index / 7) + 1}, column ${(cell.index % 7) + 1}` : `Square ${cell.index + 1}`}${cell.owner ? ", claimed by " + room.scores.find((team) => team.id === cell.owner)?.name : ", empty"}`}
            disabled={connect || busy || !!cell.owner}
            onClick={() =>
              void act("host:team-action", { type: "pick", index: cell.index })
            }
          >
            {cell.owner ? (
              <>
                <TeamToken
                  room={room}
                  id={cell.owner}
                  size={connect ? 36 : 58}
                />
                {!connect && (
                  <span>
                    {state.teamOrder.indexOf(cell.owner) === 0 ? "X" : "O"}
                  </span>
                )}
              </>
            ) : !connect ? (
              <span>{cell.index + 1}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
