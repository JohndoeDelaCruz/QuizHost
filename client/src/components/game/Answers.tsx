import { Check, CheckCircle2 } from "lucide-react";
import type { RoomView } from "../../../../shared/types";
import { AnswerShape } from "./AnswerShape";

export function Answers({
  room,
  onAnswer,
  disabled = false,
}: {
  room: RoomView;
  onAnswer?: (index: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="answers">
      {room.question?.options.map((option, index) => {
        const reveal = room.phase === "reveal" || room.phase === "finished";
        const correct = reveal && room.question?.correctIndex === index;
        return (
          <button
            key={index}
            className={
              "answer answer-" +
              index +
              (correct ? " correct" : "") +
              (reveal && !correct ? " incorrect" : "") +
              (room.myAnswer?.index === index ? " selected" : "")
            }
            onClick={() => onAnswer?.(index)}
            disabled={disabled || !onAnswer || reveal || !!room.myAnswer}
            aria-label={`${["A", "B", "C", "D"][index]}. ${option}${correct ? ". Correct answer" : ""}`}
          >
            <AnswerShape index={index} />
            <span className="answer-text">{option}</span>
            <span className="answer-letter" aria-hidden="true">
              {["A", "B", "C", "D"][index]}
            </span>
            {correct && <CheckCircle2 size={22} />}{" "}
            {room.myAnswer?.index === index && !reveal && <Check size={22} />}
          </button>
        );
      })}
    </div>
  );
}
