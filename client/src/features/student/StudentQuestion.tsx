import { CheckCircle2 } from "lucide-react";
import type { RoomView } from "../../../../shared/types";
import { Pill } from "../../components/Pill";
import { Answers } from "../../components/game/Answers";
import { Timer } from "../../components/game/Timer";

export function StudentQuestion({
  room,
  answer,
  busy,
  connected,
}: {
  room: RoomView;
  answer: (index: number) => Promise<void>;
  busy: boolean;
  connected: boolean;
}) {
  return (
    <section
      className={"student-question card motion-" + room.phase}
      key={room.id + ":" + room.questionIndex}
    >
      <div className="section-heading">
        <Pill>
          QUESTION {room.questionIndex + 1} / {room.questionCount}
        </Pill>
        {room.phase === "question" ? (
          <Timer room={room} />
        ) : (
          <Pill kind="green">Answer revealed</Pill>
        )}
      </div>
      <h1>{room.question?.prompt}</h1>
      {room.phase === "question" && room.myAnswer ? (
        <div className="locked-answer">
          <CheckCircle2 size={44} />
          <h2>Locked in.</h2>
          <p>Nice thinking. Wait for the answer reveal.</p>
          <Pill>Your answer: {["A", "B", "C", "D"][room.myAnswer.index]}</Pill>
        </div>
      ) : (
        <Answers room={room} onAnswer={answer} disabled={busy || !connected} />
      )}
      {room.phase === "reveal" && (
        <div
          className={
            "answer-feedback " + (room.myAnswer?.correct ? "positive" : "")
          }
        >
          <strong>
            {room.myAnswer
              ? room.myAnswer.correct
                ? `You got it! +${room.myAnswer.earned} points`
                : "A good question to learn from."
              : "Time’s up — no answer submitted."}
          </strong>
          <p>Wait for your teacher to continue.</p>
        </div>
      )}
    </section>
  );
}
