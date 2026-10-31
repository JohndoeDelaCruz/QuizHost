import type { GameScreenProps } from "../types";
import { SportsScene } from "./SportsScene";
export function SportsBoard({ room, busy, act }: GameScreenProps) {
  const game = room.teamGame!.id;
  const rack = room.teamGame!.racks?.find(
    (item) => item.teamId === room.activeTeam,
  );
  return (
    <div className="sports-game">
      <SportsScene
        game={game}
        shot={
          rack
            ? {
                sport: "bowling",
                targetX: 0,
                targetY: 0,
                wind: 0,
                keeper: 50,
                pins: rack.pins,
              }
            : undefined
        }
      />
      {rack && (
        <p className="team-setting-note">
          {rack.pins.filter(Boolean).length} pins standing · Ball{" "}
          {rack.balls + 1} · Rack {rack.frames + 1}
        </p>
      )}
      <div className="team-board-action">
        <button
          className="btn primary"
          disabled={busy}
          onClick={() => void act("host:team-action", { type: "draw" })}
        >
          Answer a question to unlock your{" "}
          {game === "soccer" || game === "football" ? "kick" : "shot"}
        </button>
      </div>
    </div>
  );
}
