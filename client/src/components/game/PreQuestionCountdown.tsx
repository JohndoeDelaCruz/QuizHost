import { Sparkles } from "lucide-react";
import type { AvatarId } from "../../../../shared/avatars";
import type { RoomView } from "../../../../shared/types";
import { Avatar } from "./Avatar";
import { useServerClock } from "./useServerClock";
import { CountdownNumber } from "./CountdownNumber";

export function PreQuestionCountdown({ room, avatar }: { room: RoomView; avatar?: AvatarId }) {
  const now = useServerClock(room.serverNow);
  const remaining = Math.max(0, (room.startsAt ?? now) - now);
  const seconds = Math.ceil(remaining / 1000);
  const progress = Math.max(0, Math.min(100, 100 * (1 - remaining / room.preQuestionMs)));
  const questionNumber = room.mode === "teams" ? room.tiles.filter((tile) => tile.used).length : room.questionIndex + 1;
  return (
    <section className="round-countdown pre-question-countdown" aria-label="Get ready for the next question">
      <span className="countdown-kicker"><Sparkles size={15} /> QUESTION {questionNumber} OF {room.questionCount}</span>
      <h1>Ready, curious minds?</h1>
      <div className="countdown-buddies" aria-hidden="true">
        <div className="countdown-mascot"><Avatar avatar={avatar} size={104} /></div>
        <CountdownNumber value={seconds || "Go!"} />
        <span className="countdown-star">✦</span>
      </div>
      <strong className="pre-question-caption">{seconds ? `Question opens in ${seconds} ${seconds === 1 ? "second" : "seconds"}` : "Here comes the question!"}</strong>
      <div className="reading-progress pre-question-progress" role="progressbar" aria-label="Time until the question appears" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="countdown-shapes" aria-hidden="true"><i /><i /><i /><i /></div>
    </section>
  );
}
