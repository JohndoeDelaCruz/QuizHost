import { CheckCircle2, Users } from "lucide-react";
import { Pill } from "../../../components/Pill";
import { Scores } from "../../../components/game/Scores";
import type { GameScreenProps } from "../types";
import { MiniGameBoard } from "../team/MiniGameBoard";
import { TEAM_GAMES } from "../../../../../shared/teamGames";

export function TeamBoard({ room, busy, act }: GameScreenProps) {
  const team = room.scores.find((score) => score.id === room.activeTeam);
  if (
    room.teamGame &&
    !["quiz", "classic", "junior"].includes(room.teamGame.id)
  )
    return <MiniGameBoard room={room} busy={busy} act={act} />;
  const surprises =
    room.teamGame?.id === "classic" || room.teamGame?.id === "junior";
  return (
    <section className="card board-card">
      <Pill kind="green">
        <Users size={15} />
        {team?.name}’s turn
      </Pill>
      <h2>
        {room.teamGame
          ? TEAM_GAMES[room.teamGame.id].title
          : "Pick a tile. Take the challenge."}
      </h2>
      <details className="game-rules">
        <summary>How to play</summary>
        <p>
          {room.teamGame?.rules ??
            "Choose a tile. Answer together. Make it count."}
        </p>
      </details>
      <div className="tile-grid">
        {room.tiles.map((tile) => (
          <button
            key={tile.index}
            className={"question-tile color-" + (tile.index % 4)}
            disabled={tile.used || busy}
            onClick={() => void act("host:pick", tile.index)}
          >
            {tile.used ? (
              <>
                <CheckCircle2 size={32} />
                {tile.label && <small>{tile.label}</small>}
              </>
            ) : (
              <>
                <span>
                  {surprises ? "TILE" : "QUESTION"} {tile.index + 1}
                </span>
                <strong>{surprises ? "?" : tile.points}</strong>
                <small>{surprises ? "Question or surprise" : "points"}</small>
              </>
            )}
          </button>
        ))}
      </div>
      <Scores room={room} />
    </section>
  );
}
