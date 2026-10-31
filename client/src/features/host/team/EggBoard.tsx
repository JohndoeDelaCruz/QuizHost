import { Dice5, Egg, Flower2 } from "lucide-react";
import type { GameScreenProps } from "../types";
import { TeamToken } from "./TeamToken";
export function EggBoard({ room, busy, act }: GameScreenProps) {
  const state = room.teamGame!;
  return (
    <div className="egg-game">
      <div className="team-board-action">
        <button
          className="btn primary"
          disabled={busy || !!state.roll}
          onClick={() => void act("host:team-action", { type: "roll" })}
        >
          <Dice5 size={20} />
          Roll for steps
        </button>
        <span>
          {state.roll
            ? `Rolled ${state.roll} · choose a highlighted square`
            : "Roll, then choose where to explore"}
        </span>
      </div>
      <div className="garden-grid">
        {state.grid!.cells.map((cell) => (
          <button
            key={cell.index}
            className={
              "garden-cell" +
              (cell.blocked ? " rock" : "") +
              (state.reachable?.includes(cell.index) ? " reachable" : "") +
              (cell.collected ? " explored" : "")
            }
            aria-label={`Garden square ${cell.index + 1}${cell.blocked ? ", rock" : cell.eggs ? ", eggs" : ""}${state.reachable?.includes(cell.index) ? ", reachable" : ""}`}
            disabled={busy || !state.reachable?.includes(cell.index)}
            onClick={() =>
              void act("host:team-action", { type: "move", index: cell.index })
            }
          >
            <small>{cell.index + 1}</small>
            {cell.blocked ? (
              <Flower2 size={30} />
            ) : cell.eggs ? (
              <Egg className="garden-egg" size={30} />
            ) : cell.collected ? (
              <span className="collected-eggs">+{cell.collected} 🥚</span>
            ) : null}
            <span className="cell-tokens">
              {state
                .positions!.filter((position) => position.value === cell.index)
                .map((position) => (
                  <TeamToken
                    room={room}
                    id={position.teamId}
                    key={position.teamId}
                    size={26}
                  />
                ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
