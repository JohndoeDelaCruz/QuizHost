import { Trophy } from "lucide-react";
import type { RoomView } from "../../../../shared/types";
import { useScoreMotion } from "../../animation";
import { Avatar } from "./Avatar";

export function Scores({
  room,
  playerId,
}: {
  room: Pick<RoomView, "scores">;
  playerId?: string;
}) {
  const registerRow = useScoreMotion(room.scores);
  return (
    <div className="score-list">
      {room.scores.map((s, i) => (
        <div
          className={"score-row " + (s.id === playerId ? "is-me" : "")}
          key={s.id}
          ref={(node) => registerRow(s.id, node)}
        >
          <span className={"rank rank-" + i}>
            {i < 3 && i === 0 ? <Trophy size={17} /> : i + 1}
          </span>
          <Avatar avatar={s.avatar} size={36} />
          <span className="score-name">
            {s.name}
            {s.id === playerId && <small>You</small>}
            {s.connected === false && <small>Reconnecting</small>}
          </span>
          <strong>{s.score.toLocaleString()}</strong>
          <span className="muted">pts</span>
        </div>
      ))}
      {!room.scores.length && (
        <p className="muted">Your students will appear here when they join.</p>
      )}
    </div>
  );
}
