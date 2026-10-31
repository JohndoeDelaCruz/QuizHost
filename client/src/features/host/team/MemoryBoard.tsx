import { ArrowRight } from "lucide-react";
import { QuestionImageView } from "../../../components/game/QuestionImage";
import type { GameScreenProps } from "../types";
export function MemoryBoard({ room, busy, act }: GameScreenProps) {
  const cards = room.teamGame!.cards!,
    shown = cards.filter((card) => card.selected);
  return (
    <div className="memory-game">
      {!!shown.length && (
        <div className="memory-readout">
          {shown.slice(-2).map((card) => (
            <article key={card.index}>
              <span className="eyebrow">
                {card.kind === "question" ? "QUESTION" : "ANSWER"} · CARD{" "}
                {card.index + 1}
              </span>
              <p>{card.content}</p>
              {card.image && <QuestionImageView image={card.image} />}
            </article>
          ))}
        </div>
      )}
      <div className="memory-grid">
        {cards.map((card) => (
          <button
            key={card.index}
            className={
              "memory-card" +
              (card.faceUp ? " face-up" : "") +
              (card.owner ? " is-matched" : "")
            }
            aria-label={`Card ${card.index + 1}${card.owner ? ", matched" : card.faceUp ? ", " + card.kind + ": " + card.content : ", face down"}`}
            disabled={
              busy || card.faceUp || !!card.owner || room.phase !== "board"
            }
            onClick={() =>
              void act("host:team-action", { type: "flip", index: card.index })
            }
          >
            {card.faceUp ? (
              <>
                <small>
                  {card.owner ? "MATCHED" : card.kind?.toUpperCase()}
                </small>
                <span>{card.content}</span>
              </>
            ) : (
              <>
                <span className="card-star">✦</span>
                <strong>{card.index + 1}</strong>
              </>
            )}
          </button>
        ))}
      </div>
      {room.phase === "activity" && (
        <div className="team-board-action">
          <p role="status">{room.teamGame!.summary}</p>
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => void act("host:team-action", { type: "continue" })}
          >
            Show rankings <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
