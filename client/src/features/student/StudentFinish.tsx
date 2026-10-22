import { Trophy } from "lucide-react";
import type { RoomView, Score } from "../../../../shared/types";
import { Celebration } from "../../animation";
import { Podium } from "../../components/game/Podium";
import { Scores } from "../../components/game/Scores";
import type { Identity } from "./identity";

export function StudentFinish({
  room,
  identity,
  me,
}: {
  room: RoomView;
  identity: Identity | null;
  me: Score | undefined;
}) {
  return (
    <section className="card student-finish">
      <span className="winner-icon">
        <Trophy size={42} />
      </span>
      <span className="eyebrow">LOOK AT YOU GO</span>
      <Celebration key={room.id} />
      <h1>That’s a wrap!</h1>
      <p>
        You earned <strong>{me?.score.toLocaleString() ?? 0} points</strong>.
        Keep that curiosity going.
      </p>
      <Podium scores={room.scores} />
      <Scores room={room} playerId={identity?.id} />
      <p className="helper">Your teacher has saved the results.</p>
    </section>
  );
}
