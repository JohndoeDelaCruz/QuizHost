import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { Pill } from "../../../components/Pill";
import { Answers } from "../../../components/game/Answers";
import { Timer } from "../../../components/game/Timer";
import { QuestionImageView } from "../../../components/game/QuestionImage";
import type { GameScreenProps } from "../types";

export function HostQuestion({ room, busy, act }: GameScreenProps) {
  const team = room.scores.find((score) => score.id === room.activeTeam);
  return (
    <div className="room-grid question-layout">
      <section
        className={"card live-question motion-" + room.phase}
        key={room.id + ":" + room.questionIndex}
      >
        <div className="section-heading">
          <Pill>
            QUESTION{" "}
            {room.mode === "teams"
              ? room.tiles.filter((t) => t.used).length
              : room.questionIndex + 1}{" "}
            OF {room.questionCount}
          </Pill>
          {room.phase === "question" ? (
            <Timer room={room} />
          ) : (
            <Pill kind="green">
              <CheckCircle2 size={15} />
              Answer revealed
            </Pill>
          )}
        </div>
        {room.mode === "teams" && (
          <p className="team-turn">
            {team?.name}’s turn · {room.question?.points} points
          </p>
        )}
        <div
          className={
            "question-stimulus" + (room.question?.image ? " with-image" : "")
          }
        >
          <h2>{room.question?.prompt}</h2>
          <QuestionImageView image={room.question?.image} />
        </div>
        <Answers room={room} />
        <div className="question-controls">
          {room.phase === "question" ? (
            <>
              <span className="muted">
                {room.mode === "individual"
                  ? `${room.answeredCount} of ${room.scores.length} answers locked in`
                  : "Let your team discuss before revealing."}
              </span>
              <button
                className="btn primary"
                disabled={busy}
                onClick={() => void act("host:reveal")}
              >
                Reveal answer <ArrowRight size={17} />
              </button>
            </>
          ) : room.mode === "individual" ? (
            <>
              <span className="muted" role="status">
                Points are in. The rankings are coming up…
              </span>
            </>
          ) : (
            <>
              <span className="muted">Did {team?.name} get it?</span>
              <div className="row">
                <button
                  className="btn secondary"
                  disabled={busy}
                  onClick={() => void act("host:award", false)}
                >
                  Missed it
                </button>
                <button
                  className="btn primary"
                  disabled={busy}
                  onClick={() => void act("host:award", true)}
                >
                  <Check size={17} />
                  Correct +{room.question?.points}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
