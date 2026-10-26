import { Trophy } from "lucide-react";
import type { RoomView } from "../../../../shared/types";
import { Avatar } from "./Avatar";

export function Podium({ scores }: { scores: RoomView["scores"] }) {
  return (
    <div className="podium" aria-label="Top three scores">
      {[1, 0, 2]
        .filter((index) => scores[index])
        .map((index) => (
          <div
            className={`podium-place podium-place-${index + 1}`}
            key={scores[index].id}
          >
            {index === 0 && (
              <Trophy className="podium-trophy" size={32} aria-hidden="true" />
            )}
            <Avatar avatar={scores[index].avatar} size={98} />
            <strong className="podium-name">{scores[index].name}</strong>
            <span className="podium-score">
              {scores[index].score.toLocaleString()} pts
            </span>
            <div className="podium-block">
              <span>{index + 1}</span>
            </div>
          </div>
        ))}
    </div>
  );
}
