import { Eye, Hourglass } from "lucide-react";
import type { RoomView } from "../../../../shared/types";
import { QuestionImageView } from "./QuestionImage";
import { useServerClock } from "./useServerClock";

export function QuestionIntro({ room }: { room: RoomView }) {
  const now = useServerClock(room.serverNow);
  const remaining = Math.max(0, (room.startsAt ?? now) - now);
  const progress = Math.min(
    100,
    Math.max(0, 100 * (1 - remaining / room.preparationMs)),
  );
  if (!room.preview) return null;
  return (
    <section
      className={"question-intro" + (room.preview.image ? " has-image" : "")}
      aria-label="Read the question before answering"
    >
      <span className="intro-kicker">
        <Eye size={18} /> QUESTION{" "}
        {room.mode === "teams"
          ? room.tiles.filter((tile) => tile.used).length
          : room.questionIndex + 1}{" "}
        OF {room.questionCount}
      </span>
      <div className="intro-body">
        <h1>{room.preview.prompt}</h1>
        <QuestionImageView image={room.preview.image} />
      </div>
      <div className="reading-status">
        <Hourglass size={18} />
        <span>
          {remaining > 0
            ? `Answers open in ${Math.ceil(remaining / 1000)} seconds`
            : "Opening answers…"}
        </span>
      </div>
      <div
        className="reading-progress"
        role="progressbar"
        aria-label="Question reading countdown"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <p>Read carefully. Your full answer time starts next.</p>
    </section>
  );
}
