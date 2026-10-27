import type { RoomView } from "../../../../shared/types";
import { Pill } from "../../components/Pill";
import { Answers } from "../../components/game/Answers";
import { Timer } from "../../components/game/Timer";
import { QuestionImageView } from "../../components/game/QuestionImage";
import { Avatar } from "../../components/game/Avatar";
import type { AvatarId } from "../../../../shared/avatars";
import { useEffect, useState } from "react";
import { QuestionPrompt } from "../../components/game/QuestionPrompt";
import { TextReader } from "../../components/game/TextReader";

export function StudentQuestion({
  room,
  answer,
  busy,
  connected,
  avatar,
}: {
  room: RoomView;
  answer: (index: number) => Promise<void>;
  busy: boolean;
  connected: boolean;
  avatar?: AvatarId;
}) {
  const [review, setReview] = useState(false);
  useEffect(() => setReview(false), [room.phase]);
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
      <QuestionPrompt key={room.phase} text={room.question?.prompt ?? ""} compact />
      <QuestionImageView image={room.question?.image} />
      {!(room.phase === "question" && room.myAnswer) && <button className="text-link choices-review" onClick={() => setReview(true)}>Read full choices</button>}
      {review && <TextReader entries={(room.question?.options ?? []).map((text, answer) => ({ label: `Answer ${"ABCD"[answer]}`, text, answer }))} onClose={() => setReview(false)} onChoose={room.phase === "question" && !room.myAnswer ? answer : undefined} disabled={busy || !connected} />}
      {room.phase === "question" && room.myAnswer ? (
        <div className="locked-answer">
          <Avatar avatar={avatar} size={96} />
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
