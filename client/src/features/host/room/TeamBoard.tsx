import { CheckCircle2, Users } from "lucide-react";
import { Pill } from "../../../components/Pill";
import { Scores } from "../../../components/game/Scores";
import type { GameScreenProps } from "../types";

export function TeamBoard({ room, busy, act }: GameScreenProps) {
  const team = room.scores.find((score) => score.id === room.activeTeam);
  return (
    <section className="card board-card">
      <Pill kind="green">
        <Users size={15} />
        {team?.name}’s turn
      </Pill>
      <h2>Pick a tile. Take the challenge.</h2>
      <p className="muted">Choose a tile. Answer together. Make it count.</p>
      <div className="tile-grid">
        {room.tiles.map((tile) => (
          <button
            key={tile.index}
            className={"question-tile color-" + (tile.index % 4)}
            disabled={tile.used || busy}
            onClick={() => void act("host:pick", tile.index)}
          >
            {tile.used ? (
              <CheckCircle2 size={32} />
            ) : (
              <>
                <span>QUESTION {tile.index + 1}</span>
                <strong>{tile.points}</strong>
                <small>points</small>
              </>
            )}
          </button>
        ))}
      </div>
      <Scores room={room} />
    </section>
  );
}
