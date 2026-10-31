import { ArrowRight, Check, CheckCircle2 } from "lucide-react";
import { Pill } from "../../../components/Pill";
import { Answers } from "../../../components/game/Answers";
import { Timer } from "../../../components/game/Timer";
import { QuestionImageView } from "../../../components/game/QuestionImage";
import type { GameScreenProps } from "../types";
import { StoryDice } from "../team/StoryDice";
import { BingoJudge } from "../team/BingoBoard";

export function HostQuestion({ room, busy, act }: GameScreenProps) {
  const team = room.scores.find((score) => score.id === room.activeTeam);
  const game = room.teamGame?.id;
  const unit = room.scoreUnit ?? "pts";
  const skillShot = ["bowling", "soccer", "football", "basketball"].includes(
    game ?? "",
  );
  return (
    <div className="room-grid question-layout">
      <section
        className={"card live-question motion-" + room.phase}
        key={room.id + ":" + room.questionIndex}
      >
        <div className="section-heading">
          <Pill>
            QUESTION {room.teamGame?.questionsUsed ?? room.questionIndex + 1} OF{" "}
            {room.questionCount}
          </Pill>
          {room.phase === "question" && room.deadline ? (
            <Timer room={room} />
          ) : room.phase === "reveal" ? (
            <Pill kind="green">
              <CheckCircle2 size={15} />
              Answer revealed
            </Pill>
          ) : (
            <Pill>Untimed discussion</Pill>
          )}
        </div>
        {room.mode === "teams" && (
          <p className="team-turn">
            {game === "bingo" ? "All teams answer" : `${team?.name}’s turn`} ·{" "}
            {skillShot
              ? `Correct answers unlock a shot · ${unit}`
              : unit === "pts"
                ? `${room.question?.points} points`
                : `Playing for ${unit}`}
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
        {game === "storyDice" && (
          <StoryDice room={room} busy={busy} act={act} question />
        )}
        {game === "storyDice" ? (
          room.phase === "reveal" && (
            <p className="story-model-answer">
              <strong>Reference answer:</strong>{" "}
              {room.question?.options[room.question.correctIndex ?? 0]}
              <small>
                Judge the explanation and use of all pictures using your class
                rule.
              </small>
            </p>
          )
        ) : (
          <Answers room={room} />
        )}
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
          ) : game === "bingo" ? (
            <BingoJudge
              key={room.questionIndex}
              room={room}
              busy={busy}
              act={act}
            />
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
                  {skillShot
                    ? "Correct · unlock shot"
                    : unit === "pts"
                      ? `Correct +${room.question?.points}`
                      : "Correct · make the move"}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
