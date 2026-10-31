import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import type { GameScreenProps } from "../types";
import { QuestionImageView } from "../../../components/game/QuestionImage";
import { Timer } from "../../../components/game/Timer";
export function BalloonBoard({ room, busy, act }: GameScreenProps) {
  const state = room.teamGame!,
    word = state.word,
    active = room.scores.find((team) => team.id === room.activeTeam);
  if (room.phase === "board" || !word)
    return (
      <div className="balloon-game">
        <div className="balloon-string" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <i className={`word-balloon balloon-${i}`} key={i} />
          ))}
        </div>
        <div className="team-board-action">
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => void act("host:team-action", { type: "draw" })}
          >
            Draw a word clue
          </button>
        </div>
      </div>
    );
  return (
    <section className="team-word-screen" aria-label="Balloon word puzzle">
      <div className="section-heading">
        <strong>{active?.name}’s letter guess</strong>
        {room.deadline && <Timer room={room} />}
      </div>
      <h2 className="team-clue">{room.question?.prompt}</h2>
      <QuestionImageView image={room.question?.image} />
      <div
        className="balloon-string"
        role="img"
        aria-label={`${6 - word.misses} balloons remaining`}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <i
            className={
              `word-balloon balloon-${i}` + (i < word.misses ? " popped" : "")
            }
            style={{ "--balloon-delay": `${i * 100}ms` } as CSSProperties}
            key={`${state.round}:${i}`}
          />
        ))}
      </div>
      <div
        className="word-answer"
        aria-label={word.resolved ? `Answer: ${word.answer}` : "Hidden word"}
      >
        {word.masked.split(" ").map((part, i) => (
          <span className="word-group" key={i}>
            {[...part].map((letter, j) => (
              <b className={letter === "_" ? "unknown" : ""} key={j}>
                {letter}
              </b>
            ))}
          </span>
        ))}
      </div>
      {word.resolved ? (
        <div className="team-board-action">
          <p role="status">{state.summary}</p>
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => void act("host:team-action", { type: "continue" })}
          >
            Show rankings <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <>
          <div className="letter-keys">
            {Array.from({ length: 26 }, (_, i) =>
              String.fromCharCode(65 + i),
            ).map((letter) => (
              <button
                className="btn secondary"
                aria-label={`Guess ${letter}`}
                key={letter}
                disabled={busy || word.guessed.includes(letter)}
                onClick={() =>
                  void act("host:team-action", { type: "guess", letter })
                }
              >
                {letter}
              </button>
            ))}
          </div>
          <button
            className="btn subtle small"
            disabled={busy}
            onClick={() => void act("host:reveal")}
          >
            Reveal the word
          </button>
        </>
      )}
    </section>
  );
}
